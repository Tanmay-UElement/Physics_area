'use client';

import React, { useState } from 'react';
import { VoltGeneratorRoundData, calculateInducedEMF } from '@/lib/physics/voltGeneratorCrank';
import { Play, RotateCw, Square, RefreshCw, Calculator, HelpCircle, CheckCircle2 } from 'lucide-react';

interface VoltGeneratorSolvePanelProps {
  round: VoltGeneratorRoundData;
  userRPM: number;
  isSimulating: boolean;
  isCranking: boolean;
  theme: 'dark' | 'light';
  onRPMChange: (rpm: number) => void;
  onToggleCrank: (cranking: boolean) => void;
  onReset: () => void;
  onLaunch: (rpm: number) => void;
}

export const VoltGeneratorSolvePanel: React.FC<VoltGeneratorSolvePanelProps> = ({
  round,
  userRPM,
  isSimulating,
  isCranking,
  theme,
  onRPMChange,
  onToggleCrank,
  onReset,
  onLaunch,
}) => {
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('286');

  const isLight = theme === 'light';

  // Live telemetry calculations based on userRPM
  const currentEMF = isCranking || isSimulating ? calculateInducedEMF(round.numberOfTurns, round.magneticFieldB, round.coilAreaA, userRPM) : 0;
  const currentAmps = Number((currentEMF / (round.circuitResistance || 1)).toFixed(2));
  const brightnessPercent = Math.min(100, Math.round((currentEMF / round.targetVoltage) * 100));

  const handleLaunchClick = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputVal);
    if (!isNaN(num)) {
      onRPMChange(num);
      onLaunch(num);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Main Generator Controls & Telemetry Block */}
      <div className={`p-6 rounded-2xl border shadow-xl space-y-6 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        {/* Header & Title */}
        <div className="space-y-1 border-b border-slate-800/80 pb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            ROUND {round.roundNumber} OF {round.totalRounds} • FARADAY'S LAW
          </span>
          <h2 className="text-2xl font-black">Generator Crank</h2>
          <p className="text-xs text-slate-400">
            Physically operate the crank and discover Faraday's Law through cause → effect.
          </p>
        </div>

        {/* Crank Action Controls Bar (Matching Screenshot) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleCrank(!isCranking)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
              isCranking
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/25'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${isCranking ? 'animate-spin' : ''}`} />
            <span>{isCranking ? 'Cranking...' : 'Turn Crank'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleCrank(false)}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-slate-300" />
            <span>Stop Generator</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Live Telemetry Meter Cards (Matching Screenshot) */}
        <div className="grid grid-cols-3 gap-3">
          {/* Crank Speed */}
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">CRANK SPEED</span>
            <div className="text-base font-mono font-black text-sky-400">
              {isCranking || isSimulating ? userRPM : 0} RPM
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (userRPM / 400) * 100)}%` }}
              />
            </div>
          </div>

          {/* Induced Current */}
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">INDUCED CURRENT</span>
            <div className="text-base font-mono font-black text-emerald-400">
              {currentAmps.toFixed(2)} A
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (currentAmps / 5) * 100)}%` }}
              />
            </div>
          </div>

          {/* Bulb Brightness */}
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">BULB BRIGHTNESS</span>
            <div className="text-base font-mono font-black text-amber-400">
              {brightnessPercent}%
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${brightnessPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Speed Adjustment Slider */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">ADJUST CRANK SPEED (RPM):</span>
            <span className="text-amber-400 font-bold">{userRPM} RPM</span>
          </div>
          <input
            type="range"
            min="60"
            max="500"
            step="1"
            value={userRPM}
            onChange={(e) => onRPMChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Form to submit RPM calculation */}
        <form onSubmit={handleLaunchClick} className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              TARGET VOLTAGE REQUIRED: <span className="text-amber-400 font-bold">{round.targetVoltage} V</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border font-mono font-bold text-sm outline-none transition-colors ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-900 focus:border-amber-500' : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">RPM</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSimulating}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>TEST GENERATOR OUTPUT</span>
          </button>
        </form>
      </div>

      {/* 2. Side Widgets (LIVE PHYSICS, CAUSE -> EFFECT, QUICK CHALLENGE) (Matching Screenshot) */}
      <div className="space-y-4">
        {/* LIVE PHYSICS Card */}
        <div className={`p-4 rounded-xl border space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
            LIVE PHYSICS
          </span>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono font-bold text-lg text-emerald-400">
            ε = - dΦ / dt
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Faraday's Law: a changing magnetic flux through the coil induces an electromotive force.
          </p>
        </div>

        {/* CAUSE - EFFECT Sequence Card */}
        <div className={`p-4 rounded-xl border space-y-2.5 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
            CAUSE → EFFECT
          </span>
          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">①</span>
              <span>Mechanical rotation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">②</span>
              <span>Magnet rotates</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">③</span>
              <span>Magnetic flux changes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">④</span>
              <span>Current is induced</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">⑤</span>
              <span>Bulb receives electrical energy</span>
            </div>
          </div>
        </div>

        {/* QUICK CHALLENGE Quiz Widget (Matching Screenshot) */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
              QUICK CHALLENGE
            </span>
          </div>

          <p className="text-xs font-bold text-slate-200">
            What happens when you turn the crank faster?
          </p>

          <div className="space-y-2">
            {round.quizOptions?.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedQuizOption(opt.id);
                  setQuizSubmitted(true);
                }}
                className={`w-full p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                  selectedQuizOption === opt.id
                    ? opt.isCorrect
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-red-500/20 border-red-500 text-red-400'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>

          {quizSubmitted && selectedQuizOption === 'a' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Correct! Higher RPM increases dΦ/dt → higher induced voltage!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
