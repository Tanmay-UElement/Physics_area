'use client';

import React from 'react';
import { VectorRoundData, Vector2D } from '@/lib/physics/vectorTug';
import { Play, Calculator, Compass, Move } from 'lucide-react';

interface VectorSolvePanelProps {
  round: VectorRoundData;
  userVector: Vector2D;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onFireVectors: () => void;
}

export const VectorSolvePanel: React.FC<VectorSolvePanelProps> = ({
  round,
  userVector,
  isSimulating,
  theme,
  onFireVectors,
}) => {
  const isLight = theme === 'light';

  const netX = round.f1.x + round.f2.x + userVector.x;
  const netY = round.f1.y + round.f2.y + userVector.y;
  const netMag = Math.sqrt(netX * netX + netY * netY).toFixed(1);

  return (
    <div className={`w-full h-full p-6 rounded-2xl border shadow-xl flex flex-col justify-between space-y-6 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-100'
    }`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-400">
              ROUND {round.roundNumber} OF {round.totalRounds}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 text-purple-400 font-bold">
            2D VECTOR DRAG
          </span>
        </div>

        <div>
          <h2 className="text-xl font-black">Vector Tug-of-War</h2>
          <p className="text-xs text-slate-400 mt-1">
            Drag the green force vector <span className="text-emerald-500 font-bold">F_user</span> to cancel opposing forces and redirect the object into the gold ring!
          </p>
        </div>

        {/* Live Vector Components Breakdown */}
        <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-cyan-400">Force 1 Vector (F1):</span>
            <span className="font-bold">({round.f1.x}, {round.f1.y}) N</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-purple-400">Force 2 Vector (F2):</span>
            <span className="font-bold">({round.f2.x}, {round.f2.y}) N</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-emerald-400">User Vector (F_user):</span>
            <span className="font-bold">({userVector.x}, {userVector.y}) N</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-amber-400">
            <span>Net Vector (F_net):</span>
            <span>({netX}, {netY}) N | |F| = {netMag}N</span>
          </div>
        </div>

        {/* 2D Vector Addition Formula Hint */}
        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
          isLight ? 'bg-purple-500/10 border-purple-500/20 text-purple-900' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
            <Calculator className="w-4 h-4" />
            <span>2D Net Force Vector Formula</span>
          </div>
          <div className="font-mono text-[11px] text-purple-300 font-semibold">
            F_net = F1 + F2 + F_user = F_goal
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={onFireVectors}
          disabled={isSimulating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>FIRE FORCE VECTORS!</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 font-mono">
          Tolerance: ±5% vector error for 100 XP Bullseye
        </p>
      </div>
    </div>
  );
};
