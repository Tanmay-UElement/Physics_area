'use client';

import React, { useState } from 'react';
import { FreeFallRoundData } from '@/lib/physics/freeFall';
import { Play, Calculator, Timer } from 'lucide-react';

interface FreeFallSolvePanelProps {
  round: FreeFallRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onLaunch: (time: number) => void;
}

export const FreeFallSolvePanel: React.FC<FreeFallSolvePanelProps> = ({
  round,
  isSimulating,
  theme,
  onLaunch,
}) => {
  const [inputVal, setInputVal] = useState<string>('2.0');
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
            <Timer className="w-5 h-5 text-red-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/30 text-red-400 font-bold">
            CALCULATE FALL TIME
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Free Fall Time Calculation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sphere A (<span className="text-red-500 font-bold">{round.heavyMass}kg</span>) and Sphere B (<span className="text-cyan-400 font-bold">{round.lightMass}kg</span>) are dropped from height <span className="text-emerald-400 font-bold">{round.dropHeight}m</span> under gravity <span className="text-amber-400 font-bold">g = 9.8 m/s²</span>.
          </p>
        </div>

        {/* Telemetry Given Data */}
        <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Drop Height (h):</span>
            <span className="text-emerald-400 font-bold">{round.dropHeight} m</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Gravitational Accel (g):</span>
            <span className="text-amber-400 font-bold">9.8 m/s²</span>
          </div>
        </div>

        {/* Formula Tip */}
        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
          isLight ? 'bg-red-500/10 border-red-500/20 text-red-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-red-400">
            <Calculator className="w-4 h-4" />
            <span>Free Fall Time Formula</span>
          </div>
          <div className="font-mono text-[11px] text-red-300 font-semibold">
            t = √((2 × h) / g) = √((2 × {round.dropHeight}) / 9.8)
          </div>
        </div>
      </div>

      {/* Numerical Calculation Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ENTER CALCULATED FALL TIME t (SECONDS):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border font-mono font-bold text-base outline-none transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-red-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-red-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">sec</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 hover:from-red-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>LAUNCH DROP SIMULATION</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% time error for 100 XP Bullseye
        </p>
      </form>
    </div>
  );
};
