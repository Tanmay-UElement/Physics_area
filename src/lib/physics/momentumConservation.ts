import { RoundData, ScoreTier } from './types';

export interface MomentumRoundData extends RoundData {
  mass1: number; // in kg (e.g. 3 kg)
  velocity1: number; // in m/s (e.g. 12 m/s)
  mass2: number; // in kg (e.g. 1 kg)
  velocity2: number; // 0 m/s
  totalMomentum: number; // P_total = m1 * v1
  correctFinalVelocity: number; // v_final = P_total / (m1 + m2)
}

/**
 * Calculates final combined velocity for inelastic collision coupling.
 * Formula: v_f = (m1 * v1) / (m1 + m2)
 */
export function calculateInelasticFinalVelocity(m1: number, v1: number, m2: number): number {
  return Number(((m1 * v1) / (m1 + m2)).toFixed(2));
}

/**
 * Generates 5 rounds for Momentum Conservation (Unequal Mass)
 */
export function generateMomentumRounds(): MomentumRoundData[] {
  const configs = [
    { mass1: 3.0, velocity1: 12.0, mass2: 1.0 },  // P = 36, v_f = 9.0 m/s
    { mass1: 4.0, velocity1: 15.0, mass2: 2.0 },  // P = 60, v_f = 10.0 m/s
    { mass1: 5.0, velocity1: 20.0, mass2: 5.0 },  // P = 100, v_f = 10.0 m/s
    { mass1: 6.0, velocity1: 16.0, mass2: 2.0 },  // P = 96, v_f = 12.0 m/s
    { mass1: 8.0, velocity1: 25.0, mass2: 2.0 },  // P = 200, v_f = 20.0 m/s
  ];

  return configs.map((cfg, idx) => {
    const vFinal = calculateInelasticFinalVelocity(cfg.mass1, cfg.velocity1, cfg.mass2);
    const totalMomentum = cfg.mass1 * cfg.velocity1;

    return {
      id: `momentum-round-${idx + 1}`,
      conceptId: 106,
      conceptName: 'Momentum Conservation (Unequal)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: vFinal,
      gravity: 9.8,
      correctVelocity: vFinal,
      mass1: cfg.mass1,
      velocity1: cfg.velocity1,
      mass2: cfg.mass2,
      velocity2: 0,
      totalMomentum,
      correctFinalVelocity: vFinal,
    };
  });
}

/**
 * Evaluates Momentum Conservation submission tolerance
 */
export function evaluateMomentumSubmission(
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
