import { RoundData, ScoreTier } from './types';

export interface FreeFallExperimentLog {
  attemptNum: number;
  scenario: 'HEAVY_VS_LIGHT' | 'UPWARD_LAUNCH' | 'VACUUM_CHAMBER' | 'PLANET_GRAVITY' | 'FIND_G';
  heightM: number;
  gravityMps2: number;
  predictedTimeSec: number;
  actualTimeSec: number;
  errorPercentage: number;
}

export interface FreeFallRoundData extends RoundData {
  heavyMass: number; // in kg (e.g. 5.0 kg)
  lightMass: number; // in kg (e.g. 0.5 kg)
  dropHeight: number; // in meters (h = 20.0 m)
  gravity: number; // 9.81 m/s^2
  correctFallTime: number; // t = sqrt(2h/g)
}

export interface FreeFallState {
  scenarioMode: 'HEAVY_VS_LIGHT' | 'UPWARD_LAUNCH' | 'VACUUM_CHAMBER' | 'PLANET_GRAVITY' | 'FIND_G';
  
  // Physical Parameters
  dropHeightM: number; // h0 (e.g. 20.0 m)
  initialVelocityMps: number; // v0 (e.g. 0 m/s or +12.0 m/s for upward launch)
  planetGravityMps2: number; // g (Earth 9.81, Moon 1.62, Mars 3.71, Jupiter 24.79)
  planetName: string;
  airResistanceOn: boolean;
  
  // Object A (Heavy / Sphere)
  massA: number; // 5.0 kg
  forceA: number; // FA = mA * g
  accelA: number; // aA = FA / mA = g
  
  // Object B (Light / Feather)
  massB: number; // 0.5 kg
  forceB: number; // FB = mB * g
  accelB: number; // aB = FB / mB = g
  
  // Calculated Telemetry
  calculatedFallTimeSec: number; // t = sqrt(2h/g)
  maxHeightM: number; // Peak height for upward launch
  timeToPeakSec: number; // v0 / g
  velocityAtPeakMps: number; // 0 m/s
  accelAtPeakMps2: number; // -g (downward!)
  
  // Predict & Reveal Workflow State
  predictedTimeSec: number | null;
  predictedFirstLanding: 'A' | 'B' | 'SAME' | null;
  predictedPeakAccel: number | null; // Predicted acceleration at top of trajectory
  predictionLocked: boolean;
  isDropReleased: boolean;
  isDropComplete: boolean;
  
  // Toggles & Visual Overlays
  showVectors: boolean;
  showForceInspector: boolean;
  showGraphs: boolean;
  cameraView: 'LAB_VIEW' | 'DROP_VIEW' | 'CLOSE_UP' | 'REPLAY';
  
  attemptCount: number;
  experimentLog: FreeFallExperimentLog[];
  statusText: string;
  misconceptionMessage: string;
  targetMet: boolean;
  isComplete: boolean;
}

/**
 * Calculates exact free fall time t = sqrt(2h/g)
 */
export function calculateFreeFallTime(height: number, gravity: number = 9.81): number {
  return Number(Math.sqrt((2 * height) / gravity).toFixed(2));
}

