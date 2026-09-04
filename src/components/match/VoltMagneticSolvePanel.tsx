'use client';

import React, { useState } from 'react';
import { VoltMagneticRoundData } from '@/lib/physics/voltMagneticMaze';
import { Play, Calculator, Compass } from 'lucide-react';

interface VoltMagneticSolvePanelProps {
  round: VoltMagneticRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onLaunch: (radius: number) => void;
}

export const VoltMagneticSolvePanel: React.FC<VoltMagneticSolvePanelProps> = ({
  round,
  isSimulating,
  theme,
  onLaunch,
}) => {
  const [inputVal, setInputVal] = useState<string>('4.00');
  const isLight = theme === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputVal);
    if (!isNaN(num)) {
      onLaunch(num);
    }
  };

  return (
    <div className={`w-full h-full p-6 rounded-2xl border shadow-xl flex flex-col justify-between space-y-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-pink-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-pink-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-pink-500/30 text-pink-400 font-bold">
            LORENTZ FORCE
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Magnetic Maze (Lorentz Force)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate cyclotron radius <span className="text-pink-400 font-bold">r</span> for particle mass <span className="text-pink-400 font-bold">{round.mass}kg</span>, charge <span className="text-pink-400 font-bold">{round.charge}C</span>, speed <span className="text-emerald-400 font-bold">{round.particleSpeed}m/s</span> in field <span className="text-purple-400 font-bold">{round.magneticField}T</span>.
          </p>
        </div>

        {/* Telemetry Given Box */}
        <div className={`p-4 rounded-xl border space-y-2 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Particle Mass (m):</span>
            <span className="text-pink-400 font-bold">{round.mass} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Velocity (v):</span>
            <span className="text-emerald-400 font-bold">{round.particleSpeed} m/s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Charge (q):</span>
            <span className="text-pink-400 font-bold">{round.charge} C</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Magnetic Field (B):</span>
            <span className="text-purple-400 font-bold">{round.magneticField} T</span>
          </div>
        </div>

        {/* Formula Tip */}
        <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
          isLight ? 'bg-pink-500/10 border-pink-500/20 text-pink-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-pink-400">
            <Calculator className="w-4 h-4" />
            <span>Cyclotron Radius Formula</span>
          </div>
          <div className="font-mono text-[11px] text-pink-300 font-semibold">
            r = (m × v) / (q × B) = ({round.mass} × {round.particleSpeed}) / ({round.charge} × {round.magneticField})
          </div>
        </div>
      </div>

      {/* Numerical Calculation Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ENTER CALCULATED RADIUS r (METERS):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border font-mono font-bold text-base outline-none transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-pink-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-pink-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">m</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>FIRE PARTICLE & NAVIGATE MAZE</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% radius error for 100 XP Bullseye
        </p>
      </form>
    </div>
  );
};
