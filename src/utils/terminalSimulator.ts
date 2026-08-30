import { NetworkTopology, NetworkDevice } from '../types';
import { simulatePacketTrace } from './networkSimulator';
import { runDiagnostics, performNetworkAudit } from './diagnosticEngine';

export interface TerminalOutputLine {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'header' | 'muted';
}

export function executeSimulatedCommand(
  rawCommand: string,
  selectedDeviceId: string,
  topology: NetworkTopology
): TerminalOutputLine[] {
  const trimmed = rawCommand.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const selectedDevice = topology.devices.find(d => d.id === selectedDeviceId) || topology.devices[0];

  if (!selectedDevice) {
    return [
      { text: 'Error: No active network node selected. Please select a device in the topology canvas.', type: 'error' }
    ];
  }

  const hostname = selectedDevice.hostname || selectedDevice.name;

  // Cisco-style multi-word command matching (e.g. "show ip route", "show vlan brief")
  const fullCmdLower = trimmed.toLowerCase();

  if (fullCmdLower.startsWith('show ip route') || fullCmdLower === 'route print' || fullCmdLower === 'netstat -r') {
    const lines: TerminalOutputLine[] = [
      { text: `IPv4 Routing Table — Host: ${hostname} (Role: ${selectedDevice.type.toUpperCase()})`, type: 'header' },
      { text: `Codes: C - connected, S - static, O - OSPF, * - candidate default`, type: 'muted' },
      { text: `       Gateway of last resort is ${selectedDevice.gateway || 'not set'}\n`, type: 'muted' },
      { text: `  Type   Destination        Subnet Mask        Next-Hop            Interface`, type: 'header' }
    ];

    if (selectedDevice.ip && selectedDevice.subnetMask) {
      lines.push({
        text: `  C      ${selectedDevice.ip.padEnd(18)} ${selectedDevice.subnetMask.padEnd(18)} Directly Connected   GigabitEthernet0/0`,
        type: 'success'
      });
    }

    if (selectedDevice.gateway) {
      lines.push({
        text: `  S*     0.0.0.0            0.0.0.0            ${selectedDevice.gateway.padEnd(19)} GigabitEthernet0/0`,
        type: 'info'
      });
    }

    if (selectedDevice.routingTable && selectedDevice.routingTable.length > 0) {
      selectedDevice.routingTable.forEach(r => {
        lines.push({
          text: `  ${r.type === 'ospf' ? 'O' : 'S'}      ${r.destination.padEnd(18)} ${r.subnetMask.padEnd(18)} ${r.nextHop.padEnd(19)} ${r.interface}`,
          type: 'info'
        });
      });
    }

    return lines;
  }

  if (fullCmdLower.startsWith('show ip interface brief') || fullCmdLower.startsWith('show interfaces') || fullCmdLower === 'show int') {
    const lines: TerminalOutputLine[] = [
      { text: `Interface Summary — Node: ${hostname}`, type: 'header' },
      { text: `Interface                  IP-Address      OK? Method Status                Protocol`, type: 'muted' }
    ];

    const ifaces = selectedDevice.interfaces || [
      {
        id: 'if-0',
        name: selectedDevice.type === 'pc' || selectedDevice.type === 'laptop' ? 'eth0' : 'GigabitEthernet0/0',
        ip: selectedDevice.ip,
        status: selectedDevice.status === 'down' ? 'down' : 'up',
        mac: selectedDevice.mac
      }
    ];

    ifaces.forEach(i => {
      const nameCol = i.name.padEnd(26);
      const ipCol = (i.ip || 'unassigned').padEnd(15);
      const statusCol = (i.status === 'up' ? 'up' : 'down').padEnd(21);
      const protoCol = i.status === 'up' ? 'up' : 'down';
      lines.push({
        text: `${nameCol} ${ipCol} YES manual ${statusCol} ${protoCol}`,
        type: i.status === 'up' ? 'success' : 'error'
      });
    });

    return lines;
  }

  if (fullCmdLower.startsWith('show vlan')) {
    const lines: TerminalOutputLine[] = [
      { text: `VLAN Configuration Table — Node: ${hostname}`, type: 'header' },
      { text: `VLAN Name                             Status    Ports`, type: 'muted' },
      { text: `---- -------------------------------- --------- -------------------------------`, type: 'muted' },
      { text: `1    default                          active    Gi0/1, Gi0/2, Gi0/3`, type: 'info' }
    ];

    if (topology.vlans && topology.vlans.length > 0) {
      topology.vlans.forEach(v => {
        lines.push({
          text: `${v.vlanId.toString().padEnd(4)} ${v.name.padEnd(32)} active    ${v.subnet}/${v.cidr} (GW: ${v.gateway})`,
          type: 'success'
        });
      });
    } else if (selectedDevice.vlan) {
      lines.push({
        text: `${selectedDevice.vlan.toString().padEnd(4)} VLAN_${selectedDevice.vlan.toString().padEnd(27)} active    Assigned to host interface`,
        type: 'info'
      });
    }

    return lines;
  }

  if (fullCmdLower.startsWith('show running-config') || fullCmdLower === 'show run') {
    return [
      { text: `! Building configuration...`, type: 'muted' },
      { text: `! Current configuration : 1024 bytes`, type: 'muted' },
      { text: `version 15.2`, type: 'info' },
      { text: `hostname ${hostname}`, type: 'success' },
      { text: `!`, type: 'muted' },
      { text: `interface GigabitEthernet0/0`, type: 'info' },
      { text: ` description Connected to local infrastructure`, type: 'muted' },
      { text: ` ip address ${selectedDevice.ip || 'dhcp'} ${selectedDevice.subnetMask || '255.255.255.0'}`, type: 'info' },
      { text: ` ${selectedDevice.status === 'up' ? 'no shutdown' : 'shutdown'}`, type: selectedDevice.status === 'up' ? 'success' : 'error' },
      { text: `!`, type: 'muted' },
      ...(selectedDevice.gateway ? [
        { text: `ip default-gateway ${selectedDevice.gateway}`, type: 'info' as const },
        { text: `ip route 0.0.0.0 0.0.0.0 ${selectedDevice.gateway}`, type: 'info' as const }
      ] : []),
      { text: `!`, type: 'muted' },
      { text: `end`, type: 'muted' }
    ];
  }

  switch (cmd) {
    case 'help':
    case '?':
      return [
        { text: 'NET-LAB Interactive CLI Terminal — Supported Commands:', type: 'header' },
        { text: '  ping <target_ip|name>       Send ICMP Echo Requests to test end-to-end connectivity', type: 'info' },
        { text: '  traceroute <target_ip|name> Trace hop-by-hop L3 routing path through topology', type: 'info' },
        { text: '  tracert <target_ip|name>    Windows equivalent of traceroute', type: 'info' },
        { text: '  ipconfig [/all]             Display current IPv4, Subnet Mask, Gateway & MAC', type: 'info' },
        { text: '  ifconfig                    Linux/Unix interface configuration summary', type: 'info' },
        { text: '  arp -a / show arp           Display local ARP address resolution cache table', type: 'info' },
        { text: '  show ip route / route print Display active IPv4 routing table and gateway routes', type: 'info' },
        { text: '  show interfaces             Display interface status, IP, and duplex states', type: 'info' },
        { text: '  show vlan                   Display VLAN segmentation and active memberships', type: 'info' },
        { text: '  show running-config         Generate Cisco IOS-style running configuration', type: 'info' },
        { text: '  nslookup <domain|ip>        Query DNS resolver for hostname / IP records', type: 'info' },
        { text: '  netstat -an                 Display active listening ports and sockets', type: 'info' },
        { text: '  diagnose                    Run full Layer 1-7 automated network diagnostic test', type: 'info' },
        { text: '  audit                       Run complete Network Architecture Quality Audit & Score', type: 'info' },
        { text: '  clear / cls                 Clear terminal buffer', type: 'muted' },
        { text: `Context: Commands execute on currently selected device (${hostname}).`, type: 'muted' }
      ];

    case 'clear':
    case 'cls':
      return [{ text: '__CLEAR__', type: 'info' }];

    case 'ipconfig':
      return [
        { text: `\nWindows IP Configuration — Node: ${hostname}`, type: 'header' },
        { text: `Ethernet adapter Local Area Connection:`, type: 'info' },
        { text: `   Connection-specific DNS Suffix  . : netlab.internal`, type: 'muted' },
        { text: `   Physical Address. . . . . . . . . : ${selectedDevice.mac || '00-50-56-C0-00-08'}`, type: 'info' },
        { text: `   IPv4 Address. . . . . . . . . . . : ${selectedDevice.ip || '0.0.0.0 (Unconfigured)'}`, type: selectedDevice.ip ? 'success' : 'error' },
        { text: `   Subnet Mask . . . . . . . . . . . : ${selectedDevice.subnetMask || '255.255.255.0'}`, type: 'info' },
        { text: `   Default Gateway . . . . . . . . . : ${selectedDevice.gateway || '0.0.0.0 (None)'}`, type: selectedDevice.gateway ? 'info' : 'warning' },
        { text: `   DNS Servers . . . . . . . . . . . : ${selectedDevice.dns || '8.8.8.8'}`, type: 'info' },
        { text: `   VLAN ID . . . . . . . . . . . . . : ${selectedDevice.vlan || 1}`, type: 'muted' }
      ];

    case 'ifconfig':
      return [
        { text: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`, type: 'header' },
        { text: `        inet ${selectedDevice.ip || '0.0.0.0'}  netmask ${selectedDevice.subnetMask || '255.255.255.0'}  broadcast 192.168.1.255`, type: selectedDevice.ip ? 'success' : 'error' },
        { text: `        ether ${selectedDevice.mac || '00:50:56:c0:00:08'}  txqueuelen 1000  (Ethernet)`, type: 'info' },
        { text: `        RX packets 1420  bytes 118492 (115.7 KB)`, type: 'muted' },
        { text: `        TX packets 1380  bytes 104230 (101.7 KB)`, type: 'muted' },
        { text: `        RX errors 0  dropped 0  overruns 0  frame 0`, type: 'muted' }
      ];

    case 'arp':
    case 'show':
      if (args[0] === '-a' || args[0] === 'arp' || args.length === 0) {
        const arpLines: TerminalOutputLine[] = [
          { text: `Interface: ${selectedDevice.ip || '192.168.1.10'} --- 0x2`, type: 'header' },
          { text: `  Internet Address      Physical Address      Type`, type: 'muted' }
        ];

        topology.devices.forEach(d => {
          if (d.id !== selectedDevice.id && d.ip) {
            arpLines.push({
              text: `  ${d.ip.padEnd(21)} ${(d.mac || '00-1a-2b-3c-4d-5e').padEnd(21)} dynamic`,
              type: 'info'
            });
          }
        });

        if (selectedDevice.gateway) {
          arpLines.push({
            text: `  ${selectedDevice.gateway.padEnd(21)} 00-0c-29-fa-11-a2      dynamic (Gateway)`,
            type: 'success'
          });
        }

        return arpLines;
      }
      break;

    case 'ping':
      if (args.length === 0) {
        return [
          { text: 'Usage: ping <destination_ip | hostname>', type: 'warning' },
          { text: 'Example: ping 192.168.1.1 or ping PC2', type: 'muted' }
        ];
      }

      const target = args[0];
      const traceResult = simulatePacketTrace(topology, selectedDevice.id, target);

      if (!traceResult.success) {
        return [
          { text: `Pinging ${target} with 32 bytes of data:`, type: 'header' },
          { text: `Request timed out.`, type: 'error' },
          { text: `Request timed out.`, type: 'error' },
          { text: `Request timed out.`, type: 'error' },
          { text: `Request timed out.`, type: 'error' },
          { text: `\nPing statistics for ${target}:`, type: 'header' },
          { text: `    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`, type: 'error' },
          { text: `Failure Root Cause: ${traceResult.summary}`, type: 'warning' },
          ...(traceResult.troubleshootingTip ? [{ text: `Remediation Tip: ${traceResult.troubleshootingTip}`, type: 'info' as const }] : [])
        ];
      }

      const destDev = topology.devices.find(d => d.ip === target || d.name.toLowerCase() === target.toLowerCase());
      const resolvedIp = destDev?.ip || target;

      return [
        { text: `Pinging ${resolvedIp} with 32 bytes of ICMP Echo data:`, type: 'header' },
        { text: `Reply from ${resolvedIp}: bytes=32 time=1.2ms TTL=64`, type: 'success' },
        { text: `Reply from ${resolvedIp}: bytes=32 time=0.9ms TTL=64`, type: 'success' },
        { text: `Reply from ${resolvedIp}: bytes=32 time=1.1ms TTL=64`, type: 'success' },
        { text: `Reply from ${resolvedIp}: bytes=32 time=0.8ms TTL=64`, type: 'success' },
        { text: `\nPing statistics for ${resolvedIp}:`, type: 'header' },
        { text: `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`, type: 'success' },
        { text: `Approximate round trip times in milli-seconds:`, type: 'muted' },
        { text: `    Minimum = 0.8ms, Maximum = 1.2ms, Average = 1.0ms`, type: 'muted' },
        { text: `Path traversed: ${traceResult.totalHops} hops across topology.`, type: 'info' }
      ];

    case 'traceroute':
    case 'tracert':
      if (args.length === 0) {
        return [{ text: 'Usage: traceroute <target_ip | hostname>', type: 'warning' }];
      }

      const trTarget = args[0];
      const trResult = simulatePacketTrace(topology, selectedDevice.id, trTarget);

      const lines: TerminalOutputLine[] = [
        { text: `Tracing route to ${trTarget} over a maximum of 30 hops:`, type: 'header' }
      ];

      trResult.hops.forEach((hop, idx) => {
        const ms = (0.5 + idx * 0.7).toFixed(1);
        if (hop.status === 'dropped') {
          lines.push({
            text: `  ${(idx + 1).toString().padStart(2)}   *        *        *     Request timed out [${hop.action}: ${hop.dropReason || 'Dropped'}]`,
            type: 'error'
          });
        } else {
          lines.push({
            text: `  ${(idx + 1).toString().padStart(2)}   ${ms} ms   ${ms} ms   ${ms} ms  ${hop.deviceName} [${hop.sourceIp}]`,
            type: 'success'
          });
        }
      });

      if (trResult.success) {
        lines.push({ text: `\nTrace complete across ${trResult.totalHops} hops.`, type: 'info' });
      } else {
        lines.push({ text: `\nTrace halted: ${trResult.summary}`, type: 'warning' });
      }

      return lines;

    case 'nslookup':
      const domain = args[0] || 'netlab.local';
      return [
        { text: `Server:  netlab-dns.local`, type: 'header' },
        { text: `Address: 8.8.8.8`, type: 'muted' },
        { text: `\nNon-authoritative answer:`, type: 'info' },
        { text: `Name:    ${domain}`, type: 'success' },
        { text: `Address: 192.168.1.100`, type: 'success' },
        { text: `Aliases: www.${domain}`, type: 'muted' }
      ];

    case 'netstat':
      return [
        { text: `Active Connections — Host: ${hostname}`, type: 'header' },
        { text: `  Proto  Local Address          Foreign Address        State`, type: 'muted' },
        { text: `  TCP    ${selectedDevice.ip || '127.0.0.1'}:80           0.0.0.0:0              LISTENING`, type: 'info' },
        { text: `  TCP    ${selectedDevice.ip || '127.0.0.1'}:443          0.0.0.0:0              LISTENING`, type: 'info' },
        { text: `  TCP    ${selectedDevice.ip || '127.0.0.1'}:22           0.0.0.0:0              LISTENING`, type: 'info' },
        { text: `  UDP    0.0.0.0:68             0.0.0.0:*                                      DHCP Client`, type: 'muted' }
      ];

    case 'diagnose':
      const diag = runDiagnostics(topology);
      const diagLines: TerminalOutputLine[] = [
        { text: `\n═════════════════════════════════════════════════════════════════════`, type: 'header' },
        { text: `  NET-LAB SYSTEMATIC LAYER 1-7 DIAGNOSTIC REPORT`, type: 'header' },
        { text: `═════════════════════════════════════════════════════════════════════`, type: 'header' },
        { text: `Evaluated at: ${new Date().toLocaleTimeString()} | Total Nodes: ${topology.devices.length} | Links: ${topology.connections.length}`, type: 'muted' },
        { text: `Overall Status: ${diag.healthy ? 'HEALTHY (PASS)' : 'CRITICAL ISSUES DETECTED'}`, type: diag.healthy ? 'success' : 'error' },
        { text: `\nChecks Executed:`, type: 'header' }
      ];

      diag.checksPerformed.forEach(c => {
        diagLines.push({ text: `  [✓] ${c}`, type: 'info' });
      });

      if (diag.issues.length === 0) {
        diagLines.push({ text: `\nNo faults found! Topology is fully compliant.`, type: 'success' });
      } else {
        diagLines.push({ text: `\nIdentified Faults (${diag.issues.length}):`, type: 'header' });
        diag.issues.forEach((iss, idx) => {
          diagLines.push({ text: `\n[${idx + 1}] [${iss.severity.toUpperCase()}] ${iss.title}`, type: iss.severity === 'critical' ? 'error' : 'warning' });
          diagLines.push({ text: `    Layer: ${iss.layer} | Affected: ${iss.affectedDevices.join(', ')}`, type: 'muted' });
          diagLines.push({ text: `    Evidence: ${iss.evidence}`, type: 'muted' });
          diagLines.push({ text: `    Fix: ${iss.howToFix}`, type: 'info' });
        });
      }

      return diagLines;

    case 'audit':
      const audit = performNetworkAudit(topology);
      const auditLines: TerminalOutputLine[] = [
        { text: `\n═════════════════════════════════════════════════════════════════════`, type: 'header' },
        { text: `  NET-LAB ENTERPRISE NETWORK QUALITY SCORE AUDIT`, type: 'header' },
        { text: `═════════════════════════════════════════════════════════════════════`, type: 'header' },
        { text: `Overall Architecture Score: ${audit.overallScore}/100  |  Grade: ${audit.grade}`, type: audit.overallScore >= 70 ? 'success' : 'warning' },
        { text: `Executive Summary: ${audit.executiveSummary}`, type: 'info' },
        { text: `\nCategory Breakdown:`, type: 'header' }
      ];

      audit.categories.forEach(cat => {
        auditLines.push({
          text: `  • ${cat.name.padEnd(38)}: ${cat.score}/${cat.maxScore} pts (${Math.round((cat.score/cat.maxScore)*100)}%)`,
          type: cat.score === cat.maxScore ? 'success' : cat.score >= cat.maxScore * 0.7 ? 'info' : 'warning'
        });
      });

      if (audit.criticalFindings.length > 0) {
        auditLines.push({ text: `\nCritical Deficiencies:`, type: 'error' });
        audit.criticalFindings.forEach(f => auditLines.push({ text: `  [!] ${f}`, type: 'error' }));
      }

      if (audit.passedChecks.length > 0) {
        auditLines.push({ text: `\nBest Practice Compliances:`, type: 'success' });
        audit.passedChecks.forEach(p => auditLines.push({ text: `  [✓] ${p}`, type: 'success' }));
      }

      return auditLines;

    default:
      return [
        { text: `Command not recognized: '${rawCommand}'.`, type: 'error' },
        { text: `Type 'help' or '?' for a list of supported educational networking commands.`, type: 'muted' }
      ];
  }

  return [];
}
