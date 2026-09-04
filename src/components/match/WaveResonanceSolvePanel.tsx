'use client';

import React, { useState, useEffect } from 'react';
import { ResonanceState, WaveResonanceRoundData } from '@/lib/physics/waveResonance';
import { Radio, Play, RotateCcw, HelpCircle, CheckCircle2, Zap, Gauge, Volume2, TrendingUp, Compass, Activity, Sliders, ShieldCheck, Pause, Music, Flame } from 'lucide-react';

interface WaveResonanceSolvePanelProps {
  round: WaveResonanceRoundData;
  resonanceState: ResonanceState;
  theme: 'dark' | 'light';
  onFrequencyChange: (freqHz: number) => void;
  onLengthChange: (lengthM: number) => void;
  onTensionChange: (tensionN: number) => void;
  onSelectSystemMode: (mode: 'STRING' | 'AIR_COLUMN') => void;
  onSelectTubeBoundary: (boundary: 'CLOSED_ONE_END' | 'OPEN_BOTH_ENDS') => void;
  onSelectPuzzleType: (type: 'FIND_FUNDAMENTAL' | 'CREATE_3RD_HARMONIC' | 'TUNE_TO_440HZ' | 'UNKNOWN_TENSION') => void;
  onToggleSweep: () => void;
  onRunExperiment: (predHz: number) => void;
  onResetSimulation: () => void;
  onCompleteResonance: () => void;
}

