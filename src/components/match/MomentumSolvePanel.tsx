'use client';

import React, { useState } from 'react';
import { MomentumState, MomentumRoundData } from '@/lib/physics/momentumConservation';
import { Play, RotateCcw, HelpCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

interface MomentumSolvePanelProps {
  round: MomentumRoundData;
  momentumState: MomentumState;
  theme: 'dark' | 'light';
  onMassAChange: (massA: number) => void;
  onVelAChange: (velA: number) => void;
  onMassBChange: (massB: number) => void;
  onVelBChange: (velB: number) => void;
  onSelectScenario: (scenario: 'LAB_TRACK' | 'SPACECRAFT_DOCKING' | 'ZERO_MOMENTUM') => void;
  onStartExperiment: (predictedVf: number) => void;
  onResetSimulation: () => void;
  onCompleteMomentum: () => void;
}

export const MomentumSolvePanel: React.FC<MomentumSolvePanelProps> = ({
  round,
  momentumState,
  theme,
  onMassAChange,
  onVelAChange,
  onMassBChange,
  onVelBChange,
  onSelectScenario,
  onStartExperiment,
  onResetSimulation,
  onCompleteMomentum,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputPredictedVf, setInputPredictedVf] = useState<string>('1.86');

  const isLight = theme === 'light';

  const hints = [
    'Conservation of momentum: Total initial momentum equals total final momentum (p_initial = p_final).',
    'Calculate initial momentum of each cart: pA = mA * vA and pB = mB * vB.',
    'Total initial momentum p_total = pA + pB. Pay careful attention to direction (+ vs -).',
    'For a perfectly inelastic collision, both carts move together: v_final = p_total / (mA + mB).',
  ];

  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputPredictedVf);
    if (!isNaN(val)) {
      onStartExperiment(val);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Engineering Challenge Selector */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block">
            KINETICS CLASS • GAME 6
          </span>
          <h1 className="text-2xl font-black tracking-tight">PREDICT & REVEAL — MOMENTUM COLLISION LAB</h1>
          <p className="text-xs text-slate-400 font-mono">Observe · Calculate · Predict · Release Collision · Reveal</p>
        </div>

        <div className="flex items-center gap-2">
          {hintLevel < hints.length && (
            <button
              type="button"
              onClick={() => setHintLevel((prev) => prev + 1)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 hover:bg-slate-800"
              title="Hint"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onResetSimulation}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
            title="Reset Lab"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scenario Apparatus Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onSelectScenario('LAB_TRACK')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            momentumState.scenarioMode === 'LAB_TRACK'
              ? 'bg-slate-950 border-sky-500 text-sky-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🚃 UNEQUAL CARTS TRACK</div>
          <p className="text-[10px] opacity-70 mt-1">Predict final velocity vf for inelastic collision of unequal carts.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('SPACECRAFT_DOCKING')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            momentumState.scenarioMode === 'SPACECRAFT_DOCKING'
              ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🚀 SPACECRAFT DOCKING</div>
          <p className="text-[10px] opacity-70 mt-1">Heavy spacecraft docking with lighter orbital module.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('ZERO_MOMENTUM')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            momentumState.scenarioMode === 'ZERO_MOMENTUM'
              ? 'bg-slate-950 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🛑 ZERO MOMENTUM TARGET</div>
          <p className="text-[10px] opacity-70 mt-1">Adjust mass or velocity so total momentum p_total = 0 (carts stop!).</p>
        </button>
      </div>

      {/* 2. Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cart Physical Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cart A Parameters (Heavy) */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
              CART A (HEAVY OBJECT)
            </span>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Mass mA:</span>
                <span className="text-sky-400 font-bold">{momentumState.massA} kg</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                disabled={momentumState.isCollisionReleased}
                value={momentumState.massA}
                onChange={(e) => onMassAChange(Number(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Velocity vA:</span>
                <span className="text-emerald-400 font-bold">{momentumState.velA} m/s</span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="5.0"
                step="0.5"
                disabled={momentumState.isCollisionReleased}
                value={momentumState.velA}
                onChange={(e) => onVelAChange(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Cart B Parameters (Lighter) */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
              CART B (LIGHTER OBJECT)
            </span>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Mass mB:</span>
                <span className="text-purple-400 font-bold">{momentumState.massB} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                disabled={momentumState.isCollisionReleased}
                value={momentumState.massB}
                onChange={(e) => onMassBChange(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Velocity vB:</span>
                <span className="text-rose-400 font-bold">{momentumState.velB} m/s</span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="5.0"
                step="0.5"
                disabled={momentumState.isCollisionReleased}
                value={momentumState.velB}
                onChange={(e) => onVelBChange(Number(e.target.value))}
                className="w-full accent-rose-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Momentum Ledger & Predict & Release Workflow */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scientific Momentum Ledger Table */}
          <div className={`p-6 rounded-3xl border space-y-3 shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              SCIENTIFIC MOMENTUM LEDGER
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">pA = mA · vA:</span>
                <span className="text-sky-400 font-bold">{momentumState.pA} kg·m/s</span>
              </div>

              <div>
                <span className="text-slate-400 block">pB = mB · vB:</span>
                <span className="text-purple-400 font-bold">{momentumState.pB} kg·m/s</span>
              </div>

              <div className="pt-2 border-t border-slate-800 col-span-2 flex justify-between">
                <span className="text-slate-300 font-bold">TOTAL MOMENTUM (p_total):</span>
                <span className="text-amber-400 font-black text-sm">{momentumState.pTotal} kg·m/s</span>
              </div>
            </div>
          </div>

          {/* Predict & Release Workflow Box */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              PREDICT FINAL VELOCITY & RUN EXPERIMENT
            </span>

            <form onSubmit={handleRunSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  ENTER YOUR PREDICTED FINAL VELOCITY vf (m/s):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    disabled={momentumState.isCollisionReleased}
                    value={inputPredictedVf}
                    onChange={(e) => setInputPredictedVf(e.target.value)}
                    placeholder="Predicted vf (m/s)"
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-base focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">m/s</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={momentumState.isCollisionReleased}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START COLLISION EXPERIMENT</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Post-Collision Reveal Card */}
      {momentumState.isCollisionComplete && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/50 space-y-4 font-mono shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>COLLISION EXPERIMENT REVEALED!</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              CONSERVATION: 100% ACCURATE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">YOUR PREDICTION:</span>
              <span className="text-amber-400 font-black text-lg">{momentumState.predictedVf} m/s</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">ACTUAL MEASURED vf:</span>
              <span className="text-emerald-400 font-black text-lg">{momentumState.actualVf} m/s</span>
            </div>
          </div>
        </div>
      )}

      {/* Hints Display */}
      {hintLevel > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono space-y-1">
          {hints.slice(0, hintLevel).map((h, i) => (
            <p key={i}>💡 Hint {i + 1}: {h}</p>
          ))}
        </div>
      )}

      {/* Complete Button */}
      {momentumState.isComplete && (
        <button
          type="button"
          onClick={onCompleteMomentum}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM COLLISION VERIFIED (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
