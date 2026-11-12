import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface ThreatScoreGaugeProps {
  score: number;
}

export const ThreatScoreGauge: React.FC<ThreatScoreGaugeProps> = ({ score }) => {
  let statusText = 'HARDENED';
  let color = 'text-emerald-400';
  let borderColor = 'border-emerald-500/30';
  let bgColor = 'bg-emerald-950/30';
  let icon = <ShieldCheck className="w-5 h-5 text-emerald-400" />;
  let advice = 'No hazardous services detected on scanned ports. Perimeter is properly shielded.';

  if (score >= 70) {
    statusText = 'CRITICAL ATTACK SURFACE';
    color = 'text-rose-400';
    borderColor = 'border-rose-500/40';
    bgColor = 'bg-rose-950/40';
    icon = <ShieldAlert className="w-5 h-5 text-rose-400" />;
    advice = 'Critical unencrypted services (Telnet/SMB) or databases exposed directly to network without firewall isolation.';
  } else if (score >= 40) {
    statusText = 'HIGH RISK EXPOSURE';
    color = 'text-orange-400';
    borderColor = 'border-orange-500/40';
    bgColor = 'bg-orange-950/40';
    icon = <AlertTriangle className="w-5 h-5 text-orange-400" />;
    advice = 'Databases or remote management ports (RDP/VNC) open. Implement IP whitelisting or VPN tunneling.';
  } else if (score > 0) {
    statusText = 'MODERATE EXPOSURE';
    color = 'text-amber-300';
    borderColor = 'border-amber-500/40';
    bgColor = 'bg-amber-950/40';
    icon = <AlertTriangle className="w-5 h-5 text-amber-300" />;
    advice = 'Standard web or mail services open. Ensure TLS certificates and software versions are kept updated.';
  }

  return (
    <div className={`p-5 rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            ATTACK SURFACE THREAT SCORE
          </span>
        </div>
        <span className={`text-xl font-mono font-black ${color}`}>{score} / 100</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-3 border border-slate-800">
        <div
          className={`h-full transition-all duration-700 ${
            score >= 70 ? 'bg-rose-500' : score >= 40 ? 'bg-orange-500' : score > 0 ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className={`font-mono font-bold ${color}`}>STATUS: {statusText}</span>
        <span className="text-slate-400 font-mono text-[11px]">{advice}</span>
      </div>
    </div>
  );
};
