import { RoundData, RoundResult, ScoreTier } from './types';

export const DEFAULT_GRAVITY = 9.8; // m/s^2

/**
 * Calculates the exact launch velocity required for horizontal projectile motion.
 * Formula: t = sqrt(2 * h / g), v = d / t
 */
export function calculateExactHorizontalVelocity(
  height: number,
  distance: number,
  gravity: number = DEFAULT_GRAVITY
): number {
  if (height <= 0 || distance <= 0 || gravity <= 0) return 0;
  const time = Math.sqrt((2 * height) / gravity);
  return distance / time;
}

/**
 * Calculates theoretical time of flight for horizontal launch
 */
export function calculateFlightTime(
  height: number,
  gravity: number = DEFAULT_GRAVITY
): number {
  return Math.sqrt((2 * height) / gravity);
}

/**
 * Generates 5 escalating difficulty rounds for Concept #1 (Horizontal Projectile Motion)
 */
export function generateHorizontalRounds(): RoundData[] {
  const roundConfigs = [
    { height: 20, distance: 40 },  // Round 1: Easy baseline (v = 40 / sqrt(40/9.8) ≈ 19.80 m/s)
    { height: 35, distance: 70 },  // Round 2: Moderate height & distance
    { height: 15, distance: 60 },  // Round 3: Low launch platform, higher speed needed
    { height: 50, distance: 100 }, // Round 4: High launch platform, long drop
    { height: 45, distance: 135 }, // Round 5: Boss distance challenge
  ];

  return roundConfigs.map((config, idx) => {
    const correctVelocity = calculateExactHorizontalVelocity(
      config.height,
      config.distance,
      DEFAULT_GRAVITY
    );

    return {
      id: `concept-1-round-${idx + 1}`,
      conceptId: 1,
      conceptName: 'Horizontal Projectile Motion',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: config.height,
      distance: config.distance,
      gravity: DEFAULT_GRAVITY,
      correctVelocity: Number(correctVelocity.toFixed(2)),
    };
  });
}

/**
 * Evaluates the player's submission against formula and scoring rules.
 * Score Tier Rules from Curriculum Spec v2 Section 3:
 * - Hit: error <= 5% (100 XP)
 * - Close: 5% < error <= 15% (40 XP)
 * - Miss: error > 15% (10 XP baseline)
 */
export function evaluateHorizontalSubmission(
  round: RoundData,
  userVelocity: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const exact = round.correctVelocity;
  const errorPercentage = Math.abs((userVelocity - exact) / exact) * 100;

  let tier: ScoreTier;
  let xpEarned: number;

  if (errorPercentage <= 5.0) {
    tier = 'hit';
    xpEarned = 100;
  } else if (errorPercentage <= 15.0) {
    tier = 'close';
    xpEarned = 40;
  } else {
    tier = 'miss';
    xpEarned = 10;
  }

  return {
    tier,
    errorPercentage: Number(errorPercentage.toFixed(2)),
    xpEarned,
  };
}

/**
 * Computes trajectory points (in meters) for visualization
 */
export function generateTrajectoryPoints(
  vX: number,
  height: number,
  gravity: number = DEFAULT_GRAVITY,
  steps: number = 30
): Array<{ x: number; y: number }> {
  const flightTime = Math.sqrt((2 * height) / gravity);
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * flightTime;
    const x = vX * t;
    const y = height - 0.5 * gravity * t * t; // height down to 0
    points.push({ x, y: Math.max(0, y) });
  }

  return points;
}
