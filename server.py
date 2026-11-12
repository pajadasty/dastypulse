from __future__ import annotations

import argparse
import asyncio
import json
import socket
import sys
import time
from dataclasses import asdict, dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

# Well-known Service & Risk Database
SERVICE_DATABASE: Dict[int, Dict[str, Any]] = {
    21: {"service": "FTP", "desc": "File Transfer Protocol", "risk": "high", "risk_desc": "Plaintext authentication. Credentials transmitted without encryption."},
    22: {"service": "SSH", "desc": "Secure Shell", "risk": "low", "risk_desc": "Encrypted remote terminal. Ensure strong keys and disable root password login."},
    23: {"service": "Telnet", "desc": "Unencrypted Telnet", "risk": "critical", "risk_desc": "Critical vulnerability! All commands, passwords, and sessions are in cleartext."},
    25: {"service": "SMTP", "desc": "Simple Mail Transfer", "risk": "medium", "risk_desc": "Mail relay. Verify it is not configured as an open relay for spammers."},
    53: {"service": "DNS", "desc": "Domain Name System", "risk": "medium", "risk_desc": "DNS resolver. Check for zone transfer (AXFR) vulnerabilities."},
    80: {"service": "HTTP", "desc": "HyperText Transfer Protocol", "risk": "medium", "risk_desc": "Unencrypted web traffic. Enforce redirect to HTTPS (port 443)."},
    110: {"service": "POP3", "desc": "Post Office Protocol", "risk": "high", "risk_desc": "Plaintext email retrieval without TLS."},
    135: {"service": "MS-RPC", "desc": "Windows RPC Endpoint Mapper", "risk": "high", "risk_desc": "Common target for Windows network exploit probes."},
    139: {"service": "NetBIOS", "desc": "NetBIOS Session Service", "risk": "high", "risk_desc": "Legacy Windows networking. Should not be exposed to WAN."},
    143: {"service": "IMAP", "desc": "Internet Message Access", "risk": "medium", "risk_desc": "Check if STARTTLS is strictly required."},
    443: {"service": "HTTPS", "desc": "Encrypted Web (TLS/SSL)", "risk": "low", "risk_desc": "Standard secure web protocol."},
    445: {"service": "SMB", "desc": "Server Message Block", "risk": "critical", "risk_desc": "Critical Windows file share service. Susceptible to EternalBlue and worm attacks."},
    1433: {"service": "MSSQL", "desc": "Microsoft SQL Server", "risk": "critical", "risk_desc": "Database listening directly on network. Must be restricted by firewall."},
    1521: {"service": "Oracle", "desc": "Oracle Database", "risk": "critical", "risk_desc": "Enterprise database. Should be accessible only over VPN."},
    3306: {"service": "MySQL", "desc": "MySQL / MariaDB Database", "risk": "critical", "risk_desc": "Database server exposed! Ensure remote root login is disabled and bind to 127.0.0.1."},
    3389: {"service": "RDP", "desc": "Remote Desktop Protocol", "risk": "high", "risk_desc": "Windows Remote Desktop. Constant target of automated brute-force attacks."},
    5432: {"service": "PostgreSQL", "desc": "PostgreSQL Database", "risk": "critical", "risk_desc": "Relational database server. Never expose directly to public networks."},
    5900: {"service": "VNC", "desc": "Virtual Network Computing", "risk": "high", "risk_desc": "Remote desktop screen. Often uses weak 8-character DES passwords."},
    6379: {"service": "Redis", "desc": "Redis In-Memory Store", "risk": "critical", "risk_desc": "Critical exposure! Unprotected Redis instances allow remote code execution via cron."},
    8080: {"service": "HTTP-Alt", "desc": "Alternative Web Server / Proxy", "risk": "medium", "risk_desc": "Often used for internal admin consoles (Tomcat, Jenkins)."},
    8443: {"service": "HTTPS-Alt", "desc": "Alternative HTTPS / Admin Console", "risk": "low", "risk_desc": "Encrypted web application service."},
    9200: {"service": "Elasticsearch", "desc": "Elasticsearch REST API", "risk": "critical", "risk_desc": "Database search index. Public exposure has led to massive data leaks."},
    27017: {"service": "MongoDB", "desc": "MongoDB NoSQL Database", "risk": "critical", "risk_desc": "NoSQL database. Historical target for ransomware wiper scripts if unauthenticated."},
}

PORT_PRESETS = {
    "top20": [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 1433, 3306, 3389, 5432, 5900, 6379, 8080, 8443],
    "databases": [1433, 1521, 3306, 5432, 6379, 7000, 7001, 9042, 9200, 27017, 28017],
    "web": [80, 443, 2082, 2083, 3000, 5000, 5173, 5174, 8000, 8008, 8080, 8081, 8443, 8888, 9000],
    "infra": [21, 22, 23, 25, 53, 69, 110, 123, 135, 139, 143, 161, 389, 445, 636, 3389, 5900],
}


@dataclass
class PortScanResult:
    port: int
    state: str  # "open", "closed", "filtered"
    service: str
    description: str
    risk: str  # "low", "medium", "high", "critical"
    risk_desc: str
    banner: str
    latency_ms: int


