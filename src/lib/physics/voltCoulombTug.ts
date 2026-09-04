import { RoundData, ScoreTier } from './types';

export interface VoltCoulombRoundData extends RoundData {
  charge1: number; // micro-Coulombs (uC) e.g. 5 uC
  charge2: number; // micro-Coulombs (uC) e.g. 8 uC
  targetForce: number; // Newtons (N) e.g. 40 N
  kConstant: number; // 9.0 (normalized)
  correctDistance: number; // r = sqrt((k * q1 * q2) / F_target)
}

/**
 * Calculates distance r from Coulomb's Law: r = sqrt((k * q1 * q2) / F)
 */
export function calculateCoulombDistance(q1: number, q2: number, f: number, k: number = 90.0): number {
  return Number(Math.sqrt((k * q1 * q2) / f).toFixed(2));
}

/**
 * Generates 5 rounds for Volt Coulomb Tug
 */
export function generateVoltCoulombRounds(): VoltCoulombRoundData[] {
  const configs = [
    { charge1: 5.0, charge2: 8.0, targetForce: 40.0 }, // r = sqrt(3600 / 40) = 9.49 m
    { charge1: 10.0, charge2: 10.0, targetForce: 25.0 }, // r = sqrt(9000 / 25) = 18.97 m
    { charge1: 4.0, charge2: 6.0, targetForce: 60.0 }, // r = sqrt(2160 / 60) = 6.00 m
    { charge1: 12.0, charge2: 3.0, targetForce: 30.0 }, // r = sqrt(3240 / 30) = 10.39 m
    { charge1: 15.0, charge2: 20.0, targetForce: 75.0 }, // r = sqrt(27000 / 75) = 18.97 m
  ];

  return configs.map((cfg, idx) => {
    const correctR = calculateCoulombDistance(cfg.charge1, cfg.charge2, cfg.targetForce);
    return {
      id: `volt-coulomb-round-${idx + 1}`,
      conceptId: 203,
      conceptName: 'Coulomb Tug (Coulomb\'s Law)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: correctR,
      gravity: 9.8,
      correctVelocity: correctR,
      charge1: cfg.charge1,
      charge2: cfg.charge2,
      targetForce: cfg.targetForce,
      kConstant: 90.0,
      correctDistance: correctR,
    };
  });
}

/**
 * Evaluates user's typed distance input for Coulomb's Law
 */
export function evaluateVoltCoulombSubmission(
  targetR: number,
  userR: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diff = Math.abs(userR - targetR);
  const errorPercentage = (diff / targetR) * 100;

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
