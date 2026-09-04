import { RoundData, ScoreTier } from './types';

export interface FreeFallRoundData extends RoundData {
  heavyMass: number; // in kg
  lightMass: number; // in kg
  dropHeight: number; // in meters (h)
  gravity: number; // 9.8 m/s^2
  correctFallTime: number; // t = sqrt(2h/g)
}

/**
 * Calculates exact free fall time t = sqrt(2h/g)
 */
export function calculateFreeFallTime(height: number, gravity: number = 9.8): number {
  return Number(Math.sqrt((2 * height) / gravity).toFixed(2));
}

/**
 * Generates 5 rounds for Free Fall calculation challenge
 */
export function generateFreeFallRounds(): FreeFallRoundData[] {
  const configs = [
    { heavyMass: 50, lightMass: 0.5, dropHeight: 19.6 }, // t = sqrt(39.2 / 9.8) = 2.00 s
    { heavyMass: 100, lightMass: 1.0, dropHeight: 44.1 }, // t = sqrt(88.2 / 9.8) = 3.00 s
    { heavyMass: 250, lightMass: 0.2, dropHeight: 78.4 }, // t = sqrt(156.8 / 9.8) = 4.00 s
    { heavyMass: 80, lightMass: 2.0, dropHeight: 30.0 }, // t = sqrt(60 / 9.8) = 2.47 s
    { heavyMass: 500, lightMass: 0.1, dropHeight: 122.5 }, // t = sqrt(245 / 9.8) = 5.00 s
  ];

  return configs.map((cfg, idx) => {
    const fallTime = calculateFreeFallTime(cfg.dropHeight);
    return {
      id: `free-fall-round-${idx + 1}`,
      conceptId: 104,
      conceptName: 'Free Fall Time Calculation',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: cfg.dropHeight,
      distance: fallTime,
      gravity: 9.8,
      correctVelocity: fallTime,
      heavyMass: cfg.heavyMass,
      lightMass: cfg.lightMass,
      dropHeight: cfg.dropHeight,
      correctFallTime: fallTime,
    };
  });
}

/**
 * Evaluates user's typed fall time input
 */
export function evaluateFreeFallTimeSubmission(
  targetTime: number,
  userTime: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diff = Math.abs(userTime - targetTime);
  const errorPercentage = (diff / targetTime) * 100;

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
