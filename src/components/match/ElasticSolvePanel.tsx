'use client';

import React, { useState } from 'react';
import { ElasticRoundData } from '@/lib/physics/elasticCollision';
import { Play, Calculator, Zap } from 'lucide-react';

interface ElasticSolvePanelProps {
  round: ElasticRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onLaunch: (vB: number) => void;
}

export const ElasticSolvePanel: React.FC<ElasticSolvePanelProps> = ({
  round,
  isSimulating,
  theme,
  onLaunch,
}) => {
  const [inputVal, setInputVal] = useState<string>('10.0');
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
            <Zap className="w-5 h-5 text-cyan-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 font-bold">
            CALCULATE ELASTIC VELOCITY
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Elastic Collision (Equal Mass)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Moving Sphere A (<span className="text-cyan-400 font-bold">{round.mass}kg</span> @ <span className="text-emerald-400 font-bold">{round.initialVelocityA} m/s</span>) collides elastically with stationary Sphere B (<span className="text-cyan-400 font-bold">{round.mass}kg</span> @ 0 m/s).
          </p>
        </div>

        {/* Given Telemetry Box */}
        <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Sphere Mass (m₁ = m₂):</span>
            <span className="text-cyan-400 font-bold">{round.mass} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Sphere A Initial Velocity (v₁):</span>
            <span className="text-emerald-400 font-bold">{round.initialVelocityA} m/s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Sphere B Initial Velocity (v₂):</span>
            <span className="text-slate-400 font-bold">0 m/s</span>
          </div>
        </div>

        {/* Formula Tip */}
        <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
          isLight ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-cyan-400">
            <Calculator className="w-4 h-4" />
            <span>Equal Mass 1D Elastic Collision Formula</span>
          </div>
          <div className="font-mono text-[11px] text-cyan-300">
            v_B' = ((2 × m_A) / (m_A + m_B)) × v_A = v_A
          </div>
        </div>
      </div>

      {/* Numerical Calculation Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ENTER CALCULATED POST-COLLISION VELOCITY v_B' (M/S):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border font-mono font-bold text-base outline-none transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">m/s</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>FIRE ELASTIC COLLISION</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% velocity error for 100 XP Bullseye
        </p>
      </form>
    </div>
  );
};
