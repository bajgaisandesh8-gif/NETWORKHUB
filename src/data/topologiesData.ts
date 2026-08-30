import { NetworkTopology } from '../types';

export const PRESET_TOPOLOGIES: NetworkTopology[] = [
  {
    id: 'topo-default-lan',
    name: 'Small Office / Home Office (SOHO) LAN',
    description: 'Basic local area network with Workstation, Laptop, Local File Server, PoE Switch, and Gateway Router.',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    devices: [
      { id: 'dev-pc1', name: 'Workstation-1', type: 'pc', x: 120, y: 160, ip: '192.168.1.10', subnetMask: '255.255.255.0', gateway: '192.168.1.1', dns: '8.8.8.8', mac: '00:50:56:A1:B2:C1', status: 'up' },
      { id: 'dev-laptop1', name: 'Laptop-CEO', type: 'laptop', x: 120, y: 300, ip: '192.168.1.15', subnetMask: '255.255.255.0', gateway: '192.168.1.1', dns: '8.8.8.8', mac: '00:50:56:A1:B2:C2', status: 'up' },
      { id: 'dev-sw1', name: 'Access-Switch-1', type: 'switch', x: 340, y: 230, status: 'up' },
      { id: 'dev-srv1', name: 'File-Server', type: 'server', x: 340, y: 80, ip: '192.168.1.200', subnetMask: '255.255.255.0', gateway: '192.168.1.1', dns: '8.8.8.8', mac: '00:50:56:A1:B2:C3', status: 'up' },
      { id: 'dev-rtr1', name: 'Edge-Router', type: 'router', x: 560, y: 230, ip: '192.168.1.1', subnetMask: '255.255.255.0', dns: '8.8.8.8', mac: '00:50:56:A1:B2:C4', status: 'up' },
      { id: 'dev-inet', name: 'Internet (WAN)', type: 'internet', x: 740, y: 230, ip: '8.8.8.8', status: 'up' }
    ],
    connections: [
      { id: 'conn-1', sourceDeviceId: 'dev-pc1', targetDeviceId: 'dev-sw1', type: 'ethernet', status: 'up' },
      { id: 'conn-2', sourceDeviceId: 'dev-laptop1', targetDeviceId: 'dev-sw1', type: 'ethernet', status: 'up' },
      { id: 'conn-3', sourceDeviceId: 'dev-srv1', targetDeviceId: 'dev-sw1', type: 'ethernet', status: 'up' },
      { id: 'conn-4', sourceDeviceId: 'dev-sw1', targetDeviceId: 'dev-rtr1', type: 'fiber', status: 'up' },
      { id: 'conn-5', sourceDeviceId: 'dev-rtr1', targetDeviceId: 'dev-inet', type: 'fiber', status: 'up' }
    ]
  },
  {
    id: 'topo-enterprise-vlan',
    name: 'Enterprise Multi-VLAN Segmentation',
    description: 'Corporate network with isolated Engineering (VLAN 10), HR (VLAN 20), DMZ Web Server (VLAN 30), and Perimeter Firewall.',
    createdAt: '2026-02-01T12:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z',
    devices: [
      { id: 'v-pc-eng', name: 'Eng-Workstation', type: 'pc', x: 100, y: 120, ip: '10.10.10.50', subnetMask: '255.255.255.0', gateway: '10.10.10.1', vlan: 10, mac: '52:54:00:10:10:50', status: 'up' },
      { id: 'v-pc-hr', name: 'HR-Workstation', type: 'pc', x: 100, y: 280, ip: '10.10.20.50', subnetMask: '255.255.255.0', gateway: '10.10.20.1', vlan: 20, mac: '52:54:00:10:20:50', status: 'up' },
      { id: 'v-sw-dist', name: 'Core-Trunk-Switch', type: 'switch', x: 300, y: 200, status: 'up' },
      { id: 'v-fw', name: 'NextGen-Firewall', type: 'firewall', x: 480, y: 200, ip: '10.10.1.1', subnetMask: '255.255.255.0', status: 'up' },
      { id: 'v-srv-web', name: 'Public-Web-Server', type: 'server', x: 480, y: 70, ip: '10.10.30.100', subnetMask: '255.255.255.0', gateway: '10.10.30.1', vlan: 30, mac: '52:54:00:10:30:10', status: 'up' },
      { id: 'v-rtr', name: 'WAN-Edge-Router', type: 'router', x: 660, y: 200, ip: '198.51.100.1', subnetMask: '255.255.255.0', status: 'up' }
    ],
    connections: [
      { id: 'v-c1', sourceDeviceId: 'v-pc-eng', targetDeviceId: 'v-sw-dist', type: 'ethernet', status: 'up' },
      { id: 'v-c2', sourceDeviceId: 'v-pc-hr', targetDeviceId: 'v-sw-dist', type: 'ethernet', status: 'up' },
      { id: 'v-c3', sourceDeviceId: 'v-sw-dist', targetDeviceId: 'v-fw', type: 'fiber', status: 'up' },
      { id: 'v-c4', sourceDeviceId: 'v-fw', targetDeviceId: 'v-srv-web', type: 'ethernet', status: 'up' },
      { id: 'v-c5', sourceDeviceId: 'v-fw', targetDeviceId: 'v-rtr', type: 'fiber', status: 'up' }
    ]
  },
  {
    id: 'topo-broken-scenario',
    name: 'Troubleshooting Mystery: Broken Subnet & Cable',
    description: 'Broken network with 3 hidden faults: IP conflict, wrong gateway, and down interface. Perfect for diagnostic testing.',
    createdAt: '2026-02-10T14:00:00.000Z',
    updatedAt: '2026-02-10T14:00:00.000Z',
    devices: [
      { id: 'b-pc1', name: 'Finance-PC-1', type: 'pc', x: 120, y: 140, ip: '192.168.1.50', subnetMask: '255.255.255.0', gateway: '192.168.99.1', mac: '00:11:22:33:44:55', status: 'up' },
      { id: 'b-pc2', name: 'Finance-PC-2', type: 'pc', x: 120, y: 280, ip: '192.168.1.50', subnetMask: '255.255.255.0', gateway: '192.168.1.1', mac: '00:11:22:33:44:66', status: 'up' },
      { id: 'b-sw', name: 'Finance-Switch', type: 'switch', x: 340, y: 210, status: 'up' },
      { id: 'b-rtr', name: 'Gateway-Router', type: 'router', x: 560, y: 210, ip: '192.168.1.1', subnetMask: '255.255.255.0', status: 'up' }
    ],
    connections: [
      { id: 'b-c1', sourceDeviceId: 'b-pc1', targetDeviceId: 'b-sw', type: 'ethernet', status: 'up' },
      { id: 'b-c2', sourceDeviceId: 'b-pc2', targetDeviceId: 'b-sw', type: 'ethernet', status: 'up' },
      { id: 'b-c3', sourceDeviceId: 'b-sw', targetDeviceId: 'b-rtr', type: 'ethernet', status: 'down' }
    ]
  }
];
