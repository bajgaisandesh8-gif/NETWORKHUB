# NET-LAB — REST API Documentation

**Platform:** NET-LAB Interactive Networking Platform  
**Creator:** Sandesh Bajgai  
**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api`

---

## Overview

NET-LAB exposes a clean REST API for network calculations, topology simulation, packet tracing, diagnostic troubleshooting, and educational data. All endpoints adhere to standard HTTP status codes and provide consistent JSON payloads.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Detailed diagnostic error message."
  }
}
```

---

## Endpoints

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Auth:** None
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "status": "operational",
      "version": "1.0.0",
      "platform": "NET-LAB Interactive Networking Platform",
      "creator": "Sandesh Bajgai"
    }
  }
  ```

### 2. Subnet Calculator
- **Endpoint:** `POST /api/tools/subnet`
- **Request Body:**
  ```json
  {
    "ip": "192.168.10.1",
    "cidr": 26
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "ip": "192.168.10.1",
      "cidr": 26,
      "subnetMask": "255.255.255.192",
      "networkAddress": "192.168.10.0",
      "broadcastAddress": "192.168.10.63",
      "firstUsableIp": "192.168.10.1",
      "lastUsableIp": "192.168.10.62",
      "usableHosts": 62,
      "totalHosts": 64,
      "ipClass": "C",
      "isPrivate": true
    }
  }
  ```

### 3. VLSM Calculator
- **Endpoint:** `POST /api/tools/vlsm`
- **Request Body:**
  ```json
  {
    "baseNetwork": "192.168.0.0",
    "baseCidr": 24,
    "subnets": [
      { "name": "Engineering", "hostsNeeded": 50 },
      { "name": "Marketing", "hostsNeeded": 25 },
      { "name": "Point-to-Point WAN", "hostsNeeded": 2 }
    ]
  }
  ```

### 4. Packet Journey Trace Simulation
- **Endpoint:** `POST /api/simulation/trace`
- **Request Body:**
  ```json
  {
    "topology": { "devices": [...], "connections": [...] },
    "source": "PC1",
    "destination": "Server1",
    "protocol": "ICMP",
    "port": 80
  }
  ```
- **Response:** Returns step-by-step layer encapsulation, ARP resolution, switch forwarding, and router TTL decrements.

### 5. Network Failure Diagnostics
- **Endpoint:** `POST /api/diagnostics/evaluate`
- **Request Body:**
  ```json
  {
    "topology": { "devices": [...], "connections": [...] }
  }
  ```
- **Response:** Returns comprehensive report with likely causes, technical evidence, fix recommendations, and root cause analysis.

### 6. Design Score Evaluation
- **Endpoint:** `POST /api/topologies/evaluate-score`
- **Response:** Returns 0-100 score across Addressing, Connectivity, Segmentation, Redundancy, Security, and Scalability.

### 7. Interactive Terminal Execution
- **Endpoint:** `POST /api/terminal/execute`
- **Request Body:**
  ```json
  {
    "command": "ping 192.168.1.1",
    "selectedDeviceId": "dev-pc1",
    "topology": { ... }
  }
  ```

### 8. Practical Labs & Quizzes
- `GET /api/labs` - List all 15 practical labs.
- `GET /api/labs/:id` - Get specific lab instructions and starter topology.
- `GET /api/protocols` - Searchable protocol database.
- `GET /api/quizzes` - Assessment question banks with explanations.
- `GET /api/challenges` - Real-world design challenges.
