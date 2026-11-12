export interface PortResult {
  port: number;
  state: string;
  service: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  risk_desc: string;
  banner: string;
  latency_ms: number;
}

export interface ScanResponse {
  target: string;
  ip: string;
  scanned_ports: number;
  open_count: number;
  scan_duration_sec: number;
  threat_score: number;
  ports: PortResult[];
}
