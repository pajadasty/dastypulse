import React from 'react';
import type { PortResult } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Terminal, Activity } from 'lucide-react';

interface PortMatrixProps {
  ports: PortResult[];
}

export const PortMatrix: React.FC<PortMatrixProps> = ({ ports }) => {
  if (ports.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
        <h4 className="text-white font-bold text-sm">No Open Ports Detected</h4>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Target host did not respond on scanned ports or is guarded by a strict firewall.
        </p>
      </div>
    );
  }

  const getRiskBadge = (risk: PortResult['risk']) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950/80 text-rose-400 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3" /> CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-950/80 text-orange-400 border border-orange-500/40">
            <AlertTriangle className="w-3 h-3" /> HIGH RISK
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950/80 text-amber-300 border border-amber-500/40">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            LOW RISK
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <Terminal className="w-4 h-4 text-emerald-400" />
          ACTIVE TARGET MATRIX ({ports.length} OPEN PORTS)
        </h3>
        <span className="text-xs text-slate-400 font-mono">TCP / SYN-ACK RESPONSES</span>
      </div>

      <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden backdrop-blur-md">
        {ports.map((p) => (
          <div
            key={p.port}
            className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            {/* Left: Port & Service */}
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="w-14 text-center py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-white shadow-inner">
                :{p.port}
              </div>
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  {p.service}
                  {getRiskBadge(p.risk)}
                </div>
                <div className="text-[11px] text-slate-400">{p.description}</div>
              </div>
            </div>

            {/* Middle: Banner / Fingerprint */}
            <div className="flex-1 font-mono text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-900 overflow-x-auto truncate">
              {p.banner ? (
                <span className="text-cyan-400">{p.banner}</span>
              ) : (
                <span className="text-slate-500 italic">No banner response</span>
              )}
            </div>

            {/* Right: Latency & Security Notes */}
            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 font-mono text-[11px]">
              <div className="flex items-center gap-1 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{p.latency_ms} ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
