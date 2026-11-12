# DastyPulse ⚡📡

**Visual Network Scanner, Service Fingerprinter & Cyberpunk Radar by pajadasty.**

A tactical network reconnaissance and security audit tool built with a high-performance asynchronous Python backend and a futuristic Sci-Fi / Cyberpunk HUD radar interface.

```text
       .---.
      /     \
     | () () |   DASTY-PULSE TACTICAL RADAR v1.0
      \  _  /    Cyberpunk Network Port & Service Auditor by pajadasty
       '---'
```

---

## ⚡ Key Capabilities

- **🟢 Cyberpunk Canvas Radar HUD**:
  - Live rotating frequency sweep beam with phosphor fade tail.
  - Concentric range rings marking port distance.
  - Open ports appear as pulsing color-coded blips with instant port tags.
- **⚡ High-Performance Asynchronous Port Scanner**:
  - Ultra-fast `asyncio` TCP connect scanner (scans ports concurrently in ~1 second).
  - Pre-configured target profiles:
    - **Top 20 Critical**: Most exposed WAN services (SSH, FTP, HTTP, HTTPS, SMB, RDP, MySQL, Redis...).
    - **Web Applications**: HTTP, HTTPS, alternative dev ports (3000, 5000, 5173, 8080, 8443, 8888...).
    - **Database Cluster**: MySQL, Postgres, MSSQL, Redis, MongoDB, Elasticsearch.
    - **Core Infrastructure**: DNS, SMTP, SNMP, LDAP, RPC, NetBIOS.
    - **Custom Ports**: Comma-separated arbitrary port ranges (1-65535).
- **🔎 Service Fingerprinting & Banner Grabbing**:
  - Probes open sockets with service handshakes to extract version banners (e.g. `nginx/1.22`, `OpenSSH 8.9`, `MySQL Community Server`, `Redis PING`).
- **🛡️ Attack Surface Threat Score**:
  - Automatically calculates risk score (0-100) and categorizes exposure:
    - 🔴 **CRITICAL**: Telnet (cleartext), SMB (ransomware vector), exposed WAN databases.
    - 🟠 **HIGH**: Exposed RDP / VNC / NetBIOS.
    - 🟡 **MEDIUM**: Unencrypted HTTP or legacy mail relays.
    - 🟢 **LOW**: Hardened TLS / HTTPS encrypted ports.
- **🔊 Procedural Cyber SFX Synthesizer**:
  - Interactive Web Audio sound synthesizer for radar sweep pings and audio alerts when open/critical ports are acquired (muteable with 1 click).
- **💾 JSON Telemetry Export**:
  - One-click export of complete network audit findings.

---

## 🚀 Quick Start

### 1. Launch Python Scanner Engine

```bash
cd dastypulse
python server.py
```

*The tactical scanner engine runs on `http://127.0.0.1:8765`.*

### 2. Launch Cyberpunk Radar HUD

In a second terminal:

```bash
cd dastypulse
npm run dev
```

Then open `http://localhost:5174` (or port displayed) in your browser!

### 3. Standalone CLI Scan Mode

You can also run DastyPulse directly from the terminal without a browser:

```bash
python server.py --cli --target 127.0.0.1 --preset web
```

---

## 🛠 Tech Stack

- **Backend**: Python 3.11 + standard library `asyncio` & `socket` (zero external dependencies!)
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Canvas Confetti
- **Radar Graphics**: HTML5 Canvas 2D Conic Sweep Engine
- **Audio**: Web Audio API Procedural Synthesizer

---

## 📄 License

MIT License • Developed by **pajadasty**.
