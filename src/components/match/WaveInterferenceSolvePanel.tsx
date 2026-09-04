'use client';

import React, { useState } from 'react';
import { InterferenceState, WaveInterferenceRoundData } from '@/lib/physics/waveInterference';
import { Radio, Play, RotateCcw, HelpCircle, CheckCircle2, Zap, Gauge, Volume2, TrendingUp, Compass, Activity, Sliders, ShieldCheck } from 'lucide-react';

interface WaveInterferenceSolvePanelProps {
  round: WaveInterferenceRoundData;
  interferenceState: InterferenceState;
  theme: 'dark' | 'light';
  onPhaseChange: (phaseDeg: number) => void;
  onFrequencyChange: (freqHz: number) => void;
  onAmplitudeChange: (amp: number) => void;
  onSelectPuzzleMode: (mode: 'NOISE_CANCELLATION' | 'SIGNAL_AMPLIFICATION' | 'POSITION_PUZZLE') => void;
  onRunExperiment: (predictedDb: number, predictedType: 'CONSTRUCTIVE' | 'DESTRUCTIVE') => void;
  onResetSimulation: () => void;
  onCompleteInterference: () => void;
}

export const WaveInterferenceSolvePanel: React.FC<WaveInterferenceSolvePanelProps> = ({
  round,
  interferenceState,
  theme,
  onPhaseChange,
  onFrequencyChange,
  onAmplitudeChange,
  onSelectPuzzleMode,
  onRunExperiment,
  onResetSimulation,
  onCompleteInterference,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputPredictedDb, setInputPredictedDb] = useState<string>('50');
  const [inputPredictedType, setInputPredictedType] = useState<'CONSTRUCTIVE' | 'DESTRUCTIVE'>('DESTRUCTIVE');

  const isLight = theme === 'light';

  const hints = [
    'Superposition principle: Resultant displacement y_total = y1 + y2.',
    'Destructive cancellation occurs when total phase difference Δφ_total = 180° (path phase + source phase = 180°).',
    'Calculate path difference ΔL = |r2 - r1|. If ΔL ≈ 0m, set Speaker B phase offset to 180° to cancel the noise!',
    'If phase is locked, drag Speaker B on the floor grid to a position where r2 - r1 = 0.245m (λ/2) to achieve cancellation!',
  ];

  const handleExperimentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputPredictedDb);
    if (!isNaN(val)) {
      onRunExperiment(val, inputPredictedType);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Engineering Challenge Selector */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
            WAVE CLASS • GAME 3
          </span>
          <h1 className="text-2xl font-black tracking-tight">WAVE INTERFERENCE ARENA</h1>
          <p className="text-xs text-slate-400 font-mono">Observe · Experiment · Adjust · Run Waves · Measure · Solve</p>
        </div>

        <div className="flex items-center gap-2">
          {hintLevel < hints.length && (
            <button
              type="button"
              onClick={() => setHintLevel((prev) => prev + 1)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-slate-800"
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

      {/* Challenge Puzzle Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onSelectPuzzleMode('NOISE_CANCELLATION')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            interferenceState.puzzleMode === 'NOISE_CANCELLATION'
              ? 'bg-slate-950 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span>🎧 ACTIVE NOISE CONTROL</span>
          </div>
          <p className="text-[10px] opacity-70 mt-1">Reduce noise level at red microphone from 92 dB to below 55 dB.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPuzzleMode('POSITION_PUZZLE')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            interferenceState.puzzleMode === 'POSITION_PUZZLE'
              ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span>📍 SPEAKER REPOSITIONING</span>
          </div>
          <p className="text-[10px] opacity-70 mt-1">Phase is locked! Drag Speaker B to create a λ/2 path difference.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPuzzleMode('SIGNAL_AMPLIFICATION')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            interferenceState.puzzleMode === 'SIGNAL_AMPLIFICATION'
              ? 'bg-slate-950 border-amber-500 text-amber-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5">
            <span>📶 SIGNAL AMPLIFICATION</span>
          </div>
          <p className="text-[10px] opacity-70 mt-1">Amplify signal at receiver to above 85 dB using constructive superposition.</p>
        </button>
      </div>

      {/* 2. Main Workbench Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Speaker Physical Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Phase Offset Regulator Knob */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                SPEAKER B PHASE OFFSET (φ)
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">{interferenceState.sourceB.phaseDeg}°</span>
            </div>

            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              disabled={interferenceState.puzzleMode === 'POSITION_PUZZLE'}
              value={interferenceState.sourceB.phaseDeg}
              onChange={(e) => onPhaseChange(Number(e.target.value))}
              className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>-180° (Out of Phase)</span>
              <span>0° (In Phase)</span>
              <span>+180° (Out of Phase)</span>
            </div>
          </div>

          {/* Frequency & Amplitude Sliders */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Source Frequency (f):</span>
                <span className="text-sky-400 font-bold">{interferenceState.sourceA.frequencyHz} Hz</span>
              </div>
              <input
                type="range"
                min="300"
                max="800"
                step="10"
                value={interferenceState.sourceA.frequencyHz}
                onChange={(e) => onFrequencyChange(Number(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Source Amplitude (A):</span>
                <span className="text-emerald-400 font-bold">{interferenceState.sourceA.amplitude}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={interferenceState.sourceA.amplitude}
                onChange={(e) => onAmplitudeChange(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Oscilloscope, Live SPL Meter & RUN EXPERIMENT Workflow */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vertical SPL Decibel Meter & Dual Channel Oscilloscope */}
          <div className={`p-6 rounded-3xl border shadow-xl grid grid-cols-1 sm:grid-cols-12 gap-6 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            {/* Vertical Sound Pressure Level (SPL) Meter Bar */}
            <div className="sm:col-span-4 flex flex-col items-center space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                SPL METER (dB)
              </span>

              <div className="relative w-12 h-36 bg-slate-950 rounded-2xl border border-slate-800 p-1 flex items-end">
                {/* SPL Fill Bar */}
                <div
                  className={`w-full rounded-xl transition-all duration-300 ${
                    interferenceState.targetMet
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                      : interferenceState.measuredDb > 75
                      ? 'bg-gradient-to-t from-rose-500 to-amber-400'
                      : 'bg-gradient-to-t from-amber-500 to-yellow-400'
                  }`}
                  style={{ height: `${Math.max(10, Math.min(100, (interferenceState.measuredDb / 100) * 100))}%` }}
                />

                {/* Target Threshold Line (< 55 dB) */}
                <div className="absolute left-0 right-0 top-[45%] border-b-2 border-dashed border-emerald-400 z-10">
                  <span className="text-[8px] font-mono font-bold text-emerald-400 bg-slate-950 px-1 -translate-y-2 block">
                    TARGET 55dB
                  </span>
                </div>
              </div>

              <div className="text-xl font-mono font-black text-amber-400">
                {interferenceState.measuredDb} <span className="text-xs text-slate-400 font-normal">dB</span>
              </div>
            </div>

            {/* Dual Channel Oscilloscope Waveform Plot */}
            <div className="sm:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  LIVE OSCILLOSCOPE ANALYZER
                </span>
                <div className="flex items-center gap-2 text-[9px] font-mono">
                  <span className="text-sky-400">Wave A</span>
                  <span className="text-purple-400">Wave B</span>
                  <span className="text-emerald-400 font-bold">Resultant</span>
                </div>
              </div>

              <div className="relative h-28 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Wave A */}
                  <path
                    d="M 0 50 Q 37.5 20 75 50 T 150 50 T 225 50 T 300 50"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />

                  {/* Wave B */}
                  <path
                    d={`M 0 50 Q 37.5 ${50 - Math.cos((interferenceState.sourceB.phaseDeg * Math.PI) / 180) * 30} 75 50 T 150 50 T 225 50 T 300 50`}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />

                  {/* Resultant */}
                  <path
                    d={`M 0 50 Q 37.5 ${50 - (1 + Math.cos((interferenceState.totalPhaseDiffDeg * Math.PI) / 180)) * 25} 75 50 T 150 50 T 225 50 T 300 50`}
                    fill="none"
                    stroke={interferenceState.targetMet ? '#34d399' : '#ef4444'}
                    strokeWidth="3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Predict & RUN EXPERIMENT Workflow Box */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              PREDICT RESULT & RUN EXPERIMENT
            </span>

            <form onSubmit={handleExperimentSubmit} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInputPredictedType('DESTRUCTIVE')}
                    className={`px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                      inputPredictedType === 'DESTRUCTIVE' ? 'bg-purple-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    DESTRUCTIVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputPredictedType('CONSTRUCTIVE')}
                    className={`px-3 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                      inputPredictedType === 'CONSTRUCTIVE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    CONSTRUCTIVE
                  </button>
                </div>

                <input
                  type="number"
                  value={inputPredictedDb}
                  onChange={(e) => setInputPredictedDb(e.target.value)}
                  placeholder="Predicted dB"
                  className="w-28 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-sm focus:border-cyan-400 focus:outline-none"
                />

                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  RUN EXPERIMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Scientific Post-Solve Discovery Explanation Card */}
      {interferenceState.targetMet && (
        <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500/50 space-y-3 font-mono shadow-2xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>YOU CREATED DESTRUCTIVE INTERFERENCE!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your two wave sources arrived at the target microphone with a total phase difference close to <strong>180°</strong>.
            Because their amplitudes were matched, the crests of Speaker A coincided with the troughs of Speaker B, resulting in near-total acoustic cancellation (reduced from 92 dB to {interferenceState.measuredDb} dB)!
          </p>
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
      {interferenceState.isComplete && (
        <button
          type="button"
          onClick={onCompleteInterference}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM PUZZLE SOLVED (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
