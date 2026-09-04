'use client';

import React, { useState } from 'react';
import { DopplerState, WaveDopplerRoundData } from '@/lib/physics/waveDoppler';
import { Radio, Play, RotateCcw, HelpCircle, CheckCircle2, Zap, Gauge, Volume2, TrendingUp, Compass, Award, Activity } from 'lucide-react';

interface WaveDopplerSolvePanelProps {
  round: WaveDopplerRoundData;
  dopplerState: DopplerState;
  theme: 'dark' | 'light';
  onPlayerSpeedChange: (speed: number) => void;
  onSourceSpeedChange: (speed: number) => void;
  onBaseFreqChange: (freq: number) => void;
  onPredictFrequency: (predFreq: number) => void;
  onResetSimulation: () => void;
  onCompleteChase: () => void;
}

export const WaveDopplerSolvePanel: React.FC<WaveDopplerSolvePanelProps> = ({
  round,
  dopplerState,
  theme,
  onPlayerSpeedChange,
  onSourceSpeedChange,
  onBaseFreqChange,
  onPredictFrequency,
  onResetSimulation,
  onCompleteChase,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputPredictionHz, setInputPredictionHz] = useState<string>('765');

  const isLight = theme === 'light';

  const hints = [
    'When the sound source and listener move TOWARD each other, observed frequency increases: f\' = f(v + v_o)/(v - v_s).',
    'When they move AWAY from each other, observed frequency decreases: f\' = f(v - v_o)/(v + v_s).',
    'Speed of sound in air (v) is 343 m/s. Substitute v_s, v_o, and f into the Doppler equation!',
    'Try accelerating your car to see how higher relative velocity causes a greater frequency shift!',
  ];

  const handlePredictSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputPredictionHz);
    if (!isNaN(val)) {
      onPredictFrequency(val);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Concept Challenge */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
            WAVE CLASS • GAME 2
          </span>
          <h1 className="text-2xl font-black tracking-tight">DOPPLER CHASE</h1>
          <p className="text-xs text-slate-400 font-mono">Locate · Chase · Observe · Measure · Predict</p>
        </div>

        <div className="flex items-center gap-2">
          {hintLevel < hints.length && (
            <button
              type="button"
              onClick={() => setHintLevel((prev) => prev + 1)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 hover:bg-slate-800"
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

      {/* 2. Main Controls & Speedometer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Observer & Siren Speedometers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Speedometer Card */}
          <div className={`p-6 rounded-3xl border space-y-5 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
              OBSERVER SPEEDOMETER (vₒ)
            </span>

            <div className="flex items-center justify-around py-2">
              {/* Observer Speedometer Gauge */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-sky-500 flex items-center justify-center font-mono font-black text-xl text-sky-400 shadow-lg shadow-sky-500/20">
                  {dopplerState.playerSpeedMps}
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">m/s</span>
              </div>

              {/* Siren Speed Gauge */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center font-mono font-black text-xl text-red-400 shadow-lg shadow-red-500/20">
                  {dopplerState.sourceSpeedMps}
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">Siren m/s</span>
              </div>

              {/* Relative Speed Gauge */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center font-mono font-black text-xl text-amber-400 shadow-lg shadow-amber-500/20">
                  {dopplerState.relRadialSpeedMps}
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">Rel Radial</span>
              </div>
            </div>

            {/* Accel & Brake Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPlayerSpeedChange(Math.max(0, dopplerState.playerSpeedMps - 5))}
                className="flex-1 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 active:scale-95 transition-all"
              >
                BRAKE (-5)
              </button>
              <button
                type="button"
                onClick={() => onPlayerSpeedChange(Math.min(30, dopplerState.playerSpeedMps + 5))}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              >
                ACCEL (+5)
              </button>
            </div>
          </div>

          {/* Siren Speed & Pitch Sliders */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Ambulance Speed (vₛ):</span>
                <span className="text-red-400 font-bold">{dopplerState.sourceSpeedMps} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={dopplerState.sourceSpeedMps}
                onChange={(e) => onSourceSpeedChange(Number(e.target.value))}
                className="w-full accent-red-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Base Siren Pitch (f):</span>
                <span className="text-purple-400 font-bold">{dopplerState.baseFrequencyHz} Hz</span>
              </div>
              <input
                type="range"
                min="400"
                max="1000"
                step="10"
                value={dopplerState.baseFrequencyHz}
                onChange={(e) => onBaseFreqChange(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry, Spectrum Analyzer & Prediction */}
        <div className="lg:col-span-7 space-y-6">
          {/* Audio Spectrum Analyzer Bar Chart */}
          <div className={`p-6 rounded-3xl border space-y-3 shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              FREQUENCY SPECTRUM ANALYZER
            </span>

            {/* Bar Chart Bins (500Hz ... 900Hz) */}
            <div className="flex items-end justify-between h-24 px-4 pt-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[10px]">
              {[500, 600, 700, 800, 900].map((binHz) => {
                const diff = Math.abs(dopplerState.observedFreqHz - binHz);
                const heightPct = Math.max(15, Math.min(100, 100 - diff * 0.8));
                const isPeak = diff <= 50;

                return (
                  <div key={binHz} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 rounded-t-lg transition-all duration-300 ${
                        isPeak ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-md shadow-emerald-500/30' : 'bg-slate-800'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className={isPeak ? 'text-cyan-400 font-bold' : 'text-slate-500'}>{binHz} Hz</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prediction Box */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              PREDICT FREQUENCY AT MEASUREMENT GATE (f')
            </span>

            <form onSubmit={handlePredictSubmit} className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={inputPredictionHz}
                  onChange={(e) => setInputPredictionHz(e.target.value)}
                  placeholder="Enter Hz"
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-base focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                >
                  LOCK PREDICTION
                </button>
              </div>
            </form>

            {dopplerState.predictionLocked && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Your Prediction:</span>
                  <span className="font-bold text-cyan-400">{dopplerState.predictedFreqHz} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actual Observed Frequency:</span>
                  <span className="font-bold text-emerald-400">{dopplerState.observedFreqHz} Hz</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-2">
                  <span className="text-slate-400">Prediction Error:</span>
                  <span className={`font-bold ${dopplerState.isComplete ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dopplerState.predictionErrorHz} Hz ({dopplerState.predictionAccuracyPct}% Accuracy)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Real-World Applications Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className={`p-4 rounded-2xl border space-y-1.5 font-mono text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="font-bold text-red-400 flex items-center gap-1.5">
            <span>🚑 Emergency Sirens</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Approaching sirens compress sound waves, causing a higher pitch before dropping as they recede.
          </p>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1.5 font-mono text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="font-bold text-sky-400 flex items-center gap-1.5">
            <span>🚓 Speed Radar</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Police radar bounces microwave frequencies off moving cars to calculate exact vehicle velocity.
          </p>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1.5 font-mono text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
            <span>🌧 Weather Radar</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Doppler radar tracks raindrop motion to detect rotation and predict tornado formation.
          </p>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1.5 font-mono text-xs ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="font-bold text-purple-400 flex items-center gap-1.5">
            <span>🌌 Astronomy</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Redshift and blueshift of light spectrum lines prove the expanding universe motion.
          </p>
        </div>
      </div>

      {/* Hints Display */}
      {hintLevel > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs font-mono space-y-1">
          {hints.slice(0, hintLevel).map((h, i) => (
            <p key={i}>💡 Hint {i + 1}: {h}</p>
          ))}
        </div>
      )}

      {/* Complete Button */}
      {dopplerState.isComplete && (
        <button
          type="button"
          onClick={onCompleteChase}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM DOPPLER MEASUREMENT (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
