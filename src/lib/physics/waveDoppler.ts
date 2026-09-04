import { RoundData, ScoreTier } from './types';

export interface WaveDopplerRoundData extends RoundData {
  baseFrequencyHz: number;   // f (e.g. 700 Hz)
  sourceSpeedMps: number;    // v_s (e.g. 20 m/s)
  playerSpeedMps: number;    // v_o (e.g. 10 m/s)
  soundSpeedMps: number;     // v (e.g. 343 m/s)
  initialDistanceM: number;  // Initial separation distance (e.g. 120 m)
}

export interface DopplerObservation {
  id: number;
  timestampSec: number;
  distanceM: number;
  relVelocityMps: number;
  observedFreqHz: number;
  phase: 'APPROACHING' | 'CLOSEST' | 'RECEDING';
}

export interface FreqGraphPoint {
  timeSec: number;
  freqHz: number;
}

export interface DopplerState {
  baseFrequencyHz: number;
  sourceSpeedMps: number;
  playerSpeedMps: number;
  soundSpeedMps: number;
  
  sourceX: number; // Position in meters along road [0 - 240]
  playerX: number; // Position in meters along road [0 - 240]
  distanceM: number;
  relRadialSpeedMps: number;
  phase: 'APPROACHING' | 'CLOSEST' | 'RECEDING';
  
  observedFreqHz: number;
  wavelengthAppM: number; // Spacing in front
  wavelengthRecM: number; // Spacing behind
  
  // Camera & Time Scale
  cameraMode: 'OVERVIEW' | 'FOLLOW_SIREN' | 'FOLLOW_PLAYER';
  simSpeedScale: number; // 1.0, 0.5, 0.25
  
  predictedFreqHz: number | null;
  predictionLocked: boolean;
  predictionErrorHz: number | null;
  predictionAccuracyPct: number | null;
  
  freqHistoryGraph: FreqGraphPoint[];
  observationLog: DopplerObservation[];
  statusText: string;
  isComplete: boolean;
}

export const SPECTRUM_BINS = [500, 600, 700, 800, 900];

/**
 * Calculates Doppler Shift: f' = f * (v ± v_o) / (v ∓ v_s)
 */
