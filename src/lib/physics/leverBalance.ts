import { RoundData, ScoreTier } from './types';

export interface LeverRoundData extends RoundData {
  leftMass: number; // in kg (e.g. 30 kg)
  leftDistance: number; // in meters from fulcrum (e.g. 4.0 m)
  rightMass: number; // in kg (e.g. 20 kg)
  targetRightDistance: number; // exact balance distance d = (leftMass * leftDistance) / rightMass
}

/**
 * Calculates exact distance required to balance the lever.
 * Formula: d_right = (leftMass * leftDistance) / rightMass
 */
export function calculateExactLeverDistance(
  leftMass: number,
  leftDistance: number,
  rightMass: number
): number {
  if (rightMass <= 0) return 0;
  return Number(((leftMass * leftDistance) / rightMass).toFixed(2));
}

/**
 * Generates 5 rounds for Lever & Torque Balance mechanic
 */
export function generateLeverRounds(): LeverRoundData[] {
  const configs = [
    { leftMass: 30, leftDistance: 4.0, rightMass: 20 }, // Target = (30 * 4)/20 = 6.0m
    { leftMass: 50, leftDistance: 2.0, rightMass: 25 }, // Target = (50 * 2)/25 = 4.0m
    { leftMass: 15, leftDistance: 8.0, rightMass: 30 }, // Target = (15 * 8)/30 = 4.0m
    { leftMass: 40, leftDistance: 3.5, rightMass: 20 }, // Target = (40 * 3.5)/20 = 7.0m
    { leftMass: 60, leftDistance: 3.0, rightMass: 45 }, // Target = (60 * 3)/45 = 4.0m
  ];

  return configs.map((cfg, idx) => {
    const targetRightDistance = calculateExactLeverDistance(
      cfg.leftMass,
      cfg.leftDistance,
      cfg.rightMass
    );

    return {
      id: `lever-round-${idx + 1}`,
      conceptId: 101, // Custom concept ID for Lever Balance
      conceptName: 'Lever & Torque Balance',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: targetRightDistance,
      gravity: 9.8,
      correctVelocity: targetRightDistance, // Reusing field for target distance
      leftMass: cfg.leftMass,
      leftDistance: cfg.leftDistance,
      rightMass: cfg.rightMass,
      targetRightDistance,
    };
  });
}

/**
 * Evaluates lever balance accuracy
 */
export function evaluateLeverSubmission(
  targetDistance: number,
  userDistance: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const errorPercentage = Math.abs((userDistance - targetDistance) / targetDistance) * 100;

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
