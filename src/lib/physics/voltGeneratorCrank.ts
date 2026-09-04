import { RoundData, ScoreTier } from './types';

export interface VoltGeneratorRoundData extends RoundData {
  numberOfTurns: number; // N (e.g. 100 turns)
  magneticFieldB: number; // B (Teslas, e.g. 0.5 T)
  coilAreaA: number; // A (m^2, e.g. 0.05 m^2)
  circuitResistance: number; // R (Ohms, e.g. 10 Ω)
  targetVoltage: number; // V_target (e.g. 12 V)
  correctRPM: number; // Required RPM = (60 * V_target) / (2 * pi * N * B * A)
  quizOptions?: { id: string; text: string; isCorrect: boolean }[];
}

/**
 * Calculates induced peak voltage EMF from Faraday's Law: E_peak = N * B * A * omega
 * where omega = (2 * pi * RPM) / 60
 */
export function calculateInducedEMF(n: number, b: number, a: number, rpm: number): number {
  const omega = (2 * Math.PI * rpm) / 60;
  const emf = n * b * a * omega;
  return Number(emf.toFixed(2));
}

/**
 * Calculates required RPM to hit target voltage
 */
export function calculateRequiredRPM(n: number, b: number, a: number, vTarget: number): number {
  const omega = vTarget / (n * b * a);
  const rpm = (60 * omega) / (2 * Math.PI);
  return Math.round(rpm);
}

/**
 * Generates 5 rounds for Volt Generator Crank (Faraday's Law)
 */
export function generateVoltGeneratorRounds(): VoltGeneratorRoundData[] {
  const configs = [
    { numberOfTurns: 100, magneticFieldB: 0.5, coilAreaA: 0.04, circuitResistance: 5, targetVoltage: 12.0 }, // RPM = 286
    { numberOfTurns: 200, magneticFieldB: 0.4, coilAreaA: 0.05, circuitResistance: 8, targetVoltage: 24.0 }, // RPM = 286
    { numberOfTurns: 150, magneticFieldB: 0.6, coilAreaA: 0.03, circuitResistance: 10, targetVoltage: 15.0 }, // RPM = 318
    { numberOfTurns: 300, magneticFieldB: 0.5, coilAreaA: 0.05, circuitResistance: 12, targetVoltage: 36.0 }, // RPM = 229
    { numberOfTurns: 250, magneticFieldB: 0.8, coilAreaA: 0.06, circuitResistance: 6, targetVoltage: 48.0 }, // RPM = 191
  ];

  return configs.map((cfg, idx) => {
    const correctRPM = calculateRequiredRPM(cfg.numberOfTurns, cfg.magneticFieldB, cfg.coilAreaA, cfg.targetVoltage);

    return {
      id: `volt-generator-round-${idx + 1}`,
      conceptId: 205,
      conceptName: 'Generator Crank (Faraday\'s Law)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: correctRPM,
      gravity: 9.8,
      correctVelocity: correctRPM,
      numberOfTurns: cfg.numberOfTurns,
      magneticFieldB: cfg.magneticFieldB,
      coilAreaA: cfg.coilAreaA,
      circuitResistance: cfg.circuitResistance,
      targetVoltage: cfg.targetVoltage,
      correctRPM,
      quizOptions: [
        { id: 'a', text: 'The rate of change of magnetic flux increases', isCorrect: true },
        { id: 'b', text: 'The magnetic field disappears completely', isCorrect: false },
        { id: 'c', text: 'The coil stops experiencing induction', isCorrect: false },
      ],
    };
  });
}

/**
 * Evaluates generator crank RPM submission
 */
export function evaluateVoltGeneratorSubmission(
  targetRPM: number,
  userRPM: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diff = Math.abs(userRPM - targetRPM);
  const errorPercentage = (diff / targetRPM) * 100;

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
