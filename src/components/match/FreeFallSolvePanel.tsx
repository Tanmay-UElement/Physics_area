'use client';

import React, { useState } from 'react';
import { FreeFallState, FreeFallRoundData } from '@/lib/physics/freeFall';
import { Play, RotateCcw, HelpCircle, CheckCircle2, ShieldCheck, Scale, Compass, Zap, Flame, Globe } from 'lucide-react';

interface FreeFallSolvePanelProps {
  round: FreeFallRoundData;
  freeFallState: FreeFallState;
  theme: 'dark' | 'light';
  onDropHeightChange: (h: number) => void;
  onInitialVelChange: (v0: number) => void;
  onPlanetChange: (g: number, name: string) => void;
  onToggleAirResistance: () => void;
  onSelectScenario: (scenario: 'HEAVY_VS_LIGHT' | 'UPWARD_LAUNCH' | 'VACUUM_CHAMBER' | 'PLANET_GRAVITY' | 'FIND_G') => void;
  onStartExperiment: (predictedTimeSec: number, landingPrediction: 'A' | 'B' | 'SAME', predictedPeakAccel: number) => void;
  onResetSimulation: () => void;
  onCompleteFreeFall: () => void;
}

export const FreeFallSolvePanel: React.FC<FreeFallSolvePanelProps> = ({
  round,
  freeFallState,
  theme,
  onDropHeightChange,
  onInitialVelChange,
  onPlanetChange,
  onToggleAirResistance,
  onSelectScenario,
  onStartExperiment,
  onResetSimulation,
  onCompleteFreeFall,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputPredictedTime, setInputPredictedTime] = useState<string>('2.02');
  const [landingPrediction, setLandingPrediction] = useState<'A' | 'B' | 'SAME'>('SAME');
  const [predictedPeakAccel, setPredictedPeakAccel] = useState<number>(-9.81);

  const isLight = theme === 'light';

  const hints = [
    'Ideal free fall: Gravitational acceleration g is independent of object mass.',
    'Equation of motion: h = 1/2 * g * t^2 => t = sqrt(2h / g).',
    'Heavier objects experience larger force (F = mg), but also larger inertia (a = F/m = g).',
    'At the peak of an upward launch, velocity v = 0 m/s, but acceleration a is STILL -9.81 m/s² downward!',
  ];

  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeVal = parseFloat(inputPredictedTime);
    if (!isNaN(timeVal)) {
      onStartExperiment(timeVal, landingPrediction, predictedPeakAccel);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Misconception Challenge Selector */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
            KINETICS CLASS • GAME 4
          </span>
          <h1 className="text-2xl font-black tracking-tight">GRAVITY LAB — PREDICT & REVEAL</h1>
          <p className="text-xs text-slate-400 font-mono italic">“Your intuition says one thing. Physics says another.”</p>
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
            title="Reset Lab"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onSelectScenario('HEAVY_VS_LIGHT')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            freeFallState.scenarioMode === 'HEAVY_VS_LIGHT'
              ? 'bg-slate-950 border-amber-500 text-amber-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">⚖️ HEAVY VS LIGHT</div>
          <p className="text-[10px] opacity-70 mt-1">Which object lands first: 5.0kg vs 0.5kg sphere?</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('UPWARD_LAUNCH')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            freeFallState.scenarioMode === 'UPWARD_LAUNCH'
              ? 'bg-slate-950 border-cyan-500 text-cyan-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🚀 UPWARD LAUNCH</div>
          <p className="text-[10px] opacity-70 mt-1">What is acceleration at the highest point (v=0)?</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('VACUUM_CHAMBER')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            freeFallState.scenarioMode === 'VACUUM_CHAMBER'
              ? 'bg-slate-950 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🌌 VACUUM CHAMBER</div>
          <p className="text-[10px] opacity-70 mt-1">Feather vs Sphere with Air Drag OFF/ON.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('PLANET_GRAVITY')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            freeFallState.scenarioMode === 'PLANET_GRAVITY'
              ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🪐 PLANETARY GRAVITY</div>
          <p className="text-[10px] opacity-70 mt-1">Test drops on Earth, Moon, Mars, Jupiter.</p>
        </button>
      </div>

      {/* 2. Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Controls & Force Inspector */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              PHYSICAL PARAMETERS
            </span>

            {/* Drop Height Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Drop Height (h):</span>
                <span className="text-amber-400 font-bold">{freeFallState.dropHeightM} m</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="50.0"
                step="2.5"
                disabled={freeFallState.isDropReleased}
                value={freeFallState.dropHeightM}
                onChange={(e) => onDropHeightChange(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Upward Launch Velocity (if UPWARD_LAUNCH scenario) */}
            {freeFallState.scenarioMode === 'UPWARD_LAUNCH' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Launch Velocity (v0):</span>
                  <span className="text-cyan-400 font-bold">+{freeFallState.initialVelocityMps} m/s</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="25.0"
                  step="1.0"
                  disabled={freeFallState.isDropReleased}
                  value={freeFallState.initialVelocityMps}
                  onChange={(e) => onInitialVelChange(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            )}

            {/* Planet Gravity Selector */}
            {freeFallState.scenarioMode === 'PLANET_GRAVITY' && (
              <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
                <span className="text-slate-400 block">SELECT PLANETARY GRAVITY:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPlanetChange(9.81, 'Earth')}
                    className={`p-2 rounded-xl border ${freeFallState.planetName === 'Earth' ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    🌍 Earth (9.81 m/s²)
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlanetChange(1.62, 'Moon')}
                    className={`p-2 rounded-xl border ${freeFallState.planetName === 'Moon' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    🌙 Moon (1.62 m/s²)
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlanetChange(3.71, 'Mars')}
                    className={`p-2 rounded-xl border ${freeFallState.planetName === 'Mars' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    🔴 Mars (3.71 m/s²)
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlanetChange(24.79, 'Jupiter')}
                    className={`p-2 rounded-xl border ${freeFallState.planetName === 'Jupiter' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    ⚡ Jupiter (24.79 m/s²)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Force vs Acceleration Inspector */}
          {freeFallState.showForceInspector && (
            <div className={`p-6 rounded-3xl border space-y-3 shadow-lg ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                FORCE VS ACCELERATION INSPECTOR (F = mg)
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Object A (5.0 kg):</span>
                  <span className="text-red-400 font-bold">F_A = {freeFallState.forceA} N</span>
                  <span className="text-slate-300 block text-[10px] mt-1">a_A = F/m = {freeFallState.accelA} m/s²</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Object B (0.5 kg):</span>
                  <span className="text-cyan-400 font-bold">F_B = {freeFallState.forceB} N</span>
                  <span className="text-slate-300 block text-[10px] mt-1">a_B = F/m = {freeFallState.accelB} m/s²</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Predict & Reveal Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              PREDICT RESULT & RUN EXPERIMENT
            </span>

            <form onSubmit={handleRunSubmit} className="space-y-4">
              {freeFallState.scenarioMode === 'HEAVY_VS_LIGHT' && (
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    WHICH OBJECT WILL LAND FIRST?
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <button
                      type="button"
                      disabled={freeFallState.isDropReleased}
                      onClick={() => setLandingPrediction('A')}
                      className={`p-3 rounded-xl border font-bold ${landingPrediction === 'A' ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      OBJECT A (5.0kg)
                    </button>
                    <button
                      type="button"
                      disabled={freeFallState.isDropReleased}
                      onClick={() => setLandingPrediction('B')}
                      className={`p-3 rounded-xl border font-bold ${landingPrediction === 'B' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      OBJECT B (0.5kg)
                    </button>
                    <button
                      type="button"
                      disabled={freeFallState.isDropReleased}
                      onClick={() => setLandingPrediction('SAME')}
                      className={`p-3 rounded-xl border font-bold ${landingPrediction === 'SAME' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                    >
                      BOTH TOGETHER
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  ENTER YOUR PREDICTED FALL TIME (SECONDS):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    disabled={freeFallState.isDropReleased}
                    value={inputPredictedTime}
                    onChange={(e) => setInputPredictedTime(e.target.value)}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-base focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">sec</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={freeFallState.isDropReleased}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START GRAVITY DROP EXPERIMENT</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Post-Drop Reveal Card */}
      {freeFallState.isDropComplete && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/50 space-y-4 font-mono shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>GRAVITY DROP EXPERIMENT REVEALED!</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              PHYSICS INSIGHT VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">YOUR PREDICTION:</span>
              <span className="text-amber-400 font-black text-lg">{freeFallState.predictedTimeSec} s</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">ACTUAL MEASURED TIME:</span>
              <span className="text-emerald-400 font-black text-lg">{freeFallState.calculatedFallTimeSec} s</span>
            </div>
          </div>

          {freeFallState.misconceptionMessage && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
              {freeFallState.misconceptionMessage}
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
      {freeFallState.isComplete && (
        <button
          type="button"
          onClick={onCompleteFreeFall}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM GRAVITY EXPERIMENT VERIFIED (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
