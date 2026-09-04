'use client';

import React, { useState, useEffect } from 'react';
import { RoundData } from '@/lib/physics/types';
import { Play, HelpCircle, Calculator, ChevronRight, RefreshCw, Zap } from 'lucide-react';

interface SolvePanelProps {
  round: RoundData;
  isSimulating: boolean;
  onLaunch: (velocity: number) => void;
}

export const SolvePanel: React.FC<SolvePanelProps> = ({
  round,
  isSimulating,
  onLaunch,
}) => {
  const [velocity, setVelocity] = useState<number>(20.0);
  const [showFormulaHelper, setShowFormulaHelper] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Default velocity initial guess based on height & distance range
  useEffect(() => {
    // Set a reasonable initial slider value near 15-25 m/s
    setVelocity(20.0);
  }, [round.id]);

  const handleLaunch = () => {
    if (isSimulating) return;
    onLaunch(velocity);
  };

  // Step-by-step formula calculations for helper card
  const calculatedTime = Math.sqrt((2 * round.height) / round.gravity).toFixed(2);
  const calculatedExactV = (round.distance / Number(calculatedTime)).toFixed(2);

  return (
    <div className="w-full h-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between text-slate-100">
      {/* Panel Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
                Round {round.roundNumber} of {round.totalRounds}
              </span>
              <h2 className="text-lg font-bold text-slate-50">Solve Launch Parameters</h2>
            </div>
          </div>

          <button
            onClick={() => setShowFormulaHelper(!showFormulaHelper)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              showFormulaHelper
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Physics Formula Sheet"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Formula</span>
          </button>
        </div>

        {/* Challenge Objective Card */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="text-xs font-medium text-slate-400">MISSION OBJECTIVE</div>
          <p className="text-sm text-slate-200 leading-relaxed">
            Determine horizontal launch speed <span className="font-mono text-cyan-400 font-semibold">v</span> so your avatar lands precisely on the ground target <span className="font-mono text-emerald-400 font-semibold">{round.distance} m</span> away.
          </p>
        </div>

        {/* Collapsible Step-by-Step Formula Card */}
        {showFormulaHelper && (
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
              <span>PHYSICS FORMULA SHEET</span>
              <span className="font-mono text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded">Kinematics</span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300 border-t border-cyan-500/20 pt-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">1. Vertical Flight Time (t):</span>
                <span className="text-cyan-300">t = √(2h / g)</span>
              </div>
              <div className="pl-4 text-[11px] text-slate-400">
                t = √(2 × {round.height} / {round.gravity}) = <span className="text-amber-400 font-bold">{calculatedTime} s</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-slate-800/60 pt-2">
                <span className="text-slate-400">2. Required Horizontal Velocity (v):</span>
                <span className="text-emerald-400 font-bold">v = d / t</span>
              </div>
              <div className="pl-4 text-[11px] text-slate-400">
                v = {round.distance} / {calculatedTime} = <span className="text-emerald-300 font-bold">{calculatedExactV} m/s</span>
              </div>
            </div>
          </div>
        )}

        {/* Input Parameters Form */}
        <div className="space-y-5 pt-2">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Horizontal Launch Velocity (v)</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="150"
                  value={velocity}
                  onChange={(e) => setVelocity(Math.max(0.1, Number(e.target.value)))}
                  disabled={isSimulating}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-right font-mono text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs font-mono text-slate-400">m/s</span>
              </div>
            </div>

            {/* Slider Control */}
            <input
              type="range"
              min="5"
              max="100"
              step="0.1"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              disabled={isSimulating}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>5.0 m/s</span>
              <span>50.0 m/s</span>
              <span>100.0 m/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-3 pt-6 border-t border-slate-800">
        <button
          onClick={handleLaunch}
          disabled={isSimulating}
          className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2.5 ${
            isSimulating
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.99] font-black uppercase'
          }`}
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>SIMULATING FLIGHT...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950" />
              <span>FIRE LAUNCHER!</span>
            </>
          )}
        </button>

        {/* Quick Hint Accordion */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need a quick hint?</span>
          </button>
          <span className="font-mono text-[11px] text-emerald-400/90">Tolerance ±5% for 100 XP</span>
        </div>

        {showHint && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
            <span className="text-amber-400 font-semibold">Tip:</span> Solve for flight time <span className="font-mono text-cyan-300">t</span> first using height <span className="font-mono text-cyan-300">h = {round.height}m</span> and <span className="font-mono text-cyan-300">g = 9.8m/s²</span>. Then calculate <span className="font-mono text-emerald-300">v = {round.distance} / t</span>!
          </div>
        )}
      </div>
    </div>
  );
};