export const WaveResonanceSolvePanel: React.FC<WaveResonanceSolvePanelProps> = ({
  round,
  resonanceState,
  theme,
  onFrequencyChange,
  onLengthChange,
  onTensionChange,
  onSelectSystemMode,
  onSelectTubeBoundary,
  onSelectPuzzleType,
  onToggleSweep,
  onRunExperiment,
  onResetSimulation,
  onCompleteResonance,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputPredictedHz, setInputPredictedHz] = useState<string>('150');

  const isLight = theme === 'light';

  const hints = [
    'For a string fixed at both ends, the resonant frequencies are integer multiples of the fundamental: fn = n * f1.',
    'Fundamental frequency f1 = v / (2L) where wave speed v = sqrt(T / mu).',
    'To create the 3rd harmonic (3 loops, 4 nodes), tune driver frequency to f3 = 3 * f1!',
    'Increasing tension T increases wave speed v and raises all natural resonant frequencies.',
  ];

  const handleExperimentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputPredictedHz);
    if (!isNaN(val)) {
      onRunExperiment(val);
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
            WAVE CLASS • GAME 4
          </span>
          <h1 className="text-2xl font-black tracking-tight">RESONANCE STUDIO</h1>
          <p className="text-xs text-slate-400 font-mono">Observe · Hypothesize · Configure · Drive · Detect Resonance · Solve</p>
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
            title="Reset Studio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Apparatus & Objective Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onSelectPuzzleType('CREATE_3RD_HARMONIC')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            resonanceState.puzzleType === 'CREATE_3RD_HARMONIC'
              ? 'bg-slate-950 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🎵 CREATE 3RD HARMONIC</div>
          <p className="text-[10px] opacity-70 mt-1">Tune frequency to create a 3-loop standing wave mode (n = 3).</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPuzzleType('FIND_FUNDAMENTAL')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            resonanceState.puzzleType === 'FIND_FUNDAMENTAL'
              ? 'bg-slate-950 border-sky-500 text-sky-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">⚡ FIND FUNDAMENTAL f₁</div>
          <p className="text-[10px] opacity-70 mt-1">Sweep driver frequency to locate lowest resonance peak.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPuzzleType('TUNE_TO_440HZ')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            resonanceState.puzzleType === 'TUNE_TO_440HZ'
              ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🎻 TUNE TO 440 Hz (CONCERT A)</div>
          <p className="text-[10px] opacity-70 mt-1">Adjust string tension T or length L so f₁ = 440 Hz.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectSystemMode(resonanceState.mode === 'STRING' ? 'AIR_COLUMN' : 'STRING')}
          className="p-4 rounded-2xl border bg-slate-950 border-slate-700 text-amber-300 font-mono text-xs text-left hover:bg-slate-900"
        >
          <div className="font-bold">🎷 SYSTEM: {resonanceState.mode}</div>
          <p className="text-[10px] opacity-70 mt-1">Switch between Vibrating String and Acoustic Air Column Tube.</p>
        </button>
      </div>

      {/* 2. Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Controls & Sweeper */}
        <div className="lg:col-span-5 space-y-6">
          {/* Driver Frequency Knob & Automated Sweeper */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                DRIVER GENERATOR FREQUENCY (f)
              </span>
              <span className="text-sm font-mono font-black text-sky-400">{resonanceState.driverFrequencyHz} Hz</span>
            </div>

            <input
              type="range"
              min="20"
              max="500"
              step="1"
              value={resonanceState.driverFrequencyHz}
              onChange={(e) => onFrequencyChange(Number(e.target.value))}
              className="w-full accent-sky-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleSweep}
                className={`flex-1 py-3 px-4 rounded-xl border font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  resonanceState.isSweeping
                    ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {resonanceState.isSweeping ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4" />}
                <span>{resonanceState.isSweeping ? 'SWEEPING FREQUENCIES...' : 'START AUTO FREQUENCY SWEEP'}</span>
              </button>
            </div>
          </div>

          {/* Physical Parameters: Length & Tension */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">
                  {resonanceState.mode === 'STRING' ? 'String Length (L):' : 'Air Column Length (L):'}
                </span>
                <span className="text-emerald-400 font-bold">
                  {resonanceState.mode === 'STRING' ? resonanceState.stringLengthM : resonanceState.tubeLengthM} m
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={resonanceState.mode === 'STRING' ? resonanceState.stringLengthM : resonanceState.tubeLengthM}
                onChange={(e) => onLengthChange(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {resonanceState.mode === 'STRING' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">String Tension (T):</span>
                  <span className="text-purple-400 font-bold">{resonanceState.tensionN} N</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="2"
                  value={resonanceState.tensionN}
                  onChange={(e) => onTensionChange(Number(e.target.value))}
                  className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Amplitude vs Frequency Resonance Graph & Predict Workflow */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Amplitude vs. Frequency Resonance Graph */}
          <div className={`p-6 rounded-3xl border space-y-3 shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                LIVE RESONANCE GRAPH (AMPLITUDE vs. FREQUENCY)
              </span>
              <div className="text-xs font-mono font-bold text-emerald-400">
                PEAKS: {resonanceState.allowedFrequenciesHz.slice(0, 4).join('Hz, ')}Hz
              </div>
            </div>

            <div className="relative h-32 bg-slate-950 rounded-2xl border border-slate-800 p-2 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <line x1="0" y1="90" x2="300" y2="90" stroke="#334155" strokeWidth="1" />

                {/* Resonance Spectrum Peaks */}
                {resonanceState.allowedFrequenciesHz.map((fn, idx) => {
                  const px = (fn / 500) * 300;
                  const isCurrent = Math.abs(resonanceState.driverFrequencyHz - fn) <= 5;
                  return (
                    <g key={idx} onClick={() => onFrequencyChange(fn)} className="cursor-pointer">
                      <line x1={px} y1="90" x2={px} y2="15" stroke={isCurrent ? '#34d399' : '#38bdf8'} strokeWidth="2" strokeDasharray="3 3" />
                      <circle cx={px} cy="15" r="4" fill={isCurrent ? '#34d399' : '#38bdf8'} />
                    </g>
                  );
                })}

                {/* Active Frequency Marker Pin */}
                <line
                  x1={(resonanceState.driverFrequencyHz / 500) * 300}
                  y1="0"
                  x2={(resonanceState.driverFrequencyHz / 500) * 300}
                  y2="90"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          {/* Mode Scanner & Predict Workflow */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                MODE SCANNER & PREDICT WORKFLOW
              </span>
              <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                resonanceState.harmonicLock
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                {resonanceState.harmonicLock ? `MODE LOCKED: n=${resonanceState.activeHarmonicMode}` : 'NO MODE LOCK'}
              </div>
            </div>

            <form onSubmit={handleExperimentSubmit} className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                value={inputPredictedHz}
                onChange={(e) => setInputPredictedHz(e.target.value)}
                placeholder="Predicted Hz"
                className="w-32 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-sm focus:border-cyan-400 focus:outline-none"
              />

              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                RUN RESONANCE TEST
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Post-Solve Discovery Explanation Card */}
      {resonanceState.targetMet && (
        <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500/50 space-y-3 font-mono shadow-2xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>HARMONIC RESONANCE LOCKED!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You successfully set the driver frequency to <strong>{resonanceState.driverFrequencyHz} Hz</strong>, matching the <strong>{resonanceState.targetHarmonic}rd Harmonic</strong> (f₃ = 3 · f₁).
            Standing waves formed as incident and reflected wave components superposed constructively at antinodes!
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
      {resonanceState.isComplete && (
        <button
          type="button"
          onClick={onCompleteResonance}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM RESONANCE MATCHED (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
