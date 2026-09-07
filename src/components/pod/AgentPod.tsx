'use client';

/**
 * AgentPod.tsx — Pod 2.0 (Diegetic Embodiment)
 * ----------------------------------------------
 * The companion's own body obeys the same physics equations as the active
 * simulation. No text-input chat box. All interaction is gestural:
 *   • Tap  (<300 ms)  → cycles hint tier (aperture glow: 0→Nudge→Formula→Setup→0)
 *   • Hold (>600 ms)  → micro-demo: ghost-launches current input values
 *   • Idle / hesitation → proactive posture shift (anxious flicker / confident glow)
 *
 * TTS narration is an accessibility layer only — subordinate to visual state.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getPodBriefing } from '@/lib/pod/podBriefings';
import { getAgentProfile } from '@/lib/pod/agentRegistry';
import { usePodPhysics } from '@/lib/pod/usePodPhysics';
import { Volume2, VolumeX } from 'lucide-react';

// ── Constants ───────────────────────────────────────────────────────────────
const HOLD_THRESHOLD_MS = 600;
const TAP_THRESHOLD_MS = 300;

// ── Hint-tier label & colour map ─────────────────────────────────────────────
const HINT_LABELS: Record<number, string> = {
  0: '',
  1: 'NUDGE',
  2: 'FORMULA',
  3: 'SETUP',
};

const HINT_APERTURE_COLORS: Record<number, string> = {
  0: 'transparent',
  1: 'rgba(56,189,248,0.55)',   // sky
  2: 'rgba(168,85,247,0.55)',   // purple
  3: 'rgba(251,191,36,0.55)',   // amber
};

// ── Per-agent physics body SVG renderers ─────────────────────────────────────

/** TITAN-X: lever beam that tips based on torque error */
function TitanBody({ tiltAngle, isOverTilted, postureMode, color }: {
  tiltAngle: number;
  isOverTilted: boolean;
  postureMode: string;
  color: string;
}) {
  const wobble = isOverTilted ? 'animate-[tilt-wobble_0.4s_ease-in-out_infinite_alternate]' : '';
  return (
    <svg viewBox="0 0 64 64" className={`w-full h-full ${wobble}`} aria-hidden>
      {/* Fulcrum */}
      <polygon points="32,54 25,64 39,64" fill={color} opacity="0.7" />
      {/* Lever beam */}
      <g transform={`rotate(${tiltAngle}, 32, 54)`}>
        <rect x="8" y="50" width="48" height="5" rx="2.5" fill={color} opacity="0.85" />
        {/* Left weight */}
        <rect x="8" y="38" width="10" height="12" rx="2" fill={color} opacity={postureMode === 'warning' ? '1' : '0.6'} />
        {/* Right weight */}
        <rect x="46" y="38" width="10" height="12" rx="2" fill={color} opacity={postureMode === 'confident' ? '1' : '0.6'} />
      </g>
      {/* Core orb */}
      <circle cx="32" cy="28" r="12" fill="rgba(2,8,23,0.9)" stroke={color} strokeWidth="1.5" />
      <circle cx="32" cy="28" r="6" fill={color} opacity="0.7" />
    </svg>
  );
}

/** SYNAPSE: circuit ring that charges/dims to player's RC time constant */
function SynapseBody({ segmentLevels, chargeLevel, isVoltageWarning, color }: {
  segmentLevels: [number, number, number, number];
  chargeLevel: number;
  isVoltageWarning: boolean;
  color: string;
}) {
  const rings = [
    { r: 28, stroke: 3 },
    { r: 22, stroke: 2.5 },
    { r: 16, stroke: 2 },
    { r: 10, stroke: 1.5 },
  ] as const;
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
      {rings.map((ring, i) => {
        const level = segmentLevels[i];
        const dash = 2 * Math.PI * ring.r;
        return (
          <circle
            key={i}
            cx="32"
            cy="32"
            r={ring.r}
            fill="none"
            stroke={color}
            strokeWidth={ring.stroke}
            strokeDasharray={`${dash * level} ${dash * (1 - level)}`}
            strokeDashoffset={dash * 0.25}
            strokeLinecap="round"
            opacity={isVoltageWarning && i === 0 ? 1 : 0.3 + level * 0.7}
            style={{ transition: 'stroke-dasharray 0.4s ease, opacity 0.4s ease' }}
          />
        );
      })}
      {/* Core charge dot */}
      <circle cx="32" cy="32" r="6" fill={color} opacity={0.4 + chargeLevel * 0.6}
        style={{ transition: 'opacity 0.4s ease' }} />
      {isVoltageWarning && (
        <circle cx="32" cy="32" r="9" fill="none" stroke={color} strokeWidth="1"
          opacity="0.9" className="animate-ping" />
      )}
    </svg>
  );
}

