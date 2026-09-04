import { RoundData, ScoreTier } from './types';

export interface ElasticRoundData extends RoundData {
  mass: number; // in kg (e.g. 2.0 kg for both)
  initialVelocityA: number; // in m/s (e.g. 15 m/s)
  initialVelocityB: number; // 0 m/s
  correctVelocityB: number; // exact post-collision velocity of B = initialVelocityA (equal mass)
}

/**
 * Generates 5 rounds for Elastic Collision velocity calculation
 */
export function generateElasticRounds(): ElasticRoundData[] {
  const configs = [
    { mass: 2.0, initialVelocityA: 10.0 },
    { mass: 5.0, initialVelocityA: 18.0 },
    { mass: 1.5, initialVelocityA: 25.0 },
    { mass: 10.0, initialVelocityA: 12.0 },
    { mass: 4.0, initialVelocityA: 30.0 },
  ];

  return configs.map((cfg, idx) => ({
    id: `elastic-round-${idx + 1}`,
    conceptId: 105,
    conceptName: 'Elastic Collision (Equal Mass)',
    roundNumber: idx + 1,
    totalRounds: 5,
    height: 0,
    distance: cfg.initialVelocityA,
    gravity: 9.8,
    correctVelocity: cfg.initialVelocityA,
    mass: cfg.mass,
    initialVelocityA: cfg.initialVelocityA,
    initialVelocityB: 0,
    correctVelocityB: cfg.initialVelocityA,
  }));
}

/**
 * Evaluates user's typed post-collision velocity
 */
export function evaluateElasticVelocitySubmission(
  targetV: number,
  userV: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diff = Math.abs(userV - targetV);
  const errorPercentage = (diff / targetV) * 100;

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
