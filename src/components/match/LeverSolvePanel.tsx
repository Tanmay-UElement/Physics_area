'use client';

import React, { useState } from 'react';
import { LeverState, WeightItem } from '@/lib/physics/leverBalance';
import { Play, RotateCcw, HelpCircle, CheckCircle2, ShieldCheck, Scale, Zap, Compass } from 'lucide-react';

interface LeverSolvePanelProps {
  leverState: LeverState;
  theme: 'dark' | 'light';
  onWeightDistanceChange: (id: string, distM: number) => void;
  onFulcrumOffsetChange: (offsetM: number) => void;
  onSelectScenario: (scenario: 'BALANCE_BEAM' | 'HEAVY_LOAD' | 'ANGLED_FORCE' | 'UNKNOWN_MASS') => void;
  onStartSimulation: (predictedDistM: number, predictedDir: 'LEFT' | 'RIGHT' | 'BALANCED') => void;
  onResetSimulation: () => void;
  onCompleteLever: () => void;
}

export const LeverSolvePanel: React.FC<LeverSolvePanelProps> = ({
  leverState,
  theme,
  onWeightDistanceChange,
  onFulcrumOffsetChange,
  onSelectScenario,
  onStartSimulation,
  onResetSimulation,
  onCompleteLever,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputDistM, setInputDistM] = useState<string>('0.8');
  const [inputDir, setInputDir] = useState<'LEFT' | 'RIGHT' | 'BALANCED'>('BALANCED');

  const isLight = theme === 'light';

  const hints = [
    'Torque equation: τ = r × F × sin(θ). Torque increases linearly with distance r from the pivot.',
    'Rotational Equilibrium (Newton\'s 1st Law for Rotation): Balance requires Στ_left = Στ_right so Net Torque Στ = 0 N·m.',
    'Mechanical Advantage (MA = d_effort / d_load): Placing the fulcrum closer to a heavy load allows a smaller effort force to lift it.',
    'Angled Forces: Only the perpendicular component F sin(θ) produces torque. Forces pushing directly into the pivot (θ = 0°) produce zero torque.',
  ];

  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const distVal = parseFloat(inputDistM);
    if (!isNaN(distVal)) {
      onStartSimulation(distVal, inputDir);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Scenario Selector */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block">
            KINETICS CLASS • GAME 2
          </span>
          <h1 className="text-2xl font-black tracking-tight">LEVER LAB — TORQUE BALANCE</h1>
          <p className="text-xs text-slate-400 font-mono italic">“Where you push matters.”</p>
        </div>

        <div className="flex items-center gap-2">
          {hintLevel < hints.length && (
            <button
              type="button"
              onClick={() => setHintLevel((prev) => prev + 1)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 hover:bg-slate-800"
              title="Hint"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onResetSimulation}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
            title="Reset Arena"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onSelectScenario('BALANCE_BEAM')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            leverState.scenarioMode === 'BALANCE_BEAM'
              ? 'bg-slate-950 border-sky-500 text-sky-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">⚖️ BALANCE BEAM</div>
          <p className="text-[10px] opacity-70 mt-1">Balance 10kg load with 5kg weight.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('HEAVY_LOAD')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            leverState.scenarioMode === 'HEAVY_LOAD'
              ? 'bg-slate-950 border-amber-500 text-amber-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🏗️ HEAVY LOAD (MA)</div>
          <p className="text-[10px] opacity-70 mt-1">Shift fulcrum to lift 500N crate with 100N force.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('ANGLED_FORCE')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            leverState.scenarioMode === 'ANGLED_FORCE'
              ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">📐 ANGLED FORCE</div>
          <p className="text-[10px] opacity-70 mt-1">Test torque for perpendicular vs 45° forces.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('UNKNOWN_MASS')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            leverState.scenarioMode === 'UNKNOWN_MASS'
              ? 'bg-slate-950 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">❓ UNKNOWN MASS</div>
          <p className="text-[10px] opacity-70 mt-1">Deduce unknown mass Mx by balancing lever.</p>
        </button>
      </div>

      {/* 2. Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mechanical Controls & Technical Torque Meter */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fulcrum Shift & Mechanical Advantage */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
              FULCRUM POSITION & MECHANICAL ADVANTAGE
            </span>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Fulcrum Offset from Center:</span>
                <span className="text-sky-400 font-bold">{leverState.fulcrumOffsetM > 0 ? '+' : ''}{leverState.fulcrumOffsetM} m</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.2"
                disabled={leverState.isSimulating}
                value={leverState.fulcrumOffsetM}
                onChange={(e) => onFulcrumOffsetChange(Number(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Mechanical Advantage (MA):</span>
              <span className="text-emerald-400 font-bold text-sm">{leverState.mechanicalAdvantageMA}x</span>
            </div>
          </div>

          {/* Live Technical Torque Meter */}
          <div className={`p-6 rounded-3xl border space-y-3 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              TECHNICAL TORQUE METER (Στ = I × α)
            </span>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Left Counter Torque (↺):</span>
                <span className="text-sky-400 font-bold">{leverState.leftTorqueNm} N·m</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Right Clockwise Torque (↻):</span>
                <span className="text-purple-400 font-bold">{leverState.rightTorqueNm} N·m</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-amber-400 font-bold">
                <span>Net Torque (Στ):</span>
                <span>{leverState.netTorqueNm} N·m</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Rotational Inertia (I):</span>
                <span className="text-slate-200 font-bold">{leverState.rotationalInertiaI} kg·m²</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Angular Accel (α):</span>
                <span>{leverState.angularAccelRadps2} rad/s²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weight Drag Adjusters & Predict & Reveal Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Placed Weights Distance Adjusters */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              PLACED WEIGHTS & LEVER ARMS
            </span>

            {leverState.weights.map((w) => (
              <div key={w.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">{w.name} ({w.massKg}kg)</span>
                  <span className="text-sky-400 font-bold">{w.distanceM > 0 ? '+' : ''}{w.distanceM} m</span>
                </div>

                {w.isDraggable && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Distance from Fulcrum (r):</span>
                    <input
                      type="range"
                      min="-4.5"
                      max="4.5"
                      step="0.1"
                      disabled={leverState.isSimulating}
                      value={w.distanceM}
                      onChange={(e) => onWeightDistanceChange(w.id, Number(e.target.value))}
                      className="w-full h-1.5 accent-sky-500 bg-slate-800 rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Predict Result & Run Experiment Form */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              PREDICT BALANCE DISTANCE & ROTATION
            </span>

            <form onSubmit={handleRunSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400 block">PREDICTED DISTANCE (m):</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={leverState.isSimulating}
                    value={inputDistM}
                    onChange={(e) => setInputDistM(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-sm outline-none focus:border-sky-400 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400 block">EXPECTED ROTATION:</label>
                  <select
                    disabled={leverState.isSimulating}
                    value={inputDir}
                    onChange={(e) => setInputDir(e.target.value as any)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-sm outline-none focus:border-sky-400 disabled:opacity-50"
                  >
                    <option value="BALANCED">⚖️ STAY BALANCED</option>
                    <option value="LEFT">↺ TILT LEFT (CCW)</option>
                    <option value="RIGHT">↻ TILT RIGHT (CW)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={leverState.isSimulating}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-xl shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>RELEASE LEVER SIMULATION</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Post-Simulation Verification Card */}
      {leverState.isSimulationComplete && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-sky-500/50 space-y-4 font-mono shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>ROTATIONAL MOTION REVEALED!</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              PHYSICS INSIGHT VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">YOUR PREDICTION:</span>
              <span className="text-amber-400 font-black text-lg">{leverState.predictedBalanceDistM} m ({leverState.predictedDirection})</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">ACTUAL MEASURED NET TORQUE:</span>
              <span className="text-emerald-400 font-black text-lg">{leverState.netTorqueNm} N·m ({leverState.isBalanced ? 'BALANCED' : 'IMBALANCED'})</span>
            </div>
          </div>

          {leverState.physicsExplanation && (
            <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/40 text-sky-200 text-xs">
              {leverState.physicsExplanation}
            </div>
          )}
        </div>
      )}

      {/* Hints Display */}
      {hintLevel > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono space-y-1">
          {hints.slice(0, hintLevel).map((h, i) => (
            <p key={i}>💡 Hint {i + 1}: {h}</p>
          ))}
        </div>
      )}

      {/* Complete Button */}
      {leverState.isComplete && (
        <button
          type="button"
          onClick={onCompleteLever}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-emerald-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM LEVER EQUILIBRIUM MATCHED (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