class NetworkScanner:
    @staticmethod
    def resolve_target(target: str) -> tuple[str, str]:
        clean = target.strip().replace("http://", "").replace("https://", "").split("/")[0].split(":")[0]
        try:
            ip = socket.gethostbyname(clean)
            return clean, ip
        except Exception:
            return clean, clean

    @classmethod
    async def grab_banner(cls, reader: asyncio.StreamReader, writer: asyncio.StreamWriter, port: int) -> str:
        banner = ""
        try:
            # Service specific probes
            if port in (80, 8080, 8000, 3000, 5173, 5174):
                writer.write(b"HEAD / HTTP/1.0\r\nHost: target\r\n\r\n")
                await writer.drain()
            elif port == 6379:
                writer.write(b"PING\r\n")
                await writer.drain()
            elif port in (21, 22, 25, 110):
                # Many services send an initial banner upon connection
                pass

            data = await asyncio.wait_for(reader.read(512), timeout=1.2)
            banner = data.decode("utf-8", errors="ignore").strip()

            # Clean HTTP response to server token if present
            if "Server:" in banner:
                for line in banner.splitlines():
                    if line.lower().startswith("server:"):
                        banner = line.strip()
                        break
            # Truncate
            if len(banner) > 80:
                banner = banner[:77] + "..."
        except Exception:
            pass
        return banner

    @classmethod
    async def scan_single_port(cls, ip: str, port: int, timeout: float = 1.5) -> Optional[PortScanResult]:
        start = time.perf_counter()
        info = SERVICE_DATABASE.get(port, {
            "service": f"Port-{port}",
            "desc": "Unknown Service",
            "risk": "low" if port > 1024 else "medium",
            "risk_desc": "Standard unassigned or custom application port.",
        })

        try:
            conn = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(conn, timeout=timeout)
            elapsed_ms = max(1, int((time.perf_counter() - start) * 1000))

            banner = await cls.grab_banner(reader, writer, port)

            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

            return PortScanResult(
                port=port,
                state="open",
                service=info["service"],
                description=info["desc"],
                risk=info["risk"],
                risk_desc=info["risk_desc"],
                banner=banner,
                latency_ms=elapsed_ms,
            )
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return None

    @classmethod
    async def scan_ports(
        cls,
        target: str,
        ports: List[int],
        concurrency: int = 50,
        timeout: float = 1.5,
    ) -> Dict[str, Any]:
        hostname, ip = cls.resolve_target(target)
        sem = asyncio.Semaphore(concurrency)

        async def worker(p: int):
            async with sem:
                return await cls.scan_single_port(ip, p, timeout)

        t_start = time.perf_counter()
        tasks = [worker(p) for p in ports]
        results = await asyncio.gather(*tasks)
        total_time = round(time.perf_counter() - t_start, 2)

        open_ports = [r for r in results if r is not None]
        open_ports.sort(key=lambda r: r.port)

        # Risk scoring
        critical_count = sum(1 for r in open_ports if r.risk == "critical")
        high_count = sum(1 for r in open_ports if r.risk == "high")
        med_count = sum(1 for r in open_ports if r.risk == "medium")

        # Threat Score (0 = Clean, 100 = Critical Danger)
        threat_score = min(100, (critical_count * 35) + (high_count * 20) + (med_count * 8))

        return {
            "target": hostname,
            "ip": ip,
            "scanned_ports": len(ports),
            "open_count": len(open_ports),
            "scan_duration_sec": total_time,
            "threat_score": threat_score,
            "ports": [asdict(r) for r in open_ports],
        }


# API Request Handler with CORS
class ScannerApiHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/presets":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(PORT_PRESETS).encode("utf-8"))
        elif parsed.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ready", "version": "1.0.0", "author": "pajadasty"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/scan":
            content_len = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_len)
            try:
                req = json.loads(post_body.decode("utf-8"))
                target = req.get("target", "127.0.0.1")
                preset = req.get("preset", "top20")
                custom_ports = req.get("ports", None)

                if custom_ports and isinstance(custom_ports, list):
                    ports = [int(p) for p in custom_ports if 1 <= int(p) <= 65535]
                else:
                    ports = PORT_PRESETS.get(preset, PORT_PRESETS["top20"])

                timeout = float(req.get("timeout", 1.2))

                # Execute scan
                data = asyncio.run(NetworkScanner.scan_ports(target, ports, timeout=timeout))

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(data).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Clean terminal logging
        sys.stderr.write(f"[DastyPulse API] {args[0]} - {args[1]}\n")


def run_server(port: int = 8765):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, ScannerApiHandler)
    print(f"\n[DastyPulse] Tactical Scanner Engine active on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[DastyPulse] Scanner backend terminated.")


def run_cli_scan(target: str, preset: str = "top20"):
    ports = PORT_PRESETS.get(preset, PORT_PRESETS["top20"])
    print(f"[*] Scanning {target} across {len(ports)} ports...")
    res = asyncio.run(NetworkScanner.scan_ports(target, ports))
    print(f"[+] Scan completed in {res['scan_duration_sec']}s. Open ports: {res['open_count']}\n")
    for p in res["ports"]:
        banner_info = f" ({p['banner']})" if p['banner'] else ""
        print(f"  [{p['risk'].upper():<8}] Port {p['port']:<5} {p['service']:<12} {p['latency_ms']}ms{banner_info}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DastyPulse Network Scanner Engine by pajadasty")
    parser.add_argument("--port", type=int, default=8765, help="HTTP API port (default: 8765)")
    parser.add_argument("--cli", action="store_true", help="Run standalone CLI scan")
    parser.add_argument("--target", default="127.0.0.1", help="Target host for CLI scan")
    parser.add_argument("--preset", default="top20", choices=["top20", "databases", "web", "infra"])

    args = parser.parse_args()

    if args.cli:
        run_cli_scan(args.target, args.preset)
    else:
        run_server(args.port)
