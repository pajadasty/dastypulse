import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Radio, Server } from 'lucide-react';

interface ScanControlsProps {
  onStartScan: (target: string, preset: string, customPorts?: number[]) => void;
  isScanning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ScanControls: React.FC<ScanControlsProps> = ({
  onStartScan,
  isScanning,
  soundEnabled,
  onToggleSound,
}) => {
  const [target, setTarget] = useState('127.0.0.1');
  const [preset, setPreset] = useState('top20');
  const [customPortsInput, setCustomPortsInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim() || isScanning) return;

    if (showCustom && customPortsInput.trim()) {
      const parsed = customPortsInput
        .split(',')
        .map((p) => parseInt(p.trim(), 10))
        .filter((p) => !isNaN(p) && p >= 1 && p <= 65535);
      onStartScan(target, 'custom', parsed);
    } else {
      onStartScan(target, preset);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-2xl space-y-4"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Target input */}
        <div className="flex-1 relative">
          <Server className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
          <input
            type="text"
            placeholder="Target Host or IP (e.g. 127.0.0.1, 192.168.1.1, scanme.nmap.org)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isScanning}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Audio Toggle & Scan Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Cyber SFX' : 'Enable Cyber SFX'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            type="submit"
            disabled={isScanning || !target.trim()}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 ${
              isScanning
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-wait animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.02]'
            }`}
          >
            {isScanning ? (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                SWEEPING PORTS...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                INITIATE RADAR SCAN
              </>
            )}
          </button>
        </div>
      </div>

      {/* Presets and Custom Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">Presets:</span>
          {[
            { id: 'top20', label: 'Top 20 Critical' },
            { id: 'web', label: 'Web Applications' },
            { id: 'databases', label: 'Database Cluster' },
            { id: 'infra', label: 'Core Infrastructure' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPreset(item.id);
                setShowCustom(false);
              }}
              className={`px-3 py-1 rounded-lg border transition-all ${
                preset === item.id && !showCustom
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className={`px-3 py-1 rounded-lg border transition-all ${
              showCustom
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Ports
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Quick Target:</span>
          <button
            type="button"
            onClick={() => setTarget('127.0.0.1')}
            className="text-cyan-400 hover:underline"
          >
            Localhost (127.0.0.1)
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={() => setTarget('192.168.1.1')}
            className="text-cyan-400 hover:underline"
          >
            Router Gateway
          </button>
        </div>
      </div>

      {showCustom && (
        <div className="pt-2 animate-in fade-in duration-200">
          <input
            type="text"
            placeholder="Comma-separated ports (e.g. 22, 80, 443, 3000, 8080, 27017)"
            value={customPortsInput}
            onChange={(e) => setCustomPortsInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400"
          />
        </div>
      )}
    </form>
  );
};
