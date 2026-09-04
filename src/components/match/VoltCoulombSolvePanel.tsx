'use client';

import React, { useState } from 'react';
import { VoltCoulombRoundData } from '@/lib/physics/voltCoulombTug';
import { Play, Calculator, Zap } from 'lucide-react';

interface VoltCoulombSolvePanelProps {
  round: VoltCoulombRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onLaunch: (distance: number) => void;
}

export const VoltCoulombSolvePanel: React.FC<VoltCoulombSolvePanelProps> = ({
  round,
  isSimulating,
  theme,
  onLaunch,
}) => {
  const [inputVal, setInputVal] = useState<string>('9.49');
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
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 text-purple-400 font-bold">
            COULOMB'S LAW
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Coulomb Tug (Electrostatics)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate distance <span className="text-purple-400 font-bold">r</span> between charges <span className="text-cyan-400 font-bold">{round.charge1}μC</span> and <span className="text-purple-400 font-bold">{round.charge2}μC</span> for force <span className="text-emerald-400 font-bold">{round.targetForce}N</span>.
          </p>
        </div>

        {/* Telemetry Given Box */}
        <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Charge 1 (q₁):</span>
            <span className="text-cyan-400 font-bold">{round.charge1} μC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Charge 2 (q₂):</span>
            <span className="text-purple-400 font-bold">{round.charge2} μC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Target Force (F):</span>
            <span className="text-emerald-400 font-bold">{round.targetForce} N</span>
          </div>
        </div>

        {/* Formula Tip */}
        <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
          isLight ? 'bg-purple-500/10 border-purple-500/20 text-purple-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
            <Calculator className="w-4 h-4" />
            <span>Coulomb's Law Formula</span>
          </div>
          <div className="font-mono text-[11px] text-purple-300 font-semibold">
            r = √((k × q₁ × q₂) / F_target) = √((90 × {round.charge1} × {round.charge2}) / {round.targetForce})
          </div>
        </div>
      </div>

      {/* Numerical Calculation Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ENTER CALCULATED DISTANCE r (METERS):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border font-mono font-bold text-base outline-none transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-purple-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-purple-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">m</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>SET DISTANCE & APPLY CHARGE TUG</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% distance error for 100 XP Bullseye
        </p>
      </form>
    </div>
  );
};
