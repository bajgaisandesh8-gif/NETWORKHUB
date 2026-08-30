import { Achievement } from '../types';

export const ACHIEVEMENTS_DATA: Achievement[] = [
  {
    id: 'ach-first-lab',
    title: 'First Step into the Lab',
    description: 'Completed your very first practical networking laboratory.',
    iconName: 'Award',
    category: 'lab'
  },
  {
    id: 'ach-subnet-master',
    title: 'Subnet Master',
    description: 'Mastered IPv4 CIDR, VLSM calculation, and binary address decomposition.',
    iconName: 'Binary',
    category: 'tools'
  },
  {
    id: 'ach-packet-detective',
    title: 'Packet Detective',
    description: 'Traced a packet across multi-hop OSI layers from creation to destination ACK.',
    iconName: 'Activity',
    category: 'topology'
  },
  {
    id: 'ach-troubleshooter',
    title: 'Network Troubleshooter',
    description: 'Diagnosed and resolved a complex multi-layer network failure scenario.',
    iconName: 'ShieldAlert',
    category: 'lab'
  },
  {
    id: 'ach-topology-architect',
    title: 'Topology Architect',
    description: 'Constructed an enterprise multi-tier network topology with score 85+.',
    iconName: 'Network',
    category: 'topology'
  },
  {
    id: 'ach-vlan-engineer',
    title: 'VLAN Segmentation Engineer',
    description: 'Successfully deployed 802.1Q VLAN broadcast isolation and Router-on-a-Stick.',
    iconName: 'Layers',
    category: 'lab'
  },
  {
    id: 'ach-routing-explorer',
    title: 'Routing Explorer',
    description: 'Configured dynamic link-state OSPF and static routing tables across WAN hops.',
    iconName: 'GitBranch',
    category: 'lab'
  },
  {
    id: 'ach-quiz-champion',
    title: 'Assessment Ace',
    description: 'Scored 100% on an Advanced Networking & Security Assessment.',
    iconName: 'CheckCircle',
    category: 'quiz'
  }
];
