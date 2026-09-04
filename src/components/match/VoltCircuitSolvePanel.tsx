'use client';

import React, { useState } from 'react';
import { VoltCircuitRoundData } from '@/lib/physics/voltCircuitBuilder';
import { Play, Calculator, Cpu } from 'lucide-react';

interface VoltCircuitSolvePanelProps {
  round: VoltCircuitRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onLaunch: (resistance: number) => void;
}

export const VoltCircuitSolvePanel: React.FC<VoltCircuitSolvePanelProps> = ({
  round,
  isSimulating,
  theme,
  onLaunch,
}) => {
  const [inputVal, setInputVal] = useState<string>('6.0');
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
            <Cpu className="w-5 h-5 text-sky-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-500/30 text-sky-400 font-bold">
            OHM'S LAW
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Circuit Builder (Ohm's Law)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate the exact resistor <span className="text-sky-400 font-bold">R</span> needed for voltage <span className="text-sky-400 font-bold">{round.voltage}V</span> to achieve target current <span className="text-emerald-400 font-bold">{round.targetCurrent}A</span>.
          </p>
        </div>

        {/* Given Telemetry Box */}
        <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Voltage Source (V):</span>
            <span className="text-sky-400 font-bold">{round.voltage} V</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Target Current (I):</span>
            <span className="text-emerald-400 font-bold">{round.targetCurrent} A</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Max Safe Fuse Limit:</span>
            <span className="text-red-400 font-bold">{round.maxSafeCurrent} A</span>
          </div>
        </div>

        {/* Formula Tip */}
        <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
          isLight ? 'bg-sky-500/10 border-sky-500/20 text-sky-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-sky-400">
            <Calculator className="w-4 h-4" />
            <span>Ohm's Law Formula</span>
          </div>
          <div className="font-mono text-[11px] text-sky-300 font-semibold">
            R = V / I_target = ({round.voltage}) / ({round.targetCurrent})
          </div>
        </div>
      </div>

      {/* Numerical Calculation Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            ENTER REQUIRED RESISTANCE R (OHMS Ω):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border font-mono font-bold text-base outline-none transition-colors ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">Ω</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>CONNECT RESISTOR & POWER ON</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% resistance error for 100 XP Bullseye
        </p>
      </form>
    </div>
  );
};