/** NOVA: wave-echo — two phase-shifted orbs that converge/diverge */
function NovaBody({ echoSeparation, waveIntensity, phaseOffsetDeg, color }: {
  echoSeparation: number;
  waveIntensity: number;
  phaseOffsetDeg: number;
  color: string;
}) {
  const offset = Math.min(echoSeparation, 14);
  const isDestructive = phaseOffsetDeg > 90;
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
      {/* Echo orb 1 */}
      <circle cx={32 - offset} cy="32" r="11" fill={color}
        opacity={waveIntensity * 0.65}
        style={{ transition: 'all 0.35s ease' }} />
      {/* Echo orb 2 */}
      <circle cx={32 + offset} cy="32" r="11" fill={color}
        opacity={waveIntensity * 0.65}
        style={{ transition: 'all 0.35s ease' }} />
      {/* Interference ring */}
      <circle cx="32" cy="32" r="18" fill="none" stroke={color}
        strokeWidth={isDestructive ? '0.5' : '1.5'}
        opacity={isDestructive ? 0.25 : 0.6}
        style={{ transition: 'all 0.35s ease' }} />
      {/* Phase label */}
      <text x="32" y="35" textAnchor="middle" fill={color} fontSize="7" opacity="0.8">
        {Math.round(phaseOffsetDeg)}°
      </text>
    </svg>
  );
}

