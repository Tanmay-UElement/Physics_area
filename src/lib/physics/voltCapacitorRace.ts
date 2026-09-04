import { RoundData, ScoreTier } from './types';

export interface VoltCapacitorRoundData extends RoundData {
  resistance: number; // K-Ohms (R) e.g. 10 kΩ
  capacitance: number; // micro-Farads (C) e.g. 100 uF
  sourceVoltage: number; // Volts (V0) e.g. 12 V
  targetVoltage: number; // Volts (V) e.g. 7.58 V
  timeConstant: number; // tau = R * C (in seconds)
  correctTime: number; // t = -RC * ln(1 - V/V0)
}

/**
 * Calculates RC charging time: t = -RC * ln(1 - V/V0)
 * Note: R in kΩ (10^3), C in uF (10^-6) -> tau = R * C * 10^-3 seconds
 */
export function calculateRCChargingTime(rK: number, cUF: number, v0: number, vTarget: number): number {
  const tau = (rK * 1000) * (cUF * 1e-6); // tau in seconds
  const ratio = 1 - (vTarget / v0);
  const timeSec = -tau * Math.log(ratio);
  return Number(timeSec.toFixed(2));
}

/**
 * Generates 5 rounds for Volt Capacitor Race
 */
export function generateVoltCapacitorRounds(): VoltCapacitorRoundData[] {
  const configs = [
    { resistance: 10, capacitance: 100, sourceVoltage: 12, targetVoltage: 7.58 }, // tau = 1.0s, t = 1.00 s
    { resistance: 20, capacitance: 50, sourceVoltage: 24, targetVoltage: 15.16 }, // tau = 1.0s, t = 1.00 s
    { resistance: 15, capacitance: 200, sourceVoltage: 10, targetVoltage: 6.32 }, // tau = 3.0s, t = 3.00 s
    { resistance: 50, capacitance: 100, sourceVoltage: 5, targetVoltage: 3.16 }, // tau = 5.0s, t = 3.47 s
    { resistance: 100, capacitance: 20, sourceVoltage: 50, targetVoltage: 31.6 }, // tau = 2.0s, t = 2.00 s
  ];

  return configs.map((cfg, idx) => {
    const correctT = calculateRCChargingTime(cfg.resistance, cfg.capacitance, cfg.sourceVoltage, cfg.targetVoltage);
    const tau = (cfg.resistance * 1000) * (cfg.capacitance * 1e-6);

    return {
      id: `volt-capacitor-round-${idx + 1}`,
      conceptId: 202,
      conceptName: 'Capacitor Race (RC Charging)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: correctT,
      gravity: 9.8,
      correctVelocity: correctT,
      resistance: cfg.resistance,
      capacitance: cfg.capacitance,
      sourceVoltage: cfg.sourceVoltage,
      targetVoltage: cfg.targetVoltage,
      timeConstant: Number(tau.toFixed(2)),
      correctTime: correctT,
    };
  });
}

/**
 * Evaluates RC charging time submission
 */
export function evaluateVoltCapacitorSubmission(
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