export function analyzeDopplerState(
  baseFreqHz: number = 700,
  sourceSpeedMps: number = 20,
  playerSpeedMps: number = 10,
  sourceX: number = 20,
  playerX: number = 140,
  soundSpeedMps: number = 343,
  cameraMode: 'OVERVIEW' | 'FOLLOW_SIREN' | 'FOLLOW_PLAYER' = 'OVERVIEW',
  simSpeedScale: number = 1.0,
  predictedFreqHz: number | null = null,
  predictionLocked: boolean = false,
  freqHistoryGraph: FreqGraphPoint[] = [],
  observationLog: DopplerObservation[] = []
): DopplerState {
  const distanceM = Math.abs(playerX - sourceX);
  const isSourceBehindPlayer = sourceX > playerX;

  let phase: 'APPROACHING' | 'CLOSEST' | 'RECEDING' = 'APPROACHING';
  if (distanceM <= 6.0) {
    phase = 'CLOSEST';
  } else if (isSourceBehindPlayer) {
    phase = 'RECEDING';
  } else {
    phase = 'APPROACHING';
  }

  // Relative Radial Speed along road
  let relRadialSpeedMps = 0;
  if (phase === 'APPROACHING') {
    relRadialSpeedMps = sourceSpeedMps + playerSpeedMps;
  } else if (phase === 'RECEDING') {
    relRadialSpeedMps = sourceSpeedMps - playerSpeedMps;
  }

  let observedFreqHz = baseFreqHz;
  if (phase === 'APPROACHING') {
    // Both moving toward each other: f' = f * (v + v_o) / (v - v_s)
    observedFreqHz = Number((baseFreqHz * ((soundSpeedMps + playerSpeedMps) / (soundSpeedMps - sourceSpeedMps))).toFixed(1));
  } else if (phase === 'RECEDING') {
    // Both moving away: f' = f * (v - v_o) / (v + v_s)
    observedFreqHz = Number((baseFreqHz * ((soundSpeedMps - playerSpeedMps) / (soundSpeedMps + sourceSpeedMps))).toFixed(1));
  } else {
    // At closest approach point
    observedFreqHz = baseFreqHz;
  }

  // Wavefront spacing
  const wavelengthAppM = Number(((soundSpeedMps - sourceSpeedMps) / baseFreqHz).toFixed(3));
  const wavelengthRecM = Number(((soundSpeedMps + sourceSpeedMps) / baseFreqHz).toFixed(3));

  let predictionErrorHz: number | null = null;
  let predictionAccuracyPct: number | null = null;
  let isComplete = false;

  if (predictionLocked && predictedFreqHz !== null) {
    predictionErrorHz = Number(Math.abs(predictedFreqHz - observedFreqHz).toFixed(1));
    predictionAccuracyPct = Math.max(0, Math.min(100, Math.round(100 - predictionErrorHz * 2)));
    if (predictionErrorHz <= 18.0) {
      isComplete = true;
    }
  }

  let statusText = 'CHASE THE SIREN VEHICLE AND OBSERVE THE DOPPLER SHIFT!';
  if (phase === 'APPROACHING') {
    statusText = `🔵 SIREN APPROACHING: Distance decreasing (${distanceM.toFixed(1)} m). Wavefronts compressed in front! Frequency: ${observedFreqHz} Hz ↑`;
  } else if (phase === 'CLOSEST') {
    statusText = `⚡ CLOSEST APPROACH (MEASUREMENT ZONE): Rapid pitch transition as siren passes listener!`;
  } else {
    statusText = `🟣 SIREN RECEDING: Distance increasing (${distanceM.toFixed(1)} m). Wavefronts expanding behind! Frequency: ${observedFreqHz} Hz ↓`;
  }

  if (predictionLocked) {
    if (isComplete) {
      statusText = `🎯 DOPPLER PREDICTION MATCHED! Error: ${predictionErrorHz} Hz (${predictionAccuracyPct}% Accuracy). +500 XP!`;
    } else {
      statusText = `⚠️ PREDICTION DIFFERENCE: Error ${predictionErrorHz} Hz. Recalculate using f' = f(v ± v_o)/(v ∓ v_s)!`;
    }
  }

  return {
    baseFrequencyHz: baseFreqHz,
    sourceSpeedMps,
    playerSpeedMps,
    soundSpeedMps,
    sourceX,
    playerX,
    distanceM,
    relRadialSpeedMps,
    phase,
    observedFreqHz,
    wavelengthAppM,
    wavelengthRecM,
    cameraMode,
    simSpeedScale,
    predictedFreqHz,
    predictionLocked,
    predictionErrorHz,
    predictionAccuracyPct,
    freqHistoryGraph,
    observationLog,
    statusText,
    isComplete,
  };
}

export function generateWaveDopplerRound(): WaveDopplerRoundData {
  return {
    id: 'wave-doppler-game-2',
    conceptId: 302,
    conceptName: 'Doppler Chase (Doppler Shift)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 120,
    gravity: 9.8,
    correctVelocity: 1,
    baseFrequencyHz: 700,
    sourceSpeedMps: 20,
    playerSpeedMps: 10,
    soundSpeedMps: 343,
    initialDistanceM: 120,
  };
}

export function evaluateDopplerSubmission(state: DopplerState): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  if (state.isComplete) {
    return { tier: 'hit', errorPercentage: 0, xpEarned: 500 };
  } else if ((state.predictionAccuracyPct || 0) >= 70) {
    return { tier: 'close', errorPercentage: 15, xpEarned: 300 };
  } else {
    return { tier: 'miss', errorPercentage: 50, xpEarned: 50 };
  }
}