/** AURA-9: parabolic arc ghost that skews with trajectory deviation */
function AuraBody({ arcDeviation, isOverShot, color }: {
  arcDeviation: number;
  isOverShot: boolean;
  color: string;
}) {
  // Build a parabola path: y = a·x² shifted by deviation
  const shift = arcDeviation * 16 * (isOverShot ? -1 : 1);
  const points = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8; // 0..1
    const x = 8 + t * 48;
    const y = 56 - (t * (1 - t)) * 48 + shift * t;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
      {/* Parabola ghost */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeDasharray="3 2" opacity="0.5"
        style={{ transition: 'points 0.3s ease' }} />
      {/* Ideal arc (centre) */}
      <polyline
        points={Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          const x = 8 + t * 48;
          const y = 56 - (t * (1 - t)) * 48;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ')}
        fill="none" stroke={color} strokeWidth="2" opacity="0.9"
      />
      {/* Launcher dot */}
      <circle cx="8" cy="56" r="3" fill={color} opacity="0.9" />
      {/* Target dot */}
      <circle cx="56" cy="56" r="3" fill={color} opacity="0.6" />
    </svg>
  );
}

// ── Posture-derived CSS classes ───────────────────────────────────────────────
function getPostureStyle(postureMode: string, colorHex: string): React.CSSProperties {
  switch (postureMode) {
    case 'confident':
      return {
        boxShadow: `0 0 24px 6px ${colorHex}90, 0 0 60px 12px ${colorHex}30`,
        transition: 'box-shadow 0.6s ease',
      };
    case 'anxious':
      return {
        boxShadow: `0 0 10px 2px rgba(251,191,36,0.5)`,
        animation: 'pod-anxious-flicker 0.9s ease-in-out infinite alternate',
        transition: 'box-shadow 0.6s ease',
      };
    case 'warning':
      return {
        boxShadow: `0 0 14px 4px rgba(239,68,68,0.6)`,
        transition: 'box-shadow 0.3s ease',
      };
    default:
      return {
        boxShadow: `0 0 8px 1px ${colorHex}40`,
        transition: 'box-shadow 0.6s ease',
      };
  }
}

// ── Aperture hint overlay ─────────────────────────────────────────────────────
function HintAperture({ tier, briefing, agentColor }: {
  tier: number;
  briefing: ReturnType<typeof getPodBriefing>;
  agentColor: string;
}) {
  if (tier === 0) return null;

  const content: Record<number, string> = {
    1: briefing.nudgeHint,
    2: briefing.formulaHint,
    3: briefing.workedStructure,
  };

  return (
    <div
      className="pointer-events-none absolute bottom-[calc(100%+12px)] right-0 w-72 rounded-2xl text-xs font-mono animate-in slide-in-from-bottom-2 fade-in duration-300"
      style={{
        background: 'rgba(2,8,23,0.96)',
        border: `1.5px solid ${HINT_APERTURE_COLORS[tier]}`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 24px 4px ${HINT_APERTURE_COLORS[tier]}`,
        padding: '14px 16px',
      }}
    >
      {/* Tier badge */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-md"
          style={{
            background: HINT_APERTURE_COLORS[tier],
            color: '#020817',
          }}
        >
          {HINT_LABELS[tier]}
        </span>
        <span className="text-slate-500 text-[10px]">tap pod to advance ↓</span>
      </div>

      {/* Content */}
      <p className="leading-relaxed text-slate-200 text-[11px]">{content[tier]}</p>

      {/* Aperture progress pips */}
      <div className="flex gap-1.5 mt-3">
        {[1, 2, 3].map((t) => (
          <div
            key={t}
            className="h-1 flex-1 rounded-full"
            style={{
              background: t <= tier ? HINT_APERTURE_COLORS[tier] : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Tail */}
      <div
        className="absolute -bottom-2 right-8 w-4 h-4 rotate-45"
        style={{
          background: 'rgba(2,8,23,0.96)',
          borderRight: `1.5px solid ${HINT_APERTURE_COLORS[tier]}`,
          borderBottom: `1.5px solid ${HINT_APERTURE_COLORS[tier]}`,
        }}
      />
    </div>
  );
}

// ── Micro-demo overlay ────────────────────────────────────────────────────────
function MicroDemoOverlay({ isVisible, inputValue, correctValue, agentColor, onDismiss }: {
  isVisible: boolean;
  inputValue: number | null;
  correctValue: number | null;
  agentColor: string;
  onDismiss: () => void;
}) {
  if (!isVisible) return null;

  const proximity = inputValue != null && correctValue != null && correctValue !== 0
    ? Math.max(0, 1 - Math.abs((inputValue - correctValue) / correctValue))
    : null;

  return (
    <div
      className="pointer-events-auto absolute bottom-[calc(100%+12px)] right-0 w-72 rounded-2xl animate-in slide-in-from-bottom-2 fade-in duration-300"
      style={{
        background: 'rgba(2,8,23,0.97)',
        border: `1.5px solid ${agentColor}80`,
        backdropFilter: 'blur(20px)',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md text-slate-900"
          style={{ background: agentColor }}>
          MICRO-DEMO
        </span>
        <button type="button" onClick={onDismiss}
          className="text-slate-500 hover:text-slate-200 text-[10px] font-mono transition-colors">
          DISMISS ×
        </button>
      </div>

      <p className="text-slate-400 text-[10px] font-mono mb-3">
        Ghost-launching your current values:
      </p>

      {/* Value comparison bar */}
      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 text-right">Your input</span>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full"
              style={{
                width: `${(proximity ?? 0) * 100}%`,
                background: agentColor,
                transition: 'width 0.5s ease',
              }} />
          </div>
          <span style={{ color: agentColor }} className="font-bold w-16 text-right">
            {inputValue?.toFixed(2) ?? '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 text-right">Correct</span>
          <div className="flex-1 h-2 rounded-full bg-emerald-500/30 overflow-hidden">
            <div className="h-full w-full rounded-full bg-emerald-500 opacity-70" />
          </div>
          <span className="text-emerald-400 font-bold w-16 text-right">
            {correctValue?.toFixed(2) ?? '—'}
          </span>
        </div>
      </div>

      {/* Proximity score */}
      {proximity != null && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500">Proximity: </span>
          <span className="font-black font-mono" style={{
            color: proximity > 0.9 ? '#34d399' : proximity > 0.6 ? agentColor : '#f87171'
          }}>
            {(proximity * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const AgentPod: React.FC = () => {
  const {
    activeMode,
    activeAgentId,
    podHintTier,
    cyclePodHintTier,
    closePodHint,
    currentRound,
    lastPlayerInputValue,
  } = useGameStore();

  const agent = getAgentProfile(activeAgentId || 'aura-9');
  const briefing = getPodBriefing(activeMode);
  const podState = usePodPhysics();

  // ── Local interaction state ────────────────────────────────────────────────
  const [showMicroDemo, setShowMicroDemo] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Pointer timing for tap vs hold discrimination
  const pointerDownAt = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold = useRef(false);

  // ── Speech synthesis (accessibility layer) ────────────────────────────────
  const speak = useCallback((text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = agent.speechPitch;
    u.rate = agent.speechRate;
    u.onstart = () => setIsSpeakingAudio(true);
    u.onend = () => setIsSpeakingAudio(false);
    u.onerror = () => setIsSpeakingAudio(false);
    window.speechSynthesis.speak(u);
  }, [agent.speechPitch, agent.speechRate, isMuted]);

  // Narrate hint tier changes
  useEffect(() => {
    if (podHintTier === 0) return;
    const texts: Record<number, string> = {
      1: briefing.nudgeHint,
      2: briefing.formulaHint,
      3: briefing.workedStructure,
    };
    speak(texts[podHintTier] || '');
  }, [podHintTier, briefing, speak]);

  // Narrate posture shifts
  useEffect(() => {
    if (podState.postureMode === 'anxious') {
      speak(`${agent.name} here — let me know if you need a hint. Tap me for guidance.`);
    }
  }, [podState.postureMode, agent.name, speak]);

  // ── Gesture handlers ───────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDownAt.current = Date.now();
    didHold.current = false;

    // Start hold timer
    holdTimer.current = setTimeout(() => {
      didHold.current = true;
      setShowMicroDemo(true);
    }, HOLD_THRESHOLD_MS);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const elapsed = Date.now() - (pointerDownAt.current ?? Date.now());
    if (holdTimer.current) clearTimeout(holdTimer.current);

    if (!didHold.current && elapsed < TAP_THRESHOLD_MS * 2) {
      // It's a tap — cycle hint tier
      cyclePodHintTier();
      setShowMicroDemo(false);
    }
    pointerDownAt.current = null;
  };

  const onPointerCancel = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    pointerDownAt.current = null;
    didHold.current = false;
  };

  // Close hint when mode changes
  useEffect(() => {
    closePodHint();
    setShowMicroDemo(false);
  }, [activeMode, closePodHint]);

  // ── Derived visual values ──────────────────────────────────────────────────
  const postureStyle = getPostureStyle(podState.postureMode, agent.colorHex);

  // Aura brightness scales with maturity tier (0→dim, 3→blazing)
  const auraOpacity = 0.3 + podState.maturityTier * 0.23; // 0.3..0.99

  // Animated posture classes
  const orbAnimClass = podState.postureMode === 'anxious'
    ? 'animate-[pod-bob_0.6s_ease-in-out_infinite_alternate]'
    : podState.postureMode === 'confident'
    ? 'animate-[pod-glow-pulse_1.2s_ease-in-out_infinite_alternate]'
    : 'animate-[pod-idle-bob_1.8s_ease-in-out_infinite_alternate]';

  // Render the correct physics body SVG per agent
  const renderPhysicsBody = () => {
    switch (agent.physicsBodyType) {
      case 'lever':
        return (
          <TitanBody
            tiltAngle={podState.tiltAngle}
            isOverTilted={podState.isOverTilted}
            postureMode={podState.postureMode}
            color={agent.colorHex}
          />
        );
      case 'circuit':
        return (
          <SynapseBody
            segmentLevels={podState.segmentLevels}
            chargeLevel={podState.chargeLevel}
            isVoltageWarning={podState.isVoltageWarning}
            color={agent.colorHex}
          />
        );
      case 'wave-echo':
        return (
          <NovaBody
            echoSeparation={podState.echoSeparation}
            waveIntensity={podState.waveIntensity}
            phaseOffsetDeg={podState.phaseOffsetDeg}
            color={agent.colorHex}
          />
        );
      case 'parabola':
      default:
        return (
          <AuraBody
            arcDeviation={podState.arcDeviation}
            isOverShot={podState.isOverShot}
            color={agent.colorHex}
          />
        );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-end">
      <div className="relative flex flex-col items-end gap-0">

        {/* ── Hint aperture overlay ────────────────────────────────────── */}
        <HintAperture
          tier={podHintTier}
          briefing={briefing}
          agentColor={agent.colorHex}
        />

        {/* ── Micro-demo overlay ───────────────────────────────────────── */}
        <MicroDemoOverlay
          isVisible={showMicroDemo}
          inputValue={lastPlayerInputValue}
          correctValue={currentRound?.correctVelocity ?? null}
          agentColor={agent.colorHex}
          onDismiss={() => setShowMicroDemo(false)}
        />

        {/* ── Main pod orb ─────────────────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`${agent.name} Agent Pod — tap for hint, hold for micro-demo`}
          className={`relative cursor-pointer select-none touch-none outline-none rounded-2xl ${orbAnimClass}`}
          style={{
            width: 72,
            height: 72,
            ...postureStyle,
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cyclePodHintTier(); }}
        >
          {/* ── Outer aura ring (maturity-scaled) ──────────────────────── */}
          <div
            className="absolute -inset-3 rounded-3xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${agent.colorHex}60 0%, transparent 70%)`,
              opacity: auraOpacity,
              animation: 'radar-ring 2.4s ease-out infinite',
            }}
          />

          {/* ── Aperture glow ring (hint-tier-driven) ──────────────────── */}
          {podHintTier > 0 && (
            <div
              className="absolute -inset-2 rounded-2xl pointer-events-none"
              style={{
                border: `2px solid ${HINT_APERTURE_COLORS[podHintTier]}`,
                boxShadow: `0 0 16px 4px ${HINT_APERTURE_COLORS[podHintTier]}`,
                borderRadius: 20,
                animation: 'aperture-pulse 1s ease-in-out infinite alternate',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            />
          )}

          {/* ── Gradient outer ring ─────────────────────────────────────── */}
          <div
            className={`absolute -inset-1 rounded-[22px] bg-gradient-to-r ${agent.gradientClass} blur-sm pointer-events-none`}
            style={{ opacity: 0.45 + podState.proximityToCorrect * 0.3 }}
          />

          {/* ── Core pod body ────────────────────────────────────────────── */}
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'rgba(2,8,23,0.92)',
              border: `1.5px solid ${agent.colorHex}90`,
            }}
          >
            {/* Physics body SVG — fills entire orb */}
            <div className="absolute inset-1.5 pointer-events-none">
              {renderPhysicsBody()}
            </div>

            {/* Error-trend micro-indicator */}
            {podState.errorTrend !== 'stable' && (
              <div
                className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
                style={{
                  background: podState.errorTrend === 'improving' ? '#34d399' : '#f87171',
                  animation: 'ping 1s ease-in-out infinite',
                }}
              />
            )}

            {/* Live status dot */}
            <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
          </div>

          {/* ── Agent name badge ────────────────────────────────────────── */}
          <span
            className="absolute -top-2.5 -right-2.5 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full text-slate-950 shadow-md whitespace-nowrap"
            style={{ background: agent.colorHex }}
          >
            {agent.name}
          </span>

          {/* ── Hint tier pip ────────────────────────────────────────────── */}
          {podHintTier > 0 && (
            <span
              className="absolute -top-1 left-0 w-3 h-3 rounded-full text-[8px] font-black flex items-center justify-center text-slate-950"
              style={{ background: HINT_APERTURE_COLORS[podHintTier] }}
            >
              {podHintTier}
            </span>
          )}
        </div>

        {/* ── Interaction labels ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-1.5 self-end">
          {/* Posture indicator */}
          <span className="text-[9px] font-mono text-slate-600">
            {podState.postureMode !== 'idle'
              ? `[${podState.postureMode.toUpperCase()}]`
              : `TAP·HINT  HOLD·DEMO`}
          </span>

          {/* TTS mute toggle */}
          <button
            type="button"
            onClick={() => {
              setIsMuted((m) => !m);
              if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
            aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
            title={isMuted ? 'Unmute voice narration' : 'Mute voice narration'}
          >
            {isMuted
              ? <VolumeX className="w-3 h-3" />
              : <Volume2 className={`w-3 h-3 ${isSpeakingAudio ? 'text-amber-400 animate-pulse' : ''}`} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};
