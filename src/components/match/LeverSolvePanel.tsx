'use client';

import React from 'react';
import { LeverRoundData } from '@/lib/physics/leverBalance';
import { Play, Calculator, Scale, HelpCircle } from 'lucide-react';

interface LeverSolvePanelProps {
  round: LeverRoundData;
  userDistance: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onCheckBalance: () => void;
}

export const LeverSolvePanel: React.FC<LeverSolvePanelProps> = ({
  round,
  userDistance,
  isSimulating,
  theme,
  onCheckBalance,
}) => {
  const isLight = theme === 'light';

  const leftTorque = round.leftMass * round.leftDistance;
  const rightTorque = Number((round.rightMass * userDistance).toFixed(1));
  const torqueDiff = Math.abs(leftTorque - rightTorque).toFixed(1);

  return (
    <div className={`w-full h-full p-6 rounded-2xl border shadow-xl flex flex-col justify-between space-y-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-500">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-500 font-bold">
            FEEL TORQUE
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Lever & Torque Balance</h2>
          <p className="text-xs text-slate-400 mt-1">
            Drag the green <span className="text-emerald-500 font-bold">{round.rightMass}kg</span> weight along the right seesaw arm until the beam stays level.
          </p>
        </div>

        {/* Live Torque Telemetry Box */}
        <div className={`p-4 rounded-xl border space-y-3 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Left Counter Torque:</span>
            <span className="text-red-500 font-bold">{round.leftMass}kg × {round.leftDistance}m = {leftTorque} N·m</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Right Clockwise Torque:</span>
            <span className="text-emerald-500 font-bold">{round.rightMass}kg × {userDistance}m = {rightTorque} N·m</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
            <span className="text-slate-400">Net Torque Imbalance:</span>
            <span className={Number(torqueDiff) < 5 ? 'text-emerald-400' : 'text-amber-400'}>
              Δτ = {torqueDiff} N·m
            </span>
          </div>
        </div>

        {/* Formula Hint */}
        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
          isLight ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-cyan-500">
            <Calculator className="w-4 h-4" />
            <span>Rotational Equilibrium Formula</span>
          </div>
          <div className="font-mono text-[11px] text-cyan-400 font-semibold">
            Στ = (m_left × d_left) - (m_right × d_right) = 0
          </div>
        </div>
      </div>

      {/* Check Balance Launch Button */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={onCheckBalance}
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>CHECK BALANCE</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% distance error for 100 XP Bullseye
        </p>
      </div>
    </div>
  );
};
