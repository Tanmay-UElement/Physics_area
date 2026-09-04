import { RoundData, ScoreTier } from './types';

export interface VoltMagneticRoundData extends RoundData {
  charge: number; // Coulombs (q) e.g. 2.0 C
  mass: number; // kg (m) e.g. 1.0 kg
  particleSpeed: number; // m/s (v) e.g. 20 m/s
  magneticField: number; // Tesla (B) e.g. 4.0 T
  correctRadius: number; // r = (m * v) / (q * B)
}

/**
 * Calculates cyclotron radius for Lorentz force deflection: r = (m * v) / (q * B)
 */
export function calculateLorentzRadius(m: number, v: number, q: number, b: number): number {
  return Number(((m * v) / (q * b)).toFixed(2));
}

/**
 * Generates 5 rounds for Volt Magnetic Maze
 */
export function generateVoltMagneticRounds(): VoltMagneticRoundData[] {
  const configs = [
    { charge: 2.0, mass: 1.0, particleSpeed: 24.0, magneticField: 3.0 }, // r = 24 / 6 = 4.00 m
    { charge: 1.0, mass: 2.0, particleSpeed: 30.0, magneticField: 5.0 }, // r = 60 / 5 = 12.00 m
    { charge: 3.0, mass: 1.5, particleSpeed: 40.0, magneticField: 2.0 }, // r = 60 / 6 = 10.00 m
    { charge: 4.0, mass: 2.0, particleSpeed: 50.0, magneticField: 5.0 }, // r = 100 / 20 = 5.00 m
    { charge: 0.5, mass: 1.0, particleSpeed: 25.0, magneticField: 2.5 }, // r = 25 / 1.25 = 20.00 m
  ];

  return configs.map((cfg, idx) => {
    const correctR = calculateLorentzRadius(cfg.mass, cfg.particleSpeed, cfg.charge, cfg.magneticField);
    return {
      id: `volt-magnetic-round-${idx + 1}`,
      conceptId: 204,
      conceptName: 'Magnetic Maze (Lorentz Force)',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: correctR,
      gravity: 9.8,
      correctVelocity: correctR,
      charge: cfg.charge,
      mass: cfg.mass,
      particleSpeed: cfg.particleSpeed,
      magneticField: cfg.magneticField,
      correctRadius: correctR,
    };
  });
}

/**
 * Evaluates Lorentz radius submission
 */
export function evaluateVoltMagneticSubmission(
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
