'use client';

/**
 * usePodPhysics.ts
 * ----------------
 * Computes per-frame physics animation state for the diegetic Agent Pod.
 * Each agent's body parameters are derived from the same equations the player
 * is actively solving — not from scripted triggers.
 *
 * Returns PodPhysicsState that drives the SVG physics body and posture mode.
 */

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  PodPhysicsState,
  PostureMode,
  MaturityTier,
  getMaturityTier,
  getClassGroup,
  MATURITY_THRESHOLDS,
} from './podPhysicsTypes';
import { getAgentProfile } from './agentRegistry';

// ── Constants ──────────────────────────────────────────────────────────────────
const IDLE_ANXIOUS_MS = 5000;   // After 5s idle → anxious posture
const CONFIDENT_PROXIMITY = 0.90; // Within 10% of correct → confident
const WARNING_PROXIMITY = 0.50;  // More than 50% wrong → warning

// ── Default neutral state ──────────────────────────────────────────────────────
const DEFAULT_STATE: PodPhysicsState = {
  tiltAngle: 0,
  isOverTilted: false,
  chargeLevel: 0.5,
  segmentLevels: [0.5, 0.5, 0.5, 0.5],
  isVoltageWarning: false,
  echoSeparation: 0,
  waveIntensity: 1,
  phaseOffsetDeg: 0,
  arcDeviation: 0,
  isOverShot: false,
  proximityToCorrect: 1,
  postureMode: 'idle',
  maturityTier: 0,
  errorTrend: 'stable',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Normalize value into 0..1 proximity: 1 = perfect match, 0 = very wrong */
function calcProximity(playerVal: number | null, correctVal: number | null): number {
  if (playerVal == null || correctVal == null || correctVal === 0) return 1;
  const err = Math.abs((playerVal - correctVal) / correctVal);
  return Math.max(0, 1 - err);
}

/** Compute tilt for TITAN-X from torque imbalance */
function computeTiltAngle(proximity: number, isOverShot: boolean): number {
  // 0 proximity = max tilt 45°; 1 proximity = 0° (balanced)
  const rawAngle = (1 - proximity) * 45;
  return isOverShot ? rawAngle : -rawAngle;
}

/** Compute SYNAPSE segment levels from circuit proximity */
function computeSegments(proximity: number): [number, number, number, number] {
  // Segments light progressively from inside-out as player approaches correct
  const lit = proximity;
  const s0 = Math.min(1, lit * 4);
  const s1 = Math.min(1, Math.max(0, (lit - 0.25) * 4));
  const s2 = Math.min(1, Math.max(0, (lit - 0.50) * 4));
  const s3 = Math.min(1, Math.max(0, (lit - 0.75) * 4));
  return [s0, s1, s2, s3];
}

/** Compute NOVA echo separation and intensity from phase proximity */
function computeWaveParams(proximity: number): { separation: number; intensity: number } {
  // Destructive = max separation 20px, dim; Constructive = 0px, bright
  const separation = (1 - proximity) * 20;
  const intensity = 0.2 + proximity * 0.8; // 0.2..1.0
  return { separation, intensity };
}

// ── Main Hook ──────────────────────────────────────────────────────────────────

export function usePodPhysics(): PodPhysicsState {
  const {
    activeMode,
    currentRound,
    isSimulating,
    simulationResult,
    activeAgentId,
    lastInputTimestamp,
    lastPlayerInputValue,
    prevPlayerInputValue,
    classXP,
  } = useGameStore();

  const agent = getAgentProfile(activeAgentId || 'aura-9');
  const classGroup = getClassGroup(activeMode);
  const maturityXP = classXP[classGroup] ?? 0;
  const maturityTier = getMaturityTier(maturityXP) as MaturityTier;

  // ── Re-compute state on every render (no RAF needed — driven by store changes)
  const [podState, setPodState] = useState<PodPhysicsState>({
    ...DEFAULT_STATE,
    maturityTier,
  });

  // Track idle interval
  const idleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear previous idle interval
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);

    idleIntervalRef.current = setInterval(() => {
      const idleMs = Date.now() - lastInputTimestamp;
      const isIdle = idleMs > IDLE_ANXIOUS_MS && !isSimulating;

      setPodState((prev) => ({
        ...prev,
        postureMode: isIdle ? 'anxious' : prev.postureMode,
      }));
    }, 1000);

    return () => {
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, [lastInputTimestamp, isSimulating]);

  useEffect(() => {
    // ── Derive correct value from current round ─────────────────────────────
    // We use correctVelocity as the canonical "correct answer" value for the
    // error-proximity calculation. For non-velocity modes, the same slot is
    // populated by each mode's generator with whatever the correct scalar is.
    const correctVal = currentRound?.correctVelocity ?? null;
    const playerVal = lastPlayerInputValue;

    const proximity = calcProximity(playerVal, correctVal);
    const isOverShot = playerVal != null && correctVal != null && playerVal > correctVal;

    // ── Error trend ──────────────────────────────────────────────────────────
    let errorTrend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (prevPlayerInputValue != null && playerVal != null && correctVal != null) {
      const prevProx = calcProximity(prevPlayerInputValue, correctVal);
      if (proximity > prevProx + 0.02) errorTrend = 'improving';
      else if (proximity < prevProx - 0.02) errorTrend = 'degrading';
    }

    // ── Posture mode ─────────────────────────────────────────────────────────
    const idleMs = Date.now() - lastInputTimestamp;
    let postureMode: PostureMode = 'idle';
    if (isSimulating) {
      postureMode = 'idle';
    } else if (proximity >= CONFIDENT_PROXIMITY) {
      postureMode = 'confident';
    } else if (errorTrend === 'degrading' || proximity < WARNING_PROXIMITY) {
      postureMode = 'warning';
    } else if (idleMs > IDLE_ANXIOUS_MS) {
      postureMode = 'anxious';
    } else {
      postureMode = 'idle';
    }

    // ── Per-agent physics body state ─────────────────────────────────────────
    const tiltAngle = computeTiltAngle(proximity, isOverShot);
    const isOverTilted = Math.abs(tiltAngle) > 40;
    const chargeLevel = proximity;
    const segmentLevels = computeSegments(proximity);
    const isVoltageWarning = proximity < 0.4 && errorTrend === 'degrading';
    const { separation: echoSeparation, intensity: waveIntensity } = computeWaveParams(proximity);
    const arcDeviation = 1 - proximity;

    setPodState({
      tiltAngle,
      isOverTilted,
      chargeLevel,
      segmentLevels,
      isVoltageWarning,
      echoSeparation,
      waveIntensity,
      phaseOffsetDeg: (1 - proximity) * 180, // 0° (constructive) → 180° (destructive)
      arcDeviation,
      isOverShot,
      proximityToCorrect: proximity,
      postureMode,
      maturityTier,
      errorTrend,
    });
  }, [
    currentRound,
    lastPlayerInputValue,
    prevPlayerInputValue,
    lastInputTimestamp,
    isSimulating,
    simulationResult,
    maturityTier,
  ]);

  return podState;
}
