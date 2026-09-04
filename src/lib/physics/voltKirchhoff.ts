import { RoundData, ScoreTier } from './types';

export interface VoltKirchhoffRoundData extends RoundData {
  branch1In: number; // Current entering branch 1 (A) e.g. 5 A
  branch2In: number; // Current entering branch 2 (A) e.g. 8 A
  branch3Out: number; // Current leaving branch 3 (A) e.g. 4 A
  correctMissingCurrent: number; // I_missing = (I_1 + I_2) - I_3
}

/**
 * Calculates missing branch current from KCL: sum(I_in) = sum(I_out)
 */
export function calculateKirchhoffMissingCurrent(i1In: number, i2In: number, i3Out: number): number {
  return Number((i1In + i2In - i3Out).toFixed(2));
}

/**
 * Generates 5 rounds for Volt Kirchhoff's Boss Round
 */
export function generateVoltKirchhoffRounds(): VoltKirchhoffRoundData[] {
  const configs = [
    { branch1In: 5.0, branch2In: 8.0, branch3Out: 4.0 }, // I_missing = 13 - 4 = 9.00 A
    { branch1In: 12.0, branch2In: 6.0, branch3Out: 10.0 }, // I_missing = 18 - 10 = 8.00 A
    { branch1In: 15.0, branch2In: 25.0, branch3Out: 20.0 }, // I_missing = 40 - 20 = 20.00 A
    { branch1In: 3.5, branch2In: 4.5, branch3Out: 2.0 }, // I_missing = 8 - 2 = 6.00 A
    { branch1In: 50.0, branch2In: 30.0, branch3Out: 45.0 }, // I_missing = 80 - 45 = 35.00 A
  ];

  return configs.map((cfg, idx) => {
    const correctI = calculateKirchhoffMissingCurrent(cfg.branch1In, cfg.branch2In, cfg.branch3Out);
    return {
      id: `volt-kirchhoff-round-${idx + 1}`,
      conceptId: 208,
      conceptName: 'Kirchhoff\'s Boss Round (KCL)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: correctI,
      gravity: 9.8,
      correctVelocity: correctI,
      branch1In: cfg.branch1In,
      branch2In: cfg.branch2In,
      branch3Out: cfg.branch3Out,
      correctMissingCurrent: correctI,
    };
  });
}

/**
 * Evaluates Kirchhoff KCL submission
 */
export function evaluateVoltKirchhoffSubmission(
  targetI: number,
  userI: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diff = Math.abs(userI - targetI);
  const errorPercentage = (diff / targetI) * 100;

  let tier: ScoreTier;
  let xpEarned: number;

  if (errorPercentage <= 5.0) {
    tier = 'hit';
    xpEarned = 150; // Boss round bonus XP!
  } else if (errorPercentage <= 15.0) {
    tier = 'close';
    xpEarned = 60;
  } else {
    tier = 'miss';
    xpEarned = 20;
  }

  return {
    tier,
    errorPercentage: Number(errorPercentage.toFixed(2)),
    xpEarned,
  };
}
