# 🚀 NET-LAB — Full-Stack Interactive Networking Laboratory Platform

> **Build. Simulate. Understand Networks.**  
> Built by **Sandesh Bajgai** (Networking • Cybersecurity • AI • Software Development)

---

## 🌟 Overview

**NET-LAB** is an interactive networking laboratory, simulation environment, educational platform, and troubleshooting assistant. Built from the ground up for students, network engineers, and cybersecurity learners.

---

## ✨ Core Features

- 🖥️ **Visual Network Builder:** Drag-and-drop network topology canvas (PC, Laptop, Server, Router, Switch, AP, Firewall, Internet). Configure IP addresses, subnet masks, VLANs, MACs, default gateways, and dynamic routing.
- 📦 **Packet Journey Mode:** Step-by-step multi-layer packet flow simulation across OSI Layers (Layer 7 down to Layer 1) with ARP resolution, CAM table switching, and router TTL decrement.
- 🔍 **"Why Did This Packet Fail?" Diagnostic Engine:** Intentional fault diagnosis inspecting link states, duplicate IPs, gateway mismatches, VLAN isolation, firewall drops, and routing loops with clear technical evidence and remediation steps.
- 🧮 **Networking Calculator & Tools Hub:** IPv4 Subnet Calculator, CIDR Analyzer, VLSM Generator, Binary/Hex Flipper, IP Range Inspector, Bandwidth & Transfer Time Calculator, WiFi Capacity Estimator, and Port Quick Reference.
- 🌐 **OSI & TCP/IP Interactive 3D Model:** Interactive 7-layer explorer showing protocols, PDUs, header encapsulations, and hardware devices.
- 📚 **Protocol Explorer:** Searchable protocol knowledge base with packet structures, security considerations, and Wireshark troubleshooting examples.
- 🧪 **15 Structured Practical Labs:** Real-world labs ranging from Basic LANs and Subnetting to Inter-VLAN routing, OSPF, and Firewall ACLs.
- 🎯 **Scenario-Based Network Challenges:** Multi-floor hotel, college campus backbone, hospital medical IoT, and enterprise DMZ.
- 💻 **Simulated Command Terminal:** Interactive CLI executing safe educational `ping`, `traceroute`, `ipconfig`, `arp -a`, `nslookup`, and `route print`.
- 🧠 **Adaptive Quiz Engine & Skill Map:** Question banks with difficulty tiers and rule-based adaptive recommendations for weak topics.
- 📊 **Student Portfolio & Workspace:** Save topologies, manage project statuses, write technical notes, calculate NET-LAB Design Evaluation scores (0-100), and export as JSON/PNG.
- ☁️ **Supabase-Ready Architecture:** Full PostgreSQL migration schema, RLS policies, and seamless local-first offline fallback.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion, Three.js (3D visualization mode)
- **Backend:** Node.js, Express.js REST API, Modular Controller/Service architecture
- **Database / Auth:** PostgreSQL 15+ via Supabase (with full local-storage offline fallback)
- **Deployment:** Cloud Run / Docker / Node.js Production build

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/sandeshbajgai/net-lab.git
cd net-lab
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Supabase credentials are optional. If omitted, NET-LAB automatically operates in high-performance local-first offline mode).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run static TypeScript and calculation validations:
```bash
npm run lint
```

---

## 📜 License
MIT License. Built by Sandesh Bajgai.
