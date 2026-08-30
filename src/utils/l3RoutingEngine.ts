import { NetworkDevice, NetworkTopology, PacketHop, RoutingTableEntry } from '../types';

export interface L3RouteDecision {
  routerId: string;
  routerName: string;
  destination: string;
  matchedRoute?: RoutingTableEntry;
  nextHop: string;
  outgoingInterface?: string;
  reason: string;
}

export interface L3ForwardingResult {
  success: boolean;
  path: string[];
  decisions: L3RouteDecision[];
  hops: PacketHop[];
  failureReason?: string;
}

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4 || parts.some(p => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.some(n => n < 0 || n > 255)) return null;
  return ((nums[0] * 256 + nums[1]) * 256 + nums[2]) * 256 + nums[3];
}

function maskToInt(mask: string, cidr?: number): number | null {
  if (typeof cidr === 'number') {
    if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) return null;
    return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  }
  const parsed = ipToInt(mask);
  if (parsed === null) return null;
  const binary = parsed.toString(2).padStart(32, '0');
  if (!/^1*0*$/.test(binary)) return null;
  return parsed >>> 0;
}

function sameSubnet(ip: number, routeIp: number, mask: number): boolean {
  return ((ip >>> 0) & mask) === ((routeIp >>> 0) & mask);
}

function prefixLength(mask: number): number {
  return mask.toString(2).padStart(32, '0').split('1').length - 1;
}

function getRoutePrefix(route: RoutingTableEntry): number {
  const mask = maskToInt(route.subnetMask, route.cidr);
  return mask === null ? -1 : prefixLength(mask);
}

function findRoute(router: NetworkDevice, destinationIp: string): RoutingTableEntry | undefined {
  const destination = ipToInt(destinationIp);
  if (destination === null) return undefined;

  const routes = (router.routingTable ?? []).filter(route => {
    const network = ipToInt(route.destination);
    const mask = maskToInt(route.subnetMask, route.cidr);
    return network !== null && mask !== null && sameSubnet(destination, network, mask);
  });

  routes.sort((a, b) => {
    const prefixDiff = getRoutePrefix(b) - getRoutePrefix(a);
    if (prefixDiff !== 0) return prefixDiff;
    return (a.adminDistance ?? 255) - (b.adminDistance ?? 255);
  });

  return routes[0];
}

function isRouter(device: NetworkDevice): boolean {
  return device.type === 'router' || device.type === 'firewall';
}

function connectedRouterNeighbors(topology: NetworkTopology, routerId: string): NetworkDevice[] {
  const links = topology.connections.filter(c => c.status !== 'down' && c.packetLossPercent !== 100);
  const ids = new Set<string>();
  for (const link of links) {
    if (link.sourceDeviceId === routerId) ids.add(link.targetDeviceId);
    if (link.targetDeviceId === routerId) ids.add(link.sourceDeviceId);
  }
  return topology.devices.filter(d => ids.has(d.id) && isRouter(d));
}

function routeCanReachNeighbor(router: NetworkDevice, neighbor: NetworkDevice): boolean {
  if (!neighbor.ip) return true;
  return (router.routingTable ?? []).some(route => route.nextHop === neighbor.ip || route.type === 'connected');
}

export function decideL3Route(router: NetworkDevice, destinationIp: string): L3RouteDecision {
  const route = findRoute(router, destinationIp);
  if (!route) {
    return {
      routerId: router.id,
      routerName: router.name,
      destination: destinationIp,
      nextHop: 'UNREACHABLE',
      reason: 'No matching route. The router cannot forward this destination.'
    };
  }

  return {
    routerId: router.id,
    routerName: router.name,
    destination: destinationIp,
    matchedRoute: route,
    nextHop: route.nextHop || destinationIp,
    outgoingInterface: route.interface,
    reason: `${route.type.toUpperCase()} route selected using longest-prefix match (${getRoutePrefix(route)} bits).`
  };
}

/**
 * Router-by-router L3 forwarding engine.
 * Unlike a physical-topology BFS, this function only advances through routers
 * when the current router has a valid routing decision for the destination.
 */