export function analyzeFreeFallState(
  scenarioMode: 'HEAVY_VS_LIGHT' | 'UPWARD_LAUNCH' | 'VACUUM_CHAMBER' | 'PLANET_GRAVITY' | 'FIND_G' = 'HEAVY_VS_LIGHT',
  dropHeightM: number = 20.0,
  initialVelocityMps: number = 0.0,
  planetGravityMps2: number = 9.81,
  planetName: string = 'Earth',
  airResistanceOn: boolean = false,
  massA: number = 5.0,
  massB: number = 0.5,
  predictedTimeSec: number | null = null,
  predictedFirstLanding: 'A' | 'B' | 'SAME' | null = 'SAME',
  predictedPeakAccel: number | null = null,
  predictionLocked: boolean = false,
  isDropReleased: boolean = false,
  isDropComplete: boolean = false,
  showVectors: boolean = true,
  showForceInspector: boolean = true,
  showGraphs: boolean = true,
  cameraView: 'LAB_VIEW' | 'DROP_VIEW' | 'CLOSE_UP' | 'REPLAY' = 'LAB_VIEW',
  attemptCount: number = 1,
  experimentLog: FreeFallExperimentLog[] = []
): FreeFallState {
  const g = planetGravityMps2;

  // 1. Force vs Acceleration Telemetry
  const forceA = Number((massA * g).toFixed(2));
  const forceB = Number((massB * g).toFixed(2));
  const accelA = g;
  const accelB = g;

  // 2. Trajectory Math
  let calculatedFallTimeSec = 0;
  let maxHeightM = dropHeightM;
  let timeToPeakSec = 0;
  const velocityAtPeakMps = 0;
  const accelAtPeakMps2 = -g;

  if (scenarioMode === 'UPWARD_LAUNCH') {
    timeToPeakSec = Number((initialVelocityMps / g).toFixed(2));
    const peakGain = Math.pow(initialVelocityMps, 2) / (2 * g);
    maxHeightM = Number((dropHeightM + peakGain).toFixed(2));
    calculatedFallTimeSec = Number((timeToPeakSec + Math.sqrt((2 * maxHeightM) / g)).toFixed(2));
  } else {
    calculatedFallTimeSec = Number(Math.sqrt((2 * dropHeightM) / g).toFixed(2));
  }

  // 3. Evaluation of Predictions & Misconceptions
  let targetMet = false;
  let misconceptionMessage = '';

  if (predictedTimeSec !== null) {
    const diff = Math.abs(predictedTimeSec - calculatedFallTimeSec);
    const errorPercentage = (diff / calculatedFallTimeSec) * 100;
    targetMet = errorPercentage <= 5.0;
  }

  if (scenarioMode === 'HEAVY_VS_LIGHT') {
    if (predictedFirstLanding === 'A') {
      misconceptionMessage = '💡 MISCONCEPTION DETECTED: You predicted heavy mass A falls faster. In ideal free fall, both experience identical acceleration g = 9.81 m/s²!';
    } else if (predictedFirstLanding === 'SAME') {
      misconceptionMessage = '✨ CORRECT REASONING! Mass does not change gravitational acceleration in ideal free fall. Both land at the exact same instant!';
    }
  } else if (scenarioMode === 'UPWARD_LAUNCH') {
    if (predictedPeakAccel === 0) {
      misconceptionMessage = '💡 MISCONCEPTION DETECTED: You predicted zero acceleration at the top. At the peak, velocity is zero (v = 0), BUT gravity never turns off! Acceleration is still -9.81 m/s² downward.';
    } else {
      misconceptionMessage = '✨ PERFECT PHYSICS! Acceleration remains constant (-9.81 m/s²) throughout the entire trajectory, even at the highest point.';
    }
  }

  const isComplete = predictionLocked && isDropComplete && targetMet;

  // Status Text Feedback
  let statusText = 'GRAVITY LAB READY • PREDICT FALL TIME & RELEASE DROP!';
  if (isComplete) {
    statusText = `🎉 EXPERIMENT VERIFIED! Predicted: ${predictedTimeSec}s | Actual: ${calculatedFallTimeSec}s (+500 XP)!`;
  } else if (isDropComplete && predictedTimeSec !== null) {
    statusText = `🔬 DROP COMPLETE! Predicted: ${predictedTimeSec}s vs Actual: ${calculatedFallTimeSec}s.`;
  } else if (isDropReleased) {
    statusText = `🚀 FREE FALL IN PROGRESS • Motion sensors & timing gates recording acceleration...`;
  } else {
    statusText = `⏸ DROP IMMINENT • Tower Height: ${dropHeightM}m | Gravity: ${g} m/s² (${planetName}).`;
  }

  return {
    scenarioMode,
    dropHeightM,
    initialVelocityMps,
    planetGravityMps2: g,
    planetName,
    airResistanceOn,
    massA,
    forceA,
    accelA,
    massB,
    forceB,
    accelB,
    calculatedFallTimeSec,
    maxHeightM,
    timeToPeakSec,
    velocityAtPeakMps,
    accelAtPeakMps2,
    predictedTimeSec,
    predictedFirstLanding,
    predictedPeakAccel,
    predictionLocked,
    isDropReleased,
    isDropComplete,
    showVectors,
    showForceInspector,
    showGraphs,
    cameraView,
    attemptCount,
    experimentLog,
    statusText,
    misconceptionMessage,
    targetMet,
    isComplete,
  };
}

export function generateFreeFallRounds(): FreeFallRoundData[] {
  return [
    {
      id: 'free-fall-round-1',
      conceptId: 104,
      conceptName: 'Free Fall / Gravity Misconception',
      roundNumber: 1,
      totalRounds: 1,
      height: 20.0,
      distance: 2.02,
      gravity: 9.81,
      correctVelocity: 2.02,
      heavyMass: 5.0,
      lightMass: 0.5,
      dropHeight: 20.0,
      correctFallTime: 2.02,
    },
  ];
}

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
