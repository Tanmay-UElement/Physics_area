'use client';

import React, { useState } from 'react';
import { VectorTugState, Vector2D, cartesianToPolar, polarToCartesian } from '@/lib/physics/vectorTug';
import { Play, RotateCcw, HelpCircle, CheckCircle2, ShieldCheck, Compass, Move, Scale, Zap } from 'lucide-react';

interface VectorSolvePanelProps {
  vectorState: VectorTugState;
  theme: 'dark' | 'light';
  onForceVectorChange: (id: string, vec: Vector2D) => void;
  onMassChange: (massKg: number) => void;
  onSelectScenario: (scenario: 'TARGET_MATCH' | 'ZERO_RESULTANT' | 'MOVING_EQUILIBRIUM' | 'HORIZONTAL_ONLY') => void;
  onToggleAngleSnap: () => void;
  onStartSimulation: (predictedMagN: number, predictedAngleDeg: number) => void;
  onResetSimulation: () => void;
  onCompleteVectorTug: () => void;
}

export const VectorSolvePanel: React.FC<VectorSolvePanelProps> = ({
  vectorState,
  theme,
  onForceVectorChange,
  onMassChange,
  onSelectScenario,
  onToggleAngleSnap,
  onStartSimulation,
  onResetSimulation,
  onCompleteVectorTug,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [inputMagN, setInputMagN] = useState<string>('100.0');
  const [inputAngleDeg, setInputAngleDeg] = useState<string>('0.0');

  const isLight = theme === 'light';

  const hints = [
    'Vector addition: Sum horizontal components (Fx = ΣFi cos θi) and vertical components (Fy = ΣFi sin θi).',
    'Resultant force magnitude: |F_net| = √(Fx² + Fy²), direction: θ = atan2(Fy, Fx).',
    'Force Equilibrium (Newton\'s 1st Law): If ΣF = 0 N, acceleration a = 0 m/s², so velocity remains constant!',
    'Acceleration (Newton\'s 2nd Law): a = F_net / m. Increasing object mass decreases acceleration for the same force.',
  ];

  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const magVal = parseFloat(inputMagN);
    const angleVal = parseFloat(inputAngleDeg);
    if (!isNaN(magVal) && !isNaN(angleVal)) {
      onStartSimulation(magVal, angleVal);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Scenario Selector */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest block">
            KINETICS CLASS • GAME 3
          </span>
          <h1 className="text-2xl font-black tracking-tight">VECTOR TUG-OF-WAR</h1>
          <p className="text-xs text-slate-400 font-mono italic">“Control the forces. Predict the motion.”</p>
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
          onClick={() => onSelectScenario('TARGET_MATCH')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            vectorState.scenarioMode === 'TARGET_MATCH'
              ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🎯 TARGET MATCH</div>
          <p className="text-[10px] opacity-70 mt-1">Match target resultant vector (100N @ 0°).</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('ZERO_RESULTANT')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            vectorState.scenarioMode === 'ZERO_RESULTANT'
              ? 'bg-slate-950 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">⚖️ ZERO RESULTANT</div>
          <p className="text-[10px] opacity-70 mt-1">Make net force ΣF = 0 N (Stationary Equilibrium).</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('MOVING_EQUILIBRIUM')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            vectorState.scenarioMode === 'MOVING_EQUILIBRIUM'
              ? 'bg-slate-950 border-cyan-500 text-cyan-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">🚀 MOVING EQUILIBRIUM</div>
          <p className="text-[10px] opacity-70 mt-1">Keep constant velocity v = 5m/s (Newton's 1st Law).</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectScenario('HORIZONTAL_ONLY')}
          className={`p-4 rounded-2xl border font-mono text-xs text-left transition-all ${
            vectorState.scenarioMode === 'HORIZONTAL_ONLY'
              ? 'bg-slate-950 border-amber-500 text-amber-300 shadow-lg'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="font-bold">↔️ HORIZONTAL ONLY</div>
          <p className="text-[10px] opacity-70 mt-1">Cancel vertical net force Fy = 0 N.</p>
        </button>
      </div>

      {/* 2. Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Controls & Force Inspector */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
              PHYSICAL PARAMETERS & ANGLE SNAP
            </span>

            {/* Object Mass Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Robot Mass (m):</span>
                <span className="text-purple-400 font-bold">{vectorState.objectMassKg} kg</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="50.0"
                step="2.5"
                disabled={vectorState.isSimulating}
                value={vectorState.objectMassKg}
                onChange={(e) => onMassChange(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-950 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Angle Snap Toggle Button */}
            <button
              type="button"
              onClick={onToggleAngleSnap}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all ${
                vectorState.angleSnap15Deg
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {vectorState.angleSnap15Deg ? '📐 ANGLE SNAP: 15° INCREMENTS ON' : '🔄 ANGLE SNAP: FREE DRAG MODE'}
            </button>
          </div>

          {/* Live Technical Vector Telemetry HUD */}
          <div className={`p-6 rounded-3xl border space-y-3 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              TECHNICAL FORCE METER (ΣF = m × a)
            </span>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Sum Fx (Horizontal):</span>
                <span className="text-sky-400 font-bold">{vectorState.netFx} N</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Sum Fy (Vertical):</span>
                <span className="text-purple-400 font-bold">{vectorState.netFy} N</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-amber-400 font-bold">
                <span>Resultant |F_net|:</span>
                <span>{vectorState.netMagnitudeN} N @ {vectorState.netAngleDeg}°</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Acceleration (a):</span>
                <span>{vectorState.accelMagnitudeMps2} m/s²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Force Adjusters & Predict & Reveal Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Draggable Active Force Sliders */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              ACTIVE FORCE VECTORS
            </span>

            {vectorState.forces.map((f) => {
              const polar = cartesianToPolar(f.vector.x, f.vector.y);

              return (
                <div key={f.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: `#${f.colorHex.toString(16)}` }}>
                      {f.name}
                    </span>
                    <span className="text-slate-300">
                      {polar.magnitude} N @ {polar.angleDeg}°
                    </span>
                  </div>

                  {f.isDraggable && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Magnitude (N):</span>
                        <input
                          type="range"
                          min="0"
                          max="120"
                          step="2"
                          disabled={vectorState.isSimulating}
                          value={polar.magnitude}
                          onChange={(e) => {
                            const newMag = Number(e.target.value);
                            const newCart = polarToCartesian(newMag, polar.angleDeg);
                            onForceVectorChange(f.id, newCart);
                          }}
                          className="w-full h-1.5 accent-cyan-500 bg-slate-800 rounded cursor-pointer disabled:opacity-40"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">Angle (°):</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="5"
                          disabled={vectorState.isSimulating}
                          value={polar.angleDeg}
                          onChange={(e) => {
                            const newAngle = Number(e.target.value);
                            const newCart = polarToCartesian(polar.magnitude, newAngle);
                            onForceVectorChange(f.id, newCart);
                          }}
                          className="w-full h-1.5 accent-purple-500 bg-slate-800 rounded cursor-pointer disabled:opacity-40"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Predict Result & Run Experiment Form */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              PREDICT RESULTANT & RUN SIMULATION
            </span>

            <form onSubmit={handleRunSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400 block">PREDICTED MAGNITUDE (N):</label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={vectorState.isSimulating}
                    value={inputMagN}
                    onChange={(e) => setInputMagN(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-sm outline-none focus:border-purple-400 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400 block">PREDICTED ANGLE (°):</label>
                  <input
                    type="number"
                    step="1"
                    disabled={vectorState.isSimulating}
                    value={inputAngleDeg}
                    onChange={(e) => setInputAngleDeg(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold text-sm outline-none focus:border-purple-400 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={vectorState.isSimulating}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START VECTOR SIMULATION</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Post-Simulation Verification Card */}
      {vectorState.isSimulationComplete && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/50 space-y-4 font-mono shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>VECTOR MOTION REVEALED!</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              PHYSICS INSIGHT VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">YOUR PREDICTION:</span>
              <span className="text-amber-400 font-black text-lg">{vectorState.predictedMagN} N @ {vectorState.predictedAngleDeg}°</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 block">ACTUAL MEASURED RESULTANT:</span>
              <span className="text-emerald-400 font-black text-lg">{vectorState.netMagnitudeN} N @ {vectorState.netAngleDeg}°</span>
            </div>
          </div>

          {vectorState.physicsExplanation && (
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs">
              {vectorState.physicsExplanation}
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
      {vectorState.isComplete && (
        <button
          type="button"
          onClick={onCompleteVectorTug}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-emerald-500 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>CONFIRM VECTOR TARGET MATCHED (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
