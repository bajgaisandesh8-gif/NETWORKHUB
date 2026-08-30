import { ProtocolInfo } from '../types';

export const PROTOCOLS_DATA: ProtocolInfo[] = [
  {
    id: 'http',
    name: 'HTTP',
    fullName: 'Hypertext Transfer Protocol',
    layer: 'Application',
    transportProtocol: 'TCP',
    port: 80,
    description: 'Stateless application-layer protocol for distributed, collaborative, hypermedia information systems. Foundation of World Wide Web data communication.',
    headerFields: [
      { field: 'Method / URI', sizeBits: 0, description: 'GET, POST, PUT, DELETE, PATCH, OPTIONS request tokens' },
      { field: 'Headers', sizeBits: 0, description: 'Key-value metadata (Host, User-Agent, Content-Type, Authorization)' },
      { field: 'Body', sizeBits: 0, description: 'Payload payload (JSON, HTML, binary streams)' }
    ],
    realWorldUse: 'Loading unencrypted web pages, legacy REST APIs, and captive network portals.',
    securityConsiderations: [
      'Transmits data in plaintext (cleartext)',
      'Vulnerable to Man-in-the-Middle (MitM) eavesdropping',
      'Should always be upgraded to HTTPS via HSTS'
    ],
    troubleshootingTips: [
      'Use curl -v or Wireshark to inspect HTTP status codes (200, 301, 403, 404, 500, 502)',
      'Verify port 80 is listening via netstat or ss',
      'Check firewall NAT/port forwarding rules'
    ],
    packetConcept: 'Request/Response model over reliable TCP stream with 3-way handshake (SYN, SYN-ACK, ACK).'
  },
  {
    id: 'https',
    name: 'HTTPS',
    fullName: 'Hypertext Transfer Protocol Secure',
    layer: 'Application',
    transportProtocol: 'TCP',
    port: 443,
    description: 'HTTP encrypted using Transport Layer Security (TLS/SSL) to provide authentication, confidentiality, and data integrity.',
    headerFields: [
      { field: 'TLS Record Layer', sizeBits: 40, description: 'Content Type, Version, and Length' },
      { field: 'TLS Handshake Protocol', sizeBits: 0, description: 'ClientHello, ServerHello, Certificate, Key Exchange' },
      { field: 'Encrypted Application Data', sizeBits: 0, description: 'AES-GCM or ChaCha20-Poly1305 encrypted HTTP payload' }
    ],
    realWorldUse: 'Modern web browsing, banking, e-commerce, and enterprise microservice communication.',
    securityConsiderations: [
      'Requires valid CA-signed X.509 certificate',
      'TLS 1.3 preferred for forward secrecy and 1-RTT handshake',
      'Protects against packet sniffing and session hijacking'
    ],
    troubleshootingTips: [
      'Inspect certificate expiry dates using openssl s_client -connect host:443',
      'Check for SNI (Server Name Indication) mismatches and cipher suite incompatibilities',
      'Verify clock synchronization via NTP (expired certificate errors)'
    ],
    packetConcept: 'TCP 3-way handshake followed by TLS 1.3 Key Exchange before HTTP data transfer.'
  },
  {
    id: 'dns',
    name: 'DNS',
    fullName: 'Domain Name System',
    layer: 'Application',
    transportProtocol: 'UDP',
    port: 53,
    description: 'Hierarchical, decentralized naming system that translates human-readable domain names (e.g. netlab.edu) into numerical IP addresses (e.g. 192.168.1.10).',
    headerFields: [
      { field: 'Transaction ID', sizeBits: 16, description: 'Matches queries with responses' },
      { field: 'Flags (QR, Opcode, AA, TC, RD, RA, RCODE)', sizeBits: 16, description: 'Control bits and response status codes' },
      { field: 'Questions / Answer RRs', sizeBits: 32, description: 'Count of queries and resource records' }
    ],
    realWorldUse: 'Internet domain resolution, service discovery (SRV records), mail exchange routing (MX records).',
    securityConsiderations: [
      'DNS cache poisoning / spoofing',
      'DNS amplification DDoS attacks',
      'Mitigated using DNSSEC, DoH (DNS over HTTPS), and DoT (DNS over TLS)'
    ],
    troubleshootingTips: [
      'Test resolution with nslookup <domain> or dig +trace <domain>',
      'Verify host default DNS IP matches working resolver (e.g. 8.8.8.8, 1.1.1.1)',
      'Clear local OS resolver cache (ipconfig /flushdns)'
    ],
    packetConcept: 'Stateless 512-byte UDP datagram queries with fallback to TCP for zone transfers (AXFR) or large responses.'
  },
  {
    id: 'dhcp',
    name: 'DHCP',
    fullName: 'Dynamic Host Configuration Protocol',
    layer: 'Application',
    transportProtocol: 'UDP',
    port: '67 (Server) / 68 (Client)',
    description: 'Network management protocol used to dynamically assign IP addresses, subnet masks, default gateways, and DNS servers to client devices.',
    headerFields: [
      { field: 'Message Type (OpCode)', sizeBits: 8, description: '1=BOOTREQUEST (Client), 2=BOOTREPLY (Server)' },
      { field: 'Transaction ID (xid)', sizeBits: 32, description: 'Random identifier matching DORA transaction' },
      { field: 'Client IP (ciaddr) / Your IP (yiaddr)', sizeBits: 64, description: 'Offered and bound client IP addresses' },
      { field: 'DHCP Options', sizeBits: 0, description: 'Subnet Mask (Opt 1), Router (Opt 3), DNS (Opt 6), Lease Time (Opt 51)' }
    ],
    realWorldUse: 'Automatic network setup for laptops, smartphones, IoT devices in homes, campuses, and enterprise offices.',
    securityConsiderations: [
      'Rogue DHCP servers offering fake default gateways (MitM)',
      'DHCP starvation attacks exhausting IP pools',
      'Mitigated by Switch DHCP Snooping and Option 82'
    ],
    troubleshootingTips: [
      'Verify DORA sequence: Discover (Broadcast) -> Offer (Unicast/Broadcast) -> Request -> Acknowledge',
      'Check DHCP IP pool exhaustion and excluded address reservations',
      'Verify IP Helper Address (DHCP Relay) configured on inter-VLAN routers'
    ],
    packetConcept: 'DORA 4-step handshake utilizing UDP broadcast 255.255.255.255 before client has an assigned IP.'
  },
  {
    id: 'arp',
    name: 'ARP',
    fullName: 'Address Resolution Protocol',
    layer: 'Data Link',
    transportProtocol: 'IP',
    port: 'N/A (EtherType 0x0806)',
    description: 'Maps known Layer 3 IPv4 addresses to unknown Layer 2 physical MAC addresses within a local broadcast domain.',
    headerFields: [
      { field: 'Hardware / Protocol Type', sizeBits: 32, description: '0x0001 (Ethernet) / 0x0800 (IPv4)' },
      { field: 'Hardware / Protocol Size', sizeBits: 16, description: '6 bytes MAC / 4 bytes IPv4' },
      { field: 'Opcode', sizeBits: 16, description: '1 = ARP Request, 2 = ARP Reply' },
      { field: 'Sender & Target MAC/IP', sizeBits: 160, description: 'Source/Target hardware and network addresses' }
    ],
    realWorldUse: 'Building local switch MAC tables and enabling Layer 2 Ethernet frame encapsulation.',
    securityConsiderations: [
      'ARP Cache Poisoning / ARP Spoofing allows unauthenticated MitM attacks',
      'Mitigated by Dynamic ARP Inspection (DAI) on managed switches'
    ],
    troubleshootingTips: [
      'Inspect local ARP cache using arp -a',
      'Look for duplicate IP addresses causing ARP flapping',
      'Ensure target host is on same subnet or query default gateway MAC'
    ],
    packetConcept: 'Broadcast ARP Request ("Who has 192.168.1.1? Tell 192.168.1.10") followed by Unicast ARP Reply ("192.168.1.1 is at 00:1A:2B:3C:4D:5E").'
  },
  {
    id: 'icmp',
    name: 'ICMP',
    fullName: 'Internet Control Message Protocol',
    layer: 'Network',
    transportProtocol: 'IP',
    port: 'IP Protocol 1',
    description: 'Network-layer protocol used by network devices to send error messages and operational information indicating whether a requested host is reachable.',
    headerFields: [
      { field: 'Type', sizeBits: 8, description: '8=Echo Request, 0=Echo Reply, 3=Destination Unreachable, 11=Time Exceeded' },
      { field: 'Code', sizeBits: 8, description: 'Sub-code (e.g. Code 0=Net Unreachable, 1=Host Unreachable, 3=Port Unreachable)' },
      { field: 'Checksum', sizeBits: 16, description: '16-bit one complement checksum' }
    ],
    realWorldUse: 'Diagnostics (ping, traceroute, path MTU discovery).',
    securityConsiderations: [
      'ICMP flood (Ping of Death, Smurf attacks)',
      'Network reconnaissance / port scanning',
      'Often rate-limited or filtered at perimeter firewalls'
    ],
    troubleshootingTips: [
      'Use ping to isolate Layer 3 connectivity',
      'Time Exceeded (Type 11) indicates TTL expired (routing loops or traceroute hop)',
      'Destination Unreachable (Type 3) indicates routing or firewall block'
    ],
    packetConcept: 'Directly encapsulated in IPv4 packets without transport (TCP/UDP) header.'
  },
  {
    id: 'tcp',
    name: 'TCP',
    fullName: 'Transmission Control Protocol',
    layer: 'Transport',
    transportProtocol: 'IP',
    port: 'IP Protocol 6',
    description: 'Connection-oriented, reliable, byte-stream transport protocol providing flow control, congestion control, and ordered packet delivery.',
    headerFields: [
      { field: 'Source / Destination Port', sizeBits: 32, description: 'Identifies sending and receiving application endpoints' },
      { field: 'Sequence / Acknowledgment Number', sizeBits: 64, description: 'Tracks byte streams and confirms packet receipt' },
      { field: 'Flags (SYN, ACK, FIN, RST, PSH, URG)', sizeBits: 16, description: 'Control bits governing session lifecycle' },
      { field: 'Window Size', sizeBits: 16, description: 'Flow control receive buffer capacity' }
    ],
    realWorldUse: 'HTTP/S, SSH, FTP, SMTP, database connections, file transfers.',
    securityConsiderations: [
      'SYN flood attacks (mitigated with SYN cookies)',
      'TCP reset injection and session hijacking',
      'Port scanning (SYN scans)'
    ],
    troubleshootingTips: [
      'Check connection states via netstat -an (LISTEN, ESTABLISHED, TIME_WAIT, CLOSE_WAIT)',
      'Look for TCP retransmissions in Wireshark indicating packet loss',
      'Inspect Window Size 0 alerts indicating receiver buffer starvation'
    ],
    packetConcept: '3-Way Handshake (SYN -> SYN-ACK -> ACK) and 4-Way Teardown (FIN -> ACK -> FIN -> ACK).'
  },
  {
    id: 'udp',
    name: 'UDP',
    fullName: 'User Datagram Protocol',
    layer: 'Transport',
    transportProtocol: 'IP',
    port: 'IP Protocol 17',
    description: 'Lightweight, connectionless transport protocol prioritizing low latency over guaranteed delivery and ordered packet sequencing.',
    headerFields: [
      { field: 'Source Port', sizeBits: 16, description: 'Sending application port' },
      { field: 'Destination Port', sizeBits: 16, description: 'Target application port' },
      { field: 'Length', sizeBits: 16, description: 'Total UDP header + payload size in bytes' },
      { field: 'Checksum', sizeBits: 16, description: 'Optional error-checking bits' }
    ],
    realWorldUse: 'DNS, DHCP, VoIP, video streaming (RTP), online gaming, NTP, SNMP.',
    securityConsiderations: [
      'Easily spoofed source IP addresses enable Reflection/Amplification DDoS attacks',
      'No built-in rate or flow control'
    ],
    troubleshootingTips: [
      'Verify port listening with nc -u or netstat',
      'Check for network congestion causing silent packet drops',
      'Confirm firewall UDP state timeout settings'
    ],
    packetConcept: 'Minimal 8-byte header with fire-and-forget datagram transmission.'
  },
  {
    id: 'ssh',
    name: 'SSH',
    fullName: 'Secure Shell',
    layer: 'Application',
    transportProtocol: 'TCP',
    port: 22,
    description: 'Cryptographic network protocol for secure remote command-line login, remote command execution, and SFTP file transfer.',
    headerFields: [
      { field: 'SSH Packet Length', sizeBits: 32, description: 'Size of payload' },
      { field: 'Padding Length', sizeBits: 8, description: 'Cipher alignment bytes' },
      { field: 'Payload / MAC', sizeBits: 0, description: 'Encrypted shell payload and Message Authentication Code' }
    ],
    realWorldUse: 'Remote server administration, Cisco IOS / network device management, automated DevOps pipelines.',
    securityConsiderations: [
      'Brute force attacks on port 22 (mitigate with fail2ban or SSH keys)',
      'Disable root password login and use ED25519/RSA-4096 keys',
      'Change default listening port if exposed to public Internet'
    ],
    troubleshootingTips: [
      'Run ssh -vvv user@host for detailed verbose handshake debugging',
      'Check ~/.ssh/authorized_keys file permissions (must be chmod 600)',
      'Confirm sshd daemon is running on target host'
    ],
    packetConcept: 'Diffie-Hellman asymmetric key exchange establishing symmetric AES session encryption.'
  },
  {
    id: 'bgp',
    name: 'BGP',
    fullName: 'Border Gateway Protocol (BGP-4)',
    layer: 'Application / Routing',
    transportProtocol: 'TCP',
    port: 179,
    description: 'The routing protocol of the global Internet. A Path-Vector exterior gateway protocol (EGP) managing routing decisions between Autonomous Systems (AS).',
    headerFields: [
      { field: 'Marker', sizeBits: 128, description: 'Synchronization and authentication' },
      { field: 'Length', sizeBits: 16, description: 'Total BGP message length' },
      { field: 'Type', sizeBits: 8, description: '1=OPEN, 2=UPDATE, 3=NOTIFICATION, 4=KEEPALIVE' }
    ],
    realWorldUse: 'ISP peering, multi-homed enterprise networks, cloud interconnects (AWS Direct Connect, Google Cloud Interconnect).',
    securityConsiderations: [
      'BGP Hijacking / Route Leaks (intercepting global traffic)',
      'Mitigated with RPKI (Resource Public Key Infrastructure) and BGP Route Filtering'
    ],
    troubleshootingTips: [
      'Check BGP session state (Idle, Connect, Active, OpenSent, OpenConfirm, Established)',
      'Verify TCP 179 connectivity between peer IP addresses',
      'Check AS number configurations and prefix-list advertisements'
    ],
    packetConcept: 'Establishes persistent TCP connection on port 179 and exchanges incremental routing UPDATE messages.'
  },
  {
    id: 'ospf',
    name: 'OSPF',
    fullName: 'Open Shortest Path First (v2/v3)',
    layer: 'Network / Routing',
    transportProtocol: 'IP',
    port: 'IP Protocol 89',
    description: 'Link-State Interior Gateway Protocol (IGP) using Dijkstra algorithm to compute shortest path tree across autonomous enterprise networks.',
    headerFields: [
      { field: 'Version', sizeBits: 8, description: '2 (IPv4) or 3 (IPv6)' },
      { field: 'Type', sizeBits: 8, description: '1=Hello, 2=DBD, 3=LSR, 4=LSU, 5=LSAck' },
      { field: 'Area ID', sizeBits: 32, description: '32-bit dotted-decimal Area (e.g. 0.0.0.0 Backbone Area 0)' }
    ],
    realWorldUse: 'Enterprise internal routing across campus buildings and data centers.',
    securityConsiderations: [
      'MD5 or SHA HMAC authentication between neighbor routers',
      'Passive interface configuration on edge user ports'
    ],
    troubleshootingTips: [
      'Check OSPF neighbor state (Down, Init, 2-Way, ExStart, Exchange, Loading, Full)',
      'Verify matching Hello/Dead timers, Area ID, Subnet Mask, and MTU size',
      'Ensure Area 0 backbone continuity'
    ],
    packetConcept: 'Multicast Hello packets (224.0.0.5 all routers, 224.0.0.6 DR/BDR) to establish adjacencies.'
  },
  {
    id: 'vlan',
    name: '802.1Q VLAN',
    fullName: 'Virtual Local Area Network (IEEE 802.1Q)',
    layer: 'Data Link',
    transportProtocol: 'N/A',
    port: 'EtherType 0x8100',
    description: 'Standard for tagging Ethernet frames with 12-bit VLAN IDs (1-4094) to partition physical switches into multiple logical broadcast domains.',
    headerFields: [
      { field: 'TPID (Tag Protocol Identifier)', sizeBits: 16, description: '0x8100 identifying 802.1Q tagged frame' },
      { field: 'PCP (Priority Code Point)', sizeBits: 3, description: '802.1p Quality of Service priority (0-7)' },
      { field: 'DEI (Drop Eligible Indicator)', sizeBits: 1, description: 'Frame drop eligibility during congestion' },
      { field: 'VID (VLAN Identifier)', sizeBits: 12, description: 'VLAN ID number (1-4094)' }
    ],
    realWorldUse: 'Isolating Guest WiFi from Corporate LAN, separating CCTV/VoIP/IoT traffic, multi-tenant cloud hosting.',
    securityConsiderations: [
      'VLAN hopping attacks (Double Tagging, Switch Spoofing)',
      'Mitigate by disabling DTP (Dynamic Trunking Protocol) and setting non-default Native VLAN'
    ],
    troubleshootingTips: [
      'Verify access switchport assigned to correct VLAN number',
      'Ensure trunk ports allow the specified VLAN ID (switchport trunk allowed vlan)',
      'Check Native VLAN matching on both ends of trunk links'
    ],
    packetConcept: 'Inserts 4-byte 802.1Q tag header between Source MAC and EtherType fields on trunk links.'
  }
];
