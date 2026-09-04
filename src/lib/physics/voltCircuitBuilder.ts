import { RoundData, ScoreTier } from './types';

export interface VoltCircuitRoundData extends RoundData {
  voltage: number; // Volts (V) e.g. 12V
  targetCurrent: number; // Amps (A) e.g. 2A
  maxSafeCurrent: number; // Fuse limit e.g. 3A
  correctResistance: number; // R = V / I_target (Ohms)
}

/**
 * Calculates required resistance for target current: R = V / I
 */
export function calculateRequiredResistance(v: number, i: number): number {
  return Number((v / i).toFixed(2));
}

/**
 * Generates 5 rounds for Volt Circuit Builder (Ohm's Law)
 */
export function generateVoltCircuitRounds(): VoltCircuitRoundData[] {
  const configs = [
    { voltage: 12, targetCurrent: 2.0, maxSafeCurrent: 3.5 }, // R = 6.0 Ohms
    { voltage: 24, targetCurrent: 3.0, maxSafeCurrent: 5.0 }, // R = 8.0 Ohms
    { voltage: 120, targetCurrent: 0.5, maxSafeCurrent: 1.0 }, // R = 240.0 Ohms
    { voltage: 9, targetCurrent: 0.03, maxSafeCurrent: 0.05 }, // R = 300.0 Ohms
    { voltage: 48, targetCurrent: 1.2, maxSafeCurrent: 2.0 }, // R = 40.0 Ohms
  ];

  return configs.map((cfg, idx) => {
    const correctR = calculateRequiredResistance(cfg.voltage, cfg.targetCurrent);
    return {
      id: `volt-circuit-round-${idx + 1}`,
      conceptId: 201,
      conceptName: 'Circuit Builder (Ohm\'s Law)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: correctR,
      gravity: 9.8,
      correctVelocity: correctR,
      voltage: cfg.voltage,
      targetCurrent: cfg.targetCurrent,
      maxSafeCurrent: cfg.maxSafeCurrent,
      correctResistance: correctR,
    };
  });
}

/**
 * Evaluates user's typed resistance input
 */
export function evaluateVoltCircuitSubmission(
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