export function simulateL3Forwarding(
  topology: NetworkTopology,
  sourceDeviceId: string,
  destinationIp: string,
  maxHops = 32
): L3ForwardingResult {
  const source = topology.devices.find(d => d.id === sourceDeviceId);
  if (!source || !source.ip) {
    return { success: false, path: [], decisions: [], hops: [], failureReason: 'Source device or source IP is missing.' };
  }
  if (ipToInt(destinationIp) === null) {
    return { success: false, path: [], decisions: [], hops: [], failureReason: 'Destination IP is invalid.' };
  }

  const destination = topology.devices.find(d => d.ip === destinationIp);
  const decisions: L3RouteDecision[] = [];
  const hops: PacketHop[] = [];
  const path: string[] = [source.id];
  const visited = new Set<string>();
  let current = source;
  let ttl = 64;

  // Directly connected destination: no router lookup is required.
  if (destination && destination.id !== source.id) {
    const sourceRoute = findRoute(source, destinationIp);
    if (sourceRoute?.type === 'connected') {
      path.push(destination.id);
      hops.push({
        hopNumber: 1,
        deviceId: source.id,
        deviceName: source.name,
        deviceType: source.type,
        action: 'DELIVER',
        explanation: 'Destination is on a directly connected network.',
        layer: 'Network', sourceIp: source.ip, destIp: destinationIp,
        protocol: 'IP', ttl, status: 'success'
      });
      return { success: true, path, decisions, hops };
    }
  }

  for (let step = 1; step <= maxHops; step++) {
    if (visited.has(current.id)) {
      return { success: false, path, decisions, hops, failureReason: 'Routing loop detected.' };
    }
    visited.add(current.id);

    if (current.ip === destinationIp) {
      return { success: true, path, decisions, hops };
    }

    if (!isRouter(current)) {
      const gateway = current.gateway;
      const gatewayDevice = topology.devices.find(d => d.ip === gateway && isRouter(d));
      if (!gatewayDevice) {
        return { success: false, path, decisions, hops, failureReason: 'Source has no reachable default gateway.' };
      }
      current = gatewayDevice;
      path.push(current.id);
      ttl--;
      continue;
    }

    const decision = decideL3Route(current, destinationIp);
    decisions.push(decision);
    if (!decision.matchedRoute) {
      hops.push({
        hopNumber: step,
        deviceId: current.id,
        deviceName: current.name,
        deviceType: current.type,
        action: 'DROP',
        explanation: decision.reason,
        layer: 'Network', sourceIp: source.ip, destIp: destinationIp,
        protocol: 'IP', ttl, status: 'dropped', dropReason: 'No route'
      });
      return { success: false, path, decisions, hops, failureReason: decision.reason };
    }

    ttl--;
    if (ttl <= 0) {
      return { success: false, path, decisions, hops, failureReason: 'TTL expired while forwarding.' };
    }

    const route = decision.matchedRoute;
    if (destination && route.type === 'connected' && routeCanReachNeighbor(current, destination)) {
      path.push(destination.id);
      hops.push({
        hopNumber: step,
        deviceId: current.id,
        deviceName: current.name,
        deviceType: current.type,
        action: 'DELIVER',
        explanation: `Connected route ${route.destination}/${getRoutePrefix(route)} directly contains the destination.`,
        layer: 'Network', sourceIp: source.ip, destIp: destinationIp,
        protocol: 'IP', ttl, status: 'success'
      });
      return { success: true, path, decisions, hops };
    }

    const nextHop = topology.devices.find(d => d.ip === decision.nextHop && isRouter(d));
    if (!nextHop) {
      const neighbors = connectedRouterNeighbors(topology, current.id);
      const fallback = neighbors.find(n => n.ip === decision.nextHop);
      if (!fallback) {
        return { success: false, path, decisions, hops, failureReason: `Next hop ${decision.nextHop} is not reachable from ${current.name}.` };
      }
    }

    const next = nextHop ?? connectedRouterNeighbors(topology, current.id).find(n => n.ip === decision.nextHop);
    if (!next) {
      return { success: false, path, decisions, hops, failureReason: `Unable to resolve next hop ${decision.nextHop}.` };
    }

    hops.push({
      hopNumber: step,
      deviceId: current.id,
      deviceName: current.name,
      deviceType: current.type,
      action: 'FORWARD',
      explanation: decision.reason,
      details: `Next hop ${decision.nextHop} via ${decision.outgoingInterface ?? 'unknown interface'}.`,
      layer: 'Network', sourceIp: source.ip, destIp: destinationIp,
      protocol: 'IP', ttl, status: 'forwarded'
    });
    current = next;
    path.push(current.id);
  }

  return { success: false, path, decisions, hops, failureReason: `Maximum hop count (${maxHops}) exceeded.` };
}
