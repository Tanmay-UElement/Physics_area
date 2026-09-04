'use client';

import React, { useState } from 'react';
import { CircuitState, CircuitType, VoltSeriesParallelRoundData } from '@/lib/physics/voltSeriesParallel';
import { Power, ToggleLeft, ToggleRight, Lightbulb, Zap, HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface VoltSeriesParallelSolvePanelProps {
  round: VoltSeriesParallelRoundData;
  circuitState: CircuitState;
  theme: 'dark' | 'light';
  onCircuitTypeChange: (type: CircuitType) => void;
  onTogglePower: () => void;
  onToggleSwitch: () => void;
  onToggleBulb1: () => void;
  onResetCircuit: () => void;
  onCompleteDesign: () => void;
}

export const VoltSeriesParallelSolvePanel: React.FC<VoltSeriesParallelSolvePanelProps> = ({
  round,
  circuitState,
  theme,
  onCircuitTypeChange,
  onTogglePower,
  onToggleSwitch,
  onToggleBulb1,
  onResetCircuit,
  onCompleteDesign,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const isLight = theme === 'light';

  const hints = [
    'How many independent conductive paths do you need for Room A and Room B?',
    'What happens in a Series circuit when Bulb 1 is removed from its single shared path?',
    'A Parallel circuit creates multiple independent branches so one branch remains active if another is broken!',
  ];

  // Requirements Verification
  const req1BothLight = circuitState.bulb1Lit && circuitState.bulb2Lit;
  const req2Independent = circuitState.circuitType === 'parallel';
  const req3SwitchControls = circuitState.isSwitchClosed;

  const isFullySolved = req1BothLight && req2Independent && req3SwitchControls;

  return (
    <div className="w-full space-y-6">
      {/* 1. Building Lighting System Challenge Header */}
      <div className={`p-6 rounded-2xl border shadow-xl space-y-5 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div className="space-y-1 border-b border-slate-800/80 pb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
            GAME 6 • ELECTRICAL ENGINEERING LAB
          </span>
          <h2 className="text-2xl font-black">Building Lighting System</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Design the electrical circuit to power Room A and Room B according to real-world safety requirements.
          </p>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-300">1. Both bulbs illuminate simultaneously</span>
            {req1BothLight ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-300">2. Independent branch operation (Removing 1 bulb leaves other ON)</span>
            {req2Independent ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-300">3. One master switch controls entire system</span>
            {req3SwitchControls ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
          </div>
        </div>

        {/* Wiring Topology Selection Controls */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            WORKBENCH WIRING ARRANGEMENT
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onCircuitTypeChange('series')}
              className={`py-3 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                circuitState.circuitType === 'series'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>BUILD SERIES</span>
            </button>

            <button
              type="button"
              onClick={() => onCircuitTypeChange('parallel')}
              className={`py-3 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                circuitState.circuitType === 'parallel'
                  ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>BUILD PARALLEL</span>
            </button>
          </div>
        </div>

        {/* Master Power & Switch Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onTogglePower}
            className={`py-3 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border ${
              circuitState.isPowerOn
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{circuitState.isPowerOn ? 'POWER ON' : 'POWER OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSwitch}
            className={`py-3 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border ${
              circuitState.isSwitchClosed
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {circuitState.isSwitchClosed ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            <span>{circuitState.isSwitchClosed ? 'SWITCH CLOSED' : 'SWITCH OPEN'}</span>
          </button>
        </div>

        {/* KEY TEST INTERACTION: REMOVE BULB 1 (ROOM A) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
            KEY TEST INTERACTION (EXPERIMENT)
          </span>
          <button
            type="button"
            onClick={onToggleBulb1}
            className={`w-full py-3.5 px-4 rounded-xl border font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${
              circuitState.isBulb1Installed
                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>{circuitState.isBulb1Installed ? 'REMOVE BULB 1 (ROOM A)' : 'REINSTALL BULB 1'}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Physics & Multimeter Reading Grid */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
          LIVE PHYSICS METERS
        </span>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] font-mono text-slate-400 block">VOLTAGE</span>
            <span className="text-sm font-mono font-bold text-sky-400">{circuitState.voltage.toFixed(1)} V</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] font-mono text-slate-400 block">CURRENT</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{circuitState.current.toFixed(2)} A</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] font-mono text-slate-400 block">REQ</span>
            <span className="text-sm font-mono font-bold text-amber-400">{circuitState.totalResistance.toFixed(1)} Ω</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[9px] font-mono text-slate-400 block">POWER</span>
            <span className="text-sm font-mono font-bold text-purple-400">{circuitState.power.toFixed(2)} W</span>
          </div>
        </div>
      </div>

      {/* 3. Series vs. Parallel Live Comparison Table */}
      <div className={`p-5 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
          SERIES VS PARALLEL REFERENCE TABLE
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2">Property</th>
                <th className="py-1.5 px-2 text-amber-400">Series</th>
                <th className="py-1.5 px-2 text-purple-400">Parallel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2 px-2 text-slate-400">Current path</td>
                <td className="py-2 px-2">One single route</td>
                <td className="py-2 px-2 font-bold text-purple-300">Multiple branches</td>
              </tr>
              <tr>
                <td className="py-2 px-2 text-slate-400">Voltage drop</td>
                <td className="py-2 px-2">Divides (V₁ + V₂ = V_total)</td>
                <td className="py-2 px-2 font-bold text-purple-300">Same across all branches (9V)</td>
              </tr>
              <tr>
                <td className="py-2 px-2 text-slate-400">One bulb removed</td>
                <td className="py-2 px-2 text-red-400">Entire path breaks (OFF)</td>
                <td className="py-2 px-2 font-bold text-emerald-400">Other branch remains ON!</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Progressive Hint System & Submit Button */}
      <div className="space-y-3">
        {hintLevel < hints.length && (
          <button
            type="button"
            onClick={() => setHintLevel((prev) => Math.min(hints.length, prev + 1))}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-purple-300 text-xs font-mono border border-purple-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span>NEED A HINT? (HINT {hintLevel + 1} OF {hints.length})</span>
          </button>
        )}

        {hintLevel > 0 && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs font-mono space-y-1">
            {hints.slice(0, hintLevel).map((h, i) => (
              <p key={i}>💡 Hint {i + 1}: {h}</p>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onCompleteDesign}
          disabled={!isFullySolved}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>CONFIRM & SUBMIT CIRCUIT SOLUTION (+500 XP)</span>
        </button>
      </div>
    </div>
  );
};
