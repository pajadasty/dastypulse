import React, { useEffect, useRef } from 'react';
import type { PortResult } from '../types';

interface CyberRadarProps {
  openPorts: PortResult[];
  isScanning: boolean;
}

export const CyberRadar: React.FC<CyberRadarProps> = ({ openPorts, isScanning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(cx, cy) - 25;

      // Dark background with slight trail fade
      ctx.fillStyle = 'rgba(6, 9, 15, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Radar Concentric Circles
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
      ctx.lineWidth = 1;

      for (let i = 1; i <= 4; i++) {
        const r = (maxRadius / 4) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Distance / Range markings
        ctx.fillStyle = 'rgba(0, 255, 102, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText(`PORT ${i * 2500}`, cx + 5, cy - r + 12);
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
      ctx.stroke();

      // Sweeping Beam (if scanning or idle)
      const currentAngle = angleRef.current;
      const sweepGradient = ctx.createConicGradient(currentAngle, cx, cy);
      sweepGradient.addColorStop(0, 'rgba(0, 255, 102, 0.35)');
      sweepGradient.addColorStop(0.12, 'rgba(0, 255, 102, 0.05)');
      sweepGradient.addColorStop(0.25, 'rgba(0, 255, 102, 0)');
      sweepGradient.addColorStop(1, 'rgba(0, 255, 102, 0)');

      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Main sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + maxRadius * Math.cos(currentAngle),
        cy + maxRadius * Math.sin(currentAngle)
      );
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Plot Open Ports as Glowing Blips
      openPorts.forEach((p) => {
        // Distribute blips based on port number and index
        const portAngle = ((p.port * 137.5) % 360) * (Math.PI / 180);
        // Distance based on port range
        const normalizedDist = Math.min(1, Math.max(0.2, Math.log10(p.port + 1) / 4.8));
        const dist = normalizedDist * maxRadius;

        const bx = cx + dist * Math.cos(portAngle);
        const by = cy + dist * Math.sin(portAngle);

        // Blip color based on risk
        let color = '#00ff66';
        if (p.risk === 'critical') color = '#f43f5e';
        else if (p.risk === 'high') color = '#f97316';
        else if (p.risk === 'medium') color = '#facc15';

        // Outer pulse circle
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Inner solid blip
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Port label
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`:${p.port}`, bx + 7, by - 4);
        ctx.font = '9px monospace';
        ctx.fillStyle = color;
        ctx.fillText(p.service, bx + 7, by + 7);
      });

      // Increment sweep angle
      angleRef.current += isScanning ? 0.045 : 0.015;
      if (angleRef.current >= Math.PI * 2) {
        angleRef.current = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [openPorts, isScanning]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-emerald-500/20 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
        <span className="text-xs font-mono text-emerald-400 tracking-wider font-bold">
          {isScanning ? 'ACTIVE FREQUENCY SWEEP' : 'RADAR SYSTEM READY'}
        </span>
      </div>

      <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">
        RANGE: 0 - 65535 TCP
      </div>

      <canvas
        ref={canvasRef}
        width={380}
        height={380}
        className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] rounded-full my-2"
      />

      <div className="flex items-center justify-center gap-6 text-[11px] font-mono text-slate-400 border-t border-slate-900 w-full pt-3 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Low / Safe
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Medium
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> High / Critical
        </div>
      </div>
    </div>
  );
};
