'use client';

import React, { useState } from 'react';
import { GridState, PowerLoadFacility, VoltPowerGridRoundData } from '@/lib/physics/voltPowerGrid';
import { Zap, ShieldAlert, Activity, CheckCircle2, HelpCircle, AlertCircle, RefreshCw, Flame, ArrowRight } from 'lucide-react';

interface VoltPowerGridSolvePanelProps {
  round: VoltPowerGridRoundData;
  gridState: GridState;
  facilities: PowerLoadFacility[];
  theme: 'dark' | 'light';
  onVoltageChange: (v: number) => void;
  onFacilityToggle: (id: string) => void;
  onToggleSpike: () => void;
  onResetGrid: () => void;
  onCompleteBalancing: () => void;
}

export const VoltPowerGridSolvePanel: React.FC<VoltPowerGridSolvePanelProps> = ({
  round,
  gridState,
  facilities,
  theme,
  onVoltageChange,
  onFacilityToggle,
  onToggleSpike,
  onResetGrid,
  onCompleteBalancing,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [predictionAnswer, setPredictionAnswer] = useState<boolean | null>(null);

  const isLight = theme === 'light';

  const hints = [
    'Remember the Power Law: Electrical Power P = Voltage V × Current I.',
    'If total load exceeds 5,000W, you must disconnect non-critical facilities like the EV Charger or Street Lights.',
    'Always ensure the Hospital (1,500W) remains ON to protect life support systems!',
  ];

  // Requirements Verification
  const isHospitalProtected = gridState.hospitalOnline;
  const isNotOverloaded = !gridState.isOverloaded;
  const isOptimalLoad = gridState.loadPercentage >= 70 && gridState.loadPercentage <= 95;

  const isFullyBalanced = isHospitalProtected && isNotOverloaded && isOptimalLoad;

  return (
    <div className="w-full space-y-6">
      {/* 1. Grid Balancing Header & Challenge */}
      <div className={`p-6 rounded-2xl border shadow-xl space-y-5 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div className="space-y-1 border-b border-slate-800/80 pb-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
            GAME 7 • POWER LAW (P = VI)
          </span>
          <h2 className="text-2xl font-black">Power Grid Balancer</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage power distribution to critical facilities without exceeding the grid's 5,000W capacity!
          </p>
        </div>

        {/* Operating Requirements */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-300">1. Hospital Life Support ON (Critical Load)</span>
            {isHospitalProtected ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-300">2. Grid Total Power ≤ 5,000 W (No Overload)</span>
            {isNotOverloaded ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-300">3. Target Load Efficiency: 70% – 95%</span>
            {isOptimalLoad ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
          </div>
        </div>

        {/* Grid Voltage Control Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            GRID DISTRIBUTION VOLTAGE (V)
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[110, 220, 230, 240].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onVoltageChange(v)}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 border ${
                  gridState.voltage === v
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {v} V
              </button>
            ))}
          </div>
        </div>

        {/* Facility Load Toggle Switches */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
            LOAD MANAGEMENT SWITCHES
          </span>
          <div className="space-y-2">
            {facilities.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{f.icon}</span>
                  <div>
                    <span className="font-bold text-slate-200">{f.name}</span>
                    <span className="text-[10px] text-slate-400 block">{f.powerWatts} W • {f.priority}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onFacilityToggle(f.id)}
                  className={`py-1.5 px-3 rounded-lg font-bold text-[11px] uppercase transition-all active:scale-95 border ${
                    f.isOn
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {f.isOn ? 'POWERED ON' : 'POWER OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Emergency Event: Evening Demand Spike */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
            DYNAMIC EMERGENCY SIMULATION
          </span>
          <button
            type="button"
            onClick={onToggleSpike}
            className={`w-full py-3 px-4 rounded-xl border font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 ${
              gridState.spikeActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 border-slate-800 text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{gridState.spikeActive ? 'EVENING DEMAND SPIKE ACTIVE (+900W)' : 'SIMULATE EVENING DEMAND SPIKE (+900W)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Power Dashboard & P = VI Formula Card */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
          POWER LAW CALCULATION (P = V × I)
        </span>

        {/* Dynamic Formula Display */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono space-y-1">
          <div className="text-xs text-slate-400">Power Law Relationship:</div>
          <div className="text-base font-bold text-purple-300">
            {gridState.voltage} V × {gridState.totalCurrentAmps} A = <span className="text-emerald-400">{gridState.totalPowerWatts} W</span>
          </div>
        </div>

        {/* Grid Load Bar Gauge */}
        <div className="space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">GRID LOAD CAPACITY</span>
            <span className={`font-bold ${gridState.isOverloaded ? 'text-red-400' : 'text-emerald-400'}`}>
              {gridState.totalPowerWatts} / {gridState.gridCapacityWatts} W ({gridState.loadPercentage}%)
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                gridState.isOverloaded
                  ? 'bg-red-500'
                  : gridState.loadPercentage >= 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, gridState.loadPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Progressive Hint System & Submit Button */}
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
          onClick={onCompleteBalancing}
          disabled={!isFullyBalanced}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>CONFIRM & SUBMIT POWER SOLUTION (+500 XP)</span>
        </button>
      </div>
    </div>
  );
};
