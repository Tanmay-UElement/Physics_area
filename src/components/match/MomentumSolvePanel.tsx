'use client';

import React, { useState } from 'react';
import { MomentumRoundData } from '@/lib/physics/momentumConservation';
import { Play, Calculator, BarChart3 } from 'lucide-react';

interface MomentumSolvePanelProps {
  round: MomentumRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onLaunch: (vFinal: number) => void;
}

export const MomentumSolvePanel: React.FC<MomentumSolvePanelProps> = ({
  round,
  isSimulating,
  theme,
  onLaunch,
}) => {
  const [inputVal, setInputVal] = useState<string>('9.0');
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
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 text-blue-400 font-bold">
            MOMENTUM
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Momentum Conservation (Inelastic)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cart A (<span className="text-blue-400 font-bold">{round.mass1}kg</span> @ <span className="text-emerald-400 font-bold">{round.velocity1} m/s</span>) collides and locks together with stationary Cart B (<span className="text-purple-400 font-bold">{round.mass2}kg</span> @ 0 m/s).
          </p>
        </div>

        {/* Live Momentum Bar Chart Display */}
        <div className={`p-4 rounded-xl border space-y-3 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Initial Momentum P_in:</span>
            <span className="text-blue-400 font-bold">{round.mass1}kg × {round.velocity1}m/s = {round.totalMomentum} kg·m/s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Combined Mass:</span>
            <span className="text-purple-400 font-bold">{round.mass1} + {round.mass2} = {round.mass1 + round.mass2} kg</span>
          </div>
        </div>

        {/* Formula Tip */}
        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
          isLight ? 'bg-blue-500/10 border-blue-500/20 text-blue-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-blue-400">
            <Calculator className="w-4 h-4" />
            <span>Inelastic Coupling Formula</span>
          </div>
          <div className="font-mono text-[11px] text-blue-300 font-semibold">
            v_final = P_total / (m1 + m2) = ({round.totalMomentum}) / ({round.mass1 + round.mass2})
          </div>
        </div>
      </div>

      {/* Input Form & Fire Button */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ENTER FINAL VELOCITY v_final (m/s):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border font-mono font-bold text-base outline-none transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">m/s</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>FIRE COLLISION</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% for 100 XP Bullseye
        </p>
      </form>
    </div>
  );
};
