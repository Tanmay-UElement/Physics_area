'use client';

import React, { useState } from 'react';
import { OPTICAL_MEDIA, OpticalMedium, RefractionState, ShotRecord, WaveRefractionRoundData } from '@/lib/physics/waveRefraction';
import { Target, Play, RotateCcw, HelpCircle, CheckCircle2, Flame, Gauge, Zap, Compass } from 'lucide-react';

interface WaveRefractionSolvePanelProps {
  round: WaveRefractionRoundData;
  refractionState: RefractionState;
  theme: 'dark' | 'light';
  onIncidentAngleChange: (angle: number) => void;
  onMedium1Change: (medium: OpticalMedium) => void;
  onMedium2Change: (medium: OpticalMedium) => void;
  onShoot: () => void;
  onResetLab: () => void;
  onCompleteAlignment: () => void;
}

export const WaveRefractionSolvePanel: React.FC<WaveRefractionSolvePanelProps> = ({
  round,
  refractionState,
  theme,
  onIncidentAngleChange,
  onMedium1Change,
  onMedium2Change,
  onShoot,
  onResetLab,
  onCompleteAlignment,
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);

  const isLight = theme === 'light';

  const hints = [
    'Always measure incident angle θ₁ and refracted angle θ₂ relative to the perpendicular NORMAL line, NOT the surface boundary!',
    'When light moves into a denser medium (higher n), it bends TOWARD the normal (θ₂ < θ₁).',
    'Snell\'s Law: n₁ × sin(θ₁) = n₂ × sin(θ₂). Rearrange to solve for θ₂ = arcsin[(n₁/n₂) × sin(θ₁)].',
    'To hit the detector center, test different incident angles and observe where the beam lands!',
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Mission Checklist */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
            WAVE CLASS • GAME 1
          </span>
          <h1 className="text-2xl font-black tracking-tight">REFRACTION LAB</h1>
          <p className="text-xs text-slate-400 font-mono">Aim · Shoot · Observe · Learn</p>
        </div>

        {/* Mission Checklist */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${refractionState.targetHit ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'}`}>
              {refractionState.targetHit && <CheckCircle2 className="w-3 h-3" />}
            </div>
            <span className={refractionState.targetHit ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              Hit the target
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(refractionState.lastAccuracyPct || 0) >= 80 ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'}`}>
              {(refractionState.lastAccuracyPct || 0) >= 80 && <CheckCircle2 className="w-3 h-3" />}
            </div>
            <span className={(refractionState.lastAccuracyPct || 0) >= 80 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              Keep accuracy &gt; 80%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <span className="text-emerald-400 font-bold">Explore materials</span>
          </div>
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
            onClick={onResetLab}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800"
            title="Reset Lab"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Workbench Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Laser Control & Medium Selector */}
        <div className="lg:col-span-5 space-y-6">
          {/* Laser Control Box */}
          <div className={`p-6 rounded-3xl border space-y-5 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider block">
              LASER CONTROL
            </span>

            <div className="space-y-1 text-xs font-mono">
              <div className="text-slate-400">Wavelength: <span className="text-slate-200 font-bold">650 nm (Red)</span></div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Incident Angle (θ₁):</span>
                <span className="text-cyan-400 text-lg font-bold">{refractionState.incidentAngleDeg}°</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="85"
              step="1"
              value={refractionState.incidentAngleDeg}
              onChange={(e) => onIncidentAngleChange(Number(e.target.value))}
              className="w-full accent-red-500 h-2.5 bg-slate-950 rounded-lg cursor-pointer"
            />

            {/* Large Glowing 🔴 SHOOT Button */}
            <button
              type="button"
              onClick={onShoot}
              disabled={refractionState.isCharging || refractionState.isShooting}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                refractionState.isCharging
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/25 animate-pulse'
                  : refractionState.isShooting
                  ? 'bg-red-600 text-slate-100 shadow-red-600/30'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-slate-100 shadow-red-500/30'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white animate-ping" />
              <span>
                {refractionState.isCharging
                  ? '⚡ CHARGING LASER...'
                  : refractionState.isShooting
                  ? '🔴 FIRING LASER BEAM...'
                  : '🔴 SHOOT LASER'}
              </span>
            </button>
          </div>

          {/* Select Medium Box */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
              SELECT MEDIUM 2 (TANK)
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[OPTICAL_MEDIA.water, OPTICAL_MEDIA.glass, OPTICAL_MEDIA.acrylic, OPTICAL_MEDIA.air].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMedium2Change(m)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                    refractionState.medium2.id === m.id
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md shadow-sky-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100">{m.name}</div>
                  <div className="text-[10px] text-slate-400">n = {m.n}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Theory Box & Telemetry Bar */}
        <div className="lg:col-span-7 space-y-6">
          {/* Theory Box */}
          <div className={`p-6 rounded-3xl border space-y-3 shadow-lg ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              SNELL'S LAW THEORY
            </span>
            <div className="text-xl font-bold font-mono text-center py-2 text-cyan-300">
              n₁ sin θ₁ = n₂ sin θ₂
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Light changes direction when it enters a different medium because its speed changes.
            </p>
          </div>

          {/* Bottom Instrumentation Panel matching mock-up */}
          <div className={`p-6 rounded-3xl border grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            {/* Angle Measurements Circular Gauges */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">ANGLE MEASUREMENTS</span>
              <div className="flex items-center justify-around">
                {/* Incident Circle */}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-red-500 flex items-center justify-center font-mono font-bold text-sm text-red-400">
                    {refractionState.incidentAngleDeg}°
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">Incident (θ₁)</span>
                </div>

                {/* Refracted Circle */}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-cyan-500 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                    {refractionState.refractedAngleDeg}°
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">Refracted (θ₂)</span>
                </div>
              </div>
            </div>

            {/* Speed of Light Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">SPEED OF LIGHT</span>
              <div className="space-y-2">
                <div>
                  <div className="text-slate-400 text-[10px]">In Air:</div>
                  <div className="font-bold text-slate-200">3.00 × 10⁸ m/s</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">In {refractionState.medium2.name}:</div>
                  <div className="font-bold text-purple-400">{(refractionState.speed2Mps / 1e8).toFixed(2)} × 10⁸ m/s</div>
                </div>
              </div>
            </div>

            {/* Calculation Panel */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">CALCULATION PANEL</span>
              <div className="text-[11px] text-slate-300">
                n₁ = {refractionState.medium1.n}, θ₁ = {refractionState.incidentAngleDeg}°<br />
                n₂ = {refractionState.medium2.n}, θ₂ = {refractionState.refractedAngleDeg}°
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                ✓ Physics Correct
              </div>
            </div>

            {/* Shot Result & Accuracy */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">SHOT RESULT</span>
              {refractionState.shotHistory.length > 0 ? (
                <div className="space-y-1">
                  <div className={`font-bold ${refractionState.targetHit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {refractionState.targetHit ? 'HIT!' : 'MISSED!'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Offset: {Math.abs(refractionState.lastImpactOffsetCm || 0)} cm
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${refractionState.lastAccuracyPct || 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[10px]">No shots fired yet. Press SHOOT!</div>
              )}
            </div>
          </div>
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

      {/* Submit / Complete Button */}
      {refractionState.targetHit && (
        <button
          type="button"
          onClick={onCompleteAlignment}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Target className="w-4 h-4 text-slate-950" />
          <span>CONFIRM OPTICAL ALIGNMENT (+500 XP)</span>
        </button>
      )}
    </div>
  );
};
