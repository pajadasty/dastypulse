import React, { useState, useEffect } from 'react';
import { Radio, Download, Terminal, Wifi, AlertCircle } from 'lucide-react';
import { CyberRadar } from './components/CyberRadar';
import { PortMatrix } from './components/PortMatrix';
import { ThreatScoreGauge } from './components/ThreatScoreGauge';
import { ScanControls } from './components/ScanControls';
import { playRadarSweepPing, playPortFoundBeep } from './utils/audioEffects';
import type { ScanResponse, PortResult } from './types';
import confetti from 'canvas-confetti';

const API_BASE = 'http://127.0.0.1:8765';

export const App: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  const handleStartScan = async (target: string, preset: string, customPorts?: number[]) => {
    setIsScanning(true);
    setErrorMsg(null);
    playRadarSweepPing(!soundEnabled);

    try {
      const payload: any = { target, preset };
      if (customPorts) {
        payload.ports = customPorts;
      }

      const res = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: ScanResponse = await res.json();
      setScanData(data);

      if (data.open_count > 0) {
        const hasCritical = data.ports.some((p) => p.risk === 'critical' || p.risk === 'high');
        playPortFoundBeep(hasCritical, !soundEnabled);
      }

      if (data.threat_score >= 50) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    } catch (err: any) {
      console.warn('Backend scan failed, running offline fallback scan demo:', err);
      setErrorMsg(
        'Backend server not responding on http://127.0.0.1:8765. Running in simulated demo mode.'
      );

      // Simulated local fallback for demonstration
      await new Promise((r) => setTimeout(r, 1200));
      const demoPorts: PortResult[] = [
        {
          port: 80,
          state: 'open',
          service: 'HTTP',
          description: 'HyperText Transfer Protocol',
          risk: 'medium',
          risk_desc: 'Unencrypted web traffic. Enforce redirect to HTTPS.',
          banner: 'nginx/1.22.1 (Ubuntu)',
          latency_ms: 12,
        },
        {
          port: 443,
          state: 'open',
          service: 'HTTPS',
          description: 'Encrypted Web (TLS/SSL)',
          risk: 'low',
          risk_desc: 'Standard encrypted web protocol.',
          banner: 'nginx/1.22.1 (Ubuntu)',
          latency_ms: 14,
        },
        {
          port: 3306,
          state: 'open',
          service: 'MySQL',
          description: 'MySQL / MariaDB Database',
          risk: 'critical',
          risk_desc: 'Database exposed on network! Restrict access with firewall.',
          banner: '5.7.39-log MySQL Community Server',
          latency_ms: 18,
        },
        {
          port: 8080,
          state: 'open',
          service: 'HTTP-Alt',
          description: 'Internal Admin Proxy / Node',
          risk: 'medium',
          risk_desc: 'Application server.',
          banner: 'Node.js Express / 4.18.2',
          latency_ms: 4,
        },
      ];

      setScanData({
        target,
        ip: '127.0.0.1',
        scanned_ports: 20,
        open_count: demoPorts.length,
        scan_duration_sec: 1.2,
        threat_score: 55,
        ports: demoPorts,
      });

      playPortFoundBeep(true, !soundEnabled);
    } finally {
      setIsScanning(false);
    }
  };

  const exportJson = () => {
    if (!scanData) return;
    const blob = new Blob([JSON.stringify(scanData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portpulse_${scanData.target}_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#06090f] text-slate-100 flex flex-col justify-between selection:bg-emerald-400 selection:text-black scanlines">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-[500px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 w-full flex-grow space-y-8">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Radio className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white font-mono">
                  Dasty<span className="text-emerald-400">Pulse</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                  TACTICAL RADAR v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Visual Network & Port Scanner • Service Fingerprinter by{' '}
                <strong className="text-slate-200">pajadasty</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border ${
                backendOnline
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              {backendOnline ? 'BACKEND: 127.0.0.1:8765' : 'BACKEND: SIMULATED / STANDALONE'}
            </div>
          </div>
        </header>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Scan Controls */}
        <ScanControls
          onStartScan={handleStartScan}
          isScanning={isScanning}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />

        {/* Main Grid: Radar + Threat Gauge + Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cyber Radar & Threat Score */}
          <div className="lg:col-span-5 space-y-6">
            <CyberRadar
              openPorts={scanData ? scanData.ports : []}
              isScanning={isScanning}
            />

            {scanData && (
              <ThreatScoreGauge
                score={scanData.threat_score}
              />
            )}
          </div>

          {/* Right Column: Scan Telemetry & Port Matrix */}
          <div className="lg:col-span-7 space-y-6">
            {scanData ? (
              <div className="space-y-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[11px] text-slate-500 block">TARGET HOST</span>
                    <strong className="text-white text-sm">{scanData.target}</strong>
                    <span className="text-[10px] text-slate-400 block font-mono">({scanData.ip})</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">OPEN PORTS</span>
                    <strong className="text-emerald-400 text-sm">
                      {scanData.open_count} / {scanData.scanned_ports}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">SWEEP SPEED</span>
                    <strong className="text-cyan-400 text-sm">
                      {scanData.scan_duration_sec}s
                    </strong>
                  </div>
                </div>

                {/* Port Matrix */}
                <PortMatrix ports={scanData.ports} />

                {/* Export Button */}
                <div className="flex justify-end">
                  <button
                    onClick={exportJson}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Export JSON Telemetry
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <Terminal className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="text-white font-bold text-base">Radar Sensor Idle</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">
                  Select a target host or IP and click <strong>Initiate Radar Scan</strong> to sweep network ports in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        <p>
          DastyPulse v1.0 • Tactical Port Radar & Vulnerability Auditor by <strong>pajadasty</strong> • Cyberpunk Network Security
        </p>
      </footer>
    </div>
  );
};
