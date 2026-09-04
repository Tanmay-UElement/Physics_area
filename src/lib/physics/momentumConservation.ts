import { RoundData, ScoreTier } from './types';

export interface MomentumAttemptLog {
  attemptNum: number;
  massA: number;
  velA: number;
  massB: number;
  velB: number;
  predictedVf: number;
  actualVf: number;
  errorPercentage: number;
}

export interface MomentumRoundData extends RoundData {
  mass1: number; // in kg (e.g. 4.0 kg)
  velocity1: number; // in m/s (e.g. +3.0 m/s)
  mass2: number; // in kg (e.g. 1.5 kg)
  velocity2: number; // in m/s (e.g. -1.0 m/s)
  totalMomentum: number; // P_total = mA*vA + mB*vB
  correctFinalVelocity: number; // vf = P_total / (mA + mB)
}

export interface MomentumState {
  scenarioMode: 'LAB_TRACK' | 'SPACECRAFT_DOCKING' | 'ZERO_MOMENTUM';
  
  // Physical Cart Parameters (Unequal Mass)
  massA: number; // kg (e.g., 4.0 kg)
  velA: number; // m/s (e.g., +3.0 m/s)
  massB: number; // kg (e.g., 1.5 kg)
  velB: number; // m/s (e.g., -1.0 m/s)
  
  // Physics Calculated Telemetry
  pA: number; // mA * vA
  pB: number; // mB * vB
  pTotal: number; // pA + pB
  totalMass: number; // mA + mB
  actualVf: number; // pTotal / totalMass
  
  keInitial: number; // 0.5 * mA * vA^2 + 0.5 * mB * vB^2
  keFinal: number; // 0.5 * (mA + mB) * vf^2
  keLost: number; // keInitial - keFinal
  
  // Predict & Reveal Workflow State
  predictedVf: number | null;
  predictionLocked: boolean;
  isCollisionReleased: boolean;
  isCollisionComplete: boolean;
  
  // Toggles & Camera Overlays
  showMomentumVectors: boolean;
  showSystemBoundary: boolean;
  showEnergyLedger: boolean;
  cameraView: 'LAB_VIEW' | 'TRACK_VIEW' | 'CLOSE_UP' | 'REPLAY';
  simSpeed: number; // 0.25, 0.5, 1.0
  
  attemptCount: number;
  experimentLog: MomentumAttemptLog[];
  statusText: string;
  targetMet: boolean;
  isComplete: boolean;
}

/**
 * Calculates final inelastic velocity: vf = (mA * vA + mB * vB) / (mA + mB)
 */
export function calculateInelasticFinalVelocity(mA: number, vA: number, mB: number, vB: number = 0): number {
  const pTotal = mA * vA + mB * vB;
  const totalMass = mA + mB;
  return Number((pTotal / totalMass).toFixed(2));
}

