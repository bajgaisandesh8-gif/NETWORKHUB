import { QuizQuestion } from '../types';

export const QUIZZES_DATA: QuizQuestion[] = [
  {
    id: 'q-sub-01',
    topic: 'Subnetting',
    difficulty: 'Beginner',
    questionType: 'subnet_calc',
    questionText: 'How many usable host IP addresses are available in a standard /24 IPv4 network (255.255.255.0)?',
    options: ['256', '254', '255', '128'],
    correctAnswerIndex: 1,
    explanation: 'A /24 network has 8 host bits (2^8 = 256 total addresses). Subtracting 2 (one for the Network Address .0 and one for the Broadcast Address .255) leaves 254 usable host addresses.'
  },
  {
    id: 'q-sub-02',
    topic: 'Subnetting',
    difficulty: 'Intermediate',
    questionType: 'subnet_calc',
    questionText: 'What is the network address for a host assigned IP 192.168.10.138 with subnet mask 255.255.255.192 (/26)?',
    options: ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192'],
    correctAnswerIndex: 2,
    explanation: 'With a /26 mask, the block size is 256 - 192 = 64. The subnets start at .0, .64, .128, and .192. Since 138 falls between 128 and 191, the network address is 192.168.10.128.'
  },
  {
    id: 'q-sub-03',
    topic: 'Subnetting',
    difficulty: 'Advanced',
    questionType: 'subnet_calc',
    questionText: 'You need to allocate a subnet that can support at least 28 individual host computers. What is the most efficient CIDR prefix?',
    options: ['/28 (14 hosts)', '/27 (30 hosts)', '/26 (62 hosts)', '/29 (6 hosts)'],
    correctAnswerIndex: 1,
    explanation: 'A /27 has 5 host bits: 2^5 - 2 = 30 usable hosts, which satisfies the 28 host requirement with minimal wasted address space. A /28 only provides 14 hosts.'
  },
  {
    id: 'q-osi-01',
    topic: 'OSI Model',
    difficulty: 'Beginner',
    questionType: 'multiple_choice',
    questionText: 'Which layer of the OSI model is responsible for logical IP addressing and path determination across networks?',
    options: ['Layer 2 - Data Link Layer', 'Layer 3 - Network Layer', 'Layer 4 - Transport Layer', 'Layer 7 - Application Layer'],
    correctAnswerIndex: 1,
    explanation: 'Layer 3 (Network Layer) handles logical addressing (IPv4/IPv6), routing table lookups, and packet forwarding across interconnected networks.'
  },
  {
    id: 'q-osi-02',
    topic: 'OSI Model',
    difficulty: 'Intermediate',
    questionType: 'multiple_choice',
    questionText: 'What is the correct Protocol Data Unit (PDU) at the Transport Layer (Layer 4)?',
    options: ['Bits', 'Frames', 'Packets', 'Segments / Datagrams'],
    correctAnswerIndex: 3,
    explanation: 'Layer 4 data units are called Segments (TCP) or Datagrams (UDP). Layer 3 uses Packets, Layer 2 uses Frames, and Layer 1 uses Bits.'
  },
  {
    id: 'q-sw-01',
    topic: 'Switching',
    difficulty: 'Beginner',
    questionType: 'multiple_choice',
    questionText: 'How does an Ethernet switch know which port to forward a frame to for a known destination host?',
    options: ['By consulting its CAM / MAC address table', 'By broadcasting to every port every time', 'By checking the IPv4 routing table', 'By querying the DNS server'],
    correctAnswerIndex: 0,
    explanation: 'Switches maintain a Content Addressable Memory (CAM) table that maps destination MAC addresses to specific physical switch ports.'
  },
  {
    id: 'q-sw-02',
    topic: 'Switching',
    difficulty: 'Intermediate',
    questionType: 'multiple_choice',
    questionText: 'What IEEE standard defines 802.1Q VLAN tagging on trunk links between Ethernet switches?',
    options: ['IEEE 802.3', 'IEEE 802.11', 'IEEE 802.1Q', 'IEEE 802.1D'],
    correctAnswerIndex: 2,
    explanation: 'IEEE 802.1Q defines the 4-byte tagging format inserted into Ethernet frames to preserve VLAN identity across trunk connections.'
  },
  {
    id: 'q-rt-01',
    topic: 'Routing',
    difficulty: 'Beginner',
    questionType: 'multiple_choice',
    questionText: 'What happens to the Time to Live (TTL) value in an IPv4 packet header each time it passes through a Layer 3 Router?',
    options: ['It increases by 1', 'It remains unchanged', 'It is decremented by 1', 'It resets to 255'],
    correctAnswerIndex: 2,
    explanation: 'Every router decrements the TTL field by 1. If TTL reaches 0, the packet is discarded and an ICMP Time Exceeded (Type 11) is sent to prevent routing loops.'
  },
  {
    id: 'q-rt-02',
    topic: 'Routing',
    difficulty: 'Advanced',
    questionType: 'multiple_choice',
    questionText: 'Which dynamic routing protocol is a Link-State protocol that utilizes Dijkstra Shortest Path First algorithm?',
    options: ['RIPv2', 'OSPF', 'BGP', 'EIGRP'],
    correctAnswerIndex: 1,
    explanation: 'OSPF (Open Shortest Path First) is an open link-state routing protocol that constructs a complete topological map of Area 0 using Dijkstra SPF.'
  },
  {
    id: 'q-trouble-01',
    topic: 'Troubleshooting',
    difficulty: 'Beginner',
    questionType: 'scenario',
    questionText: 'A user reports they can ping the local gateway 192.168.1.1, but cannot reach 8.8.8.8 or any website. What is the most likely cause?',
    options: ['Their network cable is unplugged', 'Their PC has a duplicate MAC address', 'The gateway router has no outbound WAN route/Internet connection', 'The user forgot to power on their monitor'],
    correctAnswerIndex: 2,
    explanation: 'Since the local gateway replies to pings, the local physical link, IP, and LAN switch are functional. The fault lies upstream from the router to the ISP.'
  },
  {
    id: 'q-trouble-02',
    topic: 'Troubleshooting',
    difficulty: 'Intermediate',
    questionType: 'scenario',
    questionText: 'A PC has IP 192.168.1.50/24 with Default Gateway 192.168.2.1. Why will this host fail to communicate with remote subnets?',
    options: ['The PC IP is invalid', 'The Default Gateway is on a different subnet and is unreachable directly via ARP', 'The PC requires IPv6 to use a gateway', 'Subnet /24 does not support routers'],
    correctAnswerIndex: 1,
    explanation: 'A default gateway must reside on the exact same local IP subnet as the host; otherwise, the host cannot resolve the gateway MAC address via ARP.'
  },
  {
    id: 'q-sec-01',
    topic: 'Security',
    difficulty: 'Intermediate',
    questionType: 'multiple_choice',
    questionText: 'What type of security attack involves sending fraudulent ARP replies over a LAN to associate the attacker MAC with the default gateway IP?',
    options: ['DNS Amplification', 'ARP Cache Poisoning / Spoofing', 'SYN Flood', 'SQL Injection'],
    correctAnswerIndex: 1,
    explanation: 'ARP Poisoning intercepts LAN traffic by poisoning the host ARP cache, positioning the attacker as a Man-in-the-Middle (MitM).'
  }
];
