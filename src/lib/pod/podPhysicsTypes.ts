/**
 * podPhysicsTypes.ts
 * ------------------
 * Types for the diegetic physics-body Agent Pod system.
 * Each agent's body is animated by the same physics equations as the live simulation.
 */

/** Which hint aperture tier is currently expanded on the pod */
export type HintTier = 0 | 1 | 2 | 3;

/** Pod posture driven by proactive sensing of player state */
export type PostureMode = 'idle' | 'confident' | 'anxious' | 'warning';

/** Visual maturity tier based on per-class XP accumulated */
export type MaturityTier = 0 | 1 | 2 | 3; // Recruit → Cadet → Veteran → Elite

/**
 * The computed animation state for a specific agent's physics body.
 * All values are normalized 0..1 or in degrees unless noted.
 */
export interface PodPhysicsState {
  // ── TITAN-X (lever beam) ──────────────────────────────────────────────────
  /** Signed tilt angle in degrees (-45 to +45). 0 = balanced. */
  tiltAngle: number;
  /** Whether the lever is over-tilted and should spring-wobble */
  isOverTilted: boolean;

  // ── SYNAPSE (circuit / charge) ────────────────────────────────────────────
  /** 0..1 charge fill level for the RC bar */
  chargeLevel: number;
  /** Per-segment brightness for 4 resistor rings (0..1 each) */
  segmentLevels: [number, number, number, number];
  /** Whether SYNAPSE should flicker (voltage sag warning) */
  isVoltageWarning: boolean;

  // ── NOVA (wave echo) ──────────────────────────────────────────────────────
  /** Pixel separation between primary and echo orbs (0 = overlap) */
  echoSeparation: number;
  /** 0..1 combined brightness (1 = constructive, 0 = destructive) */
  waveIntensity: number;
  /** Current phase offset in degrees for display */
  phaseOffsetDeg: number;

  // ── AURA-9 (parabola ghost) ───────────────────────────────────────────────
  /** 0..1 deviation from ideal arc (0 = perfect, 1 = very wrong) */
  arcDeviation: number;
  /** True if player's velocity is higher than correct */
  isOverShot: boolean;

  // ── Shared ────────────────────────────────────────────────────────────────
  /** How close to correct the current answer is (0..1, 1 = exact) */
  proximityToCorrect: number;
  /** Pod posture mode driven by proactive sensing */
  postureMode: PostureMode;
  /** Visual maturity tier (0=Recruit, 1=Cadet, 2=Veteran, 3=Elite) */
  maturityTier: MaturityTier;
  /** Error trend: 'improving' | 'degrading' | 'stable' */
  errorTrend: 'improving' | 'degrading' | 'stable';
}

/**
 * Per-class XP tracking for the maturity system.
 * Separate from global sessionXP so each class has its own progression.
 */
export interface ClassXP {
  kinetic: number;
  volt: number;
  wave: number;
}

/** XP thresholds for maturity tiers */
export const MATURITY_THRESHOLDS: [number, number, number, number] = [0, 200, 500, 1000];

/** Returns 0–3 maturity tier from XP */
export function getMaturityTier(xp: number): MaturityTier {
  if (xp >= MATURITY_THRESHOLDS[3]) return 3;
  if (xp >= MATURITY_THRESHOLDS[2]) return 2;
  if (xp >= MATURITY_THRESHOLDS[1]) return 1;
  return 0;
}

/** Maps a game mode key to its class group */
export function getClassGroup(modeKey: string): 'kinetic' | 'volt' | 'wave' {
  if (modeKey.startsWith('volt-')) return 'volt';
  if (modeKey.startsWith('wave-')) return 'wave';
  return 'kinetic';
}