export function analyzeMomentumState(
  scenarioMode: 'LAB_TRACK' | 'SPACECRAFT_DOCKING' | 'ZERO_MOMENTUM' = 'LAB_TRACK',
  massA: number = 4.0,
  velA: number = 3.0,
  massB: number = 1.5,
  velB: number = -1.0,
  predictedVf: number | null = null,
  predictionLocked: boolean = false,
  isCollisionReleased: boolean = false,
  isCollisionComplete: boolean = false,
  showMomentumVectors: boolean = true,
  showSystemBoundary: boolean = true,
  showEnergyLedger: boolean = true,
  cameraView: 'LAB_VIEW' | 'TRACK_VIEW' | 'CLOSE_UP' | 'REPLAY' = 'LAB_VIEW',
  simSpeed: number = 1.0,
  attemptCount: number = 1,
  experimentLog: MomentumAttemptLog[] = []
): MomentumState {
  // 1. Calculate Vector Momentum & Velocities
  const pA = Number((massA * velA).toFixed(2));
  const pB = Number((massB * velB).toFixed(2));
  const pTotal = Number((pA + pB).toFixed(2));
  const totalMass = Number((massA + massB).toFixed(2));
  const actualVf = Number((pTotal / totalMass).toFixed(2));

  // 2. Calculate Kinetic Energy Breakdown
  const keA = 0.5 * massA * Math.pow(velA, 2);
  const keB = 0.5 * massB * Math.pow(velB, 2);
  const keInitial = Number((keA + keB).toFixed(2));
  const keFinal = Number((0.5 * totalMass * Math.pow(actualVf, 2)).toFixed(2));
  const keLost = Number((keInitial - keFinal).toFixed(2));

  // 3. Evaluation of Prediction
  let targetMet = false;
  let errorPercentage = 100;

  if (predictedVf !== null) {
    const diff = Math.abs(predictedVf - actualVf);
    const denom = Math.max(0.5, Math.abs(actualVf));
    errorPercentage = Number(((diff / denom) * 100).toFixed(2));
    targetMet = errorPercentage <= 5.0;
  }

  const isComplete = predictionLocked && isCollisionComplete && targetMet;

  // Status Text Feedback
  let statusText = 'COLLISION LAB READY • CALCULATE MOMENTUM, LOCK PREDICTION & RELEASE COLLISION!';
  if (isComplete) {
    statusText = `🎉 PREDICTION VERIFIED! Predicted: ${predictedVf} m/s | Actual: ${actualVf} m/s (Error: ${errorPercentage}%)!`;
  } else if (isCollisionComplete && predictedVf !== null) {
    statusText = `🔬 COLLISION REVEALED! Predicted: ${predictedVf} m/s vs Actual: ${actualVf} m/s (Error: ${errorPercentage}%).`;
  } else if (predictionLocked) {
    statusText = `🔒 PREDICTION SEALED (${predictedVf} m/s)! Click 'RELEASE COLLISION' to initiate experiment.`;
  } else {
    statusText = `⏸ COLLISION IMMINENT • Cart A (${massA}kg @ ${velA}m/s) & Cart B (${massB}kg @ ${velB}m/s).`;
  }

  return {
    scenarioMode,
    massA,
    velA,
    massB,
    velB,
    pA,
    pB,
    pTotal,
    totalMass,
    actualVf,
    keInitial,
    keFinal,
    keLost,
    predictedVf,
    predictionLocked,
    isCollisionReleased,
    isCollisionComplete,
    showMomentumVectors,
    showSystemBoundary,
    showEnergyLedger,
    cameraView,
    simSpeed,
    attemptCount,
    experimentLog,
    statusText,
    targetMet,
    isComplete,
  };
}

/**
 * Generates initial round data
 */
export function generateMomentumRounds(): MomentumRoundData[] {
  return [
    {
      id: 'momentum-round-1',
      conceptId: 106,
      conceptName: 'Momentum Conservation (Unequal Mass)',
      roundNumber: 1,
      totalRounds: 1,
      height: 0,
      distance: 1.86,
      gravity: 9.8,
      correctVelocity: 1.86,
      mass1: 4.0,
      velocity1: 3.0,
      mass2: 1.5,
      velocity2: -1.0,
      totalMomentum: 10.5,
      correctFinalVelocity: 1.86,
    },
  ];
}

export function evaluateMomentumSubmission(
  targetV: number,
  userV: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diff = Math.abs(userV - targetV);
  const denom = Math.max(0.5, Math.abs(targetV));
  const errorPercentage = (diff / denom) * 100;

  let tier: ScoreTier;
  let xpEarned: number;

  if (errorPercentage <= 5.0) {
    tier = 'hit';
    xpEarned = 500;
  } else if (errorPercentage <= 15.0) {
    tier = 'close';
    xpEarned = 300;
  } else {
    tier = 'miss';
    xpEarned = 50;
  }

  return {
    tier,
    errorPercentage: Number(errorPercentage.toFixed(2)),
    xpEarned,
  };
}
