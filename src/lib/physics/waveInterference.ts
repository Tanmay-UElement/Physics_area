import { RoundData, ScoreTier } from './types';

export interface WaveSource {
  id: string;
  name: string;
  x: number; // position in meters [-3.0, 3.0]
  y: number; // position in meters [0.2, 4.0]
  frequencyHz: number; // f (e.g. 700 Hz)
  amplitude: number; // A (0.0 to 1.0)
  phaseDeg: number; // phi (-180 to 180)
  enabled: boolean;
  isLockedPosition?: boolean;
}

export interface SensorTarget {
  id: string;
  name: string;
  x: number;
  y: number;
  mode: 'SILENCE' | 'AMPLIFY';
  targetDb: number;
  initialDb: number;
}

export interface InterferenceAttemptLog {
  attemptNum: number;
  phaseDeg: number;
  speakerBPosM: string;
  pathDiffM: number;
  measuredDb: number;
  predictedDb?: number;
  resultType: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | 'PARTIAL';
}

export interface WaveInterferenceRoundData extends RoundData {
  soundSpeedMps: number;
  defaultFrequencyHz: number;
  sources: WaveSource[];
  sensorTargets: SensorTarget[];
}

export interface InterferenceState {
  mode: 'SOUND' | 'LIGHT';
  puzzleMode: 'NOISE_CANCELLATION' | 'SIGNAL_AMPLIFICATION' | 'POSITION_PUZZLE';
  viewSourceMode: 'BOTH' | 'SOURCE_A' | 'SOURCE_B' | 'RESULTANT';
  
  soundSpeedMps: number;
  sourceA: WaveSource;
  sourceB: WaveSource;
  
  activeSensor: SensorTarget;
  sensorTargets: SensorTarget[];
  
  // Physics Inspector Telemetry
  pathA: number; // r1 distance from Source A to Mic
  pathB: number; // r2 distance from Source B to Mic
  pathDiffM: number; // delta L = |r2 - r1|
  wavelengthM: number; // lambda = v / f
  pathPhaseDeg: number; // delta phi_path = (2*pi*deltaL / lambda) in deg
  totalPhaseDiffDeg: number; // delta phi_total = (phiB - phiA + pathPhase) in deg
  
  resultantAmp: number; // A_total superposition
  measuredDb: number; // Real-time Sound Pressure Level (SPL)
  targetMet: boolean;
  interferenceType: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | 'PARTIAL';
  
  // Double Slit Optics Mode
  slitSeparationMm: number;
  screenDistanceM: number;
  lightWavelengthNm: number;
  fringeSpacingMm: number;
  
  // Workflow & Prediction State
  predictedDb: number | null;
  predictedType: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | null;
  predictionLocked: boolean;
  isEmittingWaves: boolean;
  showPhysicsInspector: boolean;
  
  attemptCount: number;
  experimentLog: InterferenceAttemptLog[];
  statusText: string;
  isComplete: boolean;
}

/**
 * Superposition principle calculation:
 * y_total(x, y, t) = y1(r1, t) + y2(r2, t)
 * y1 = A1 * sin(k * r1 - omega * t + phi1)
 * y2 = A2 * sin(k * r2 - omega * t + phi2)
 */
export function calculateSuperposition(
  x: number,
  y: number,
  tSec: number,
  sA: WaveSource,
  sB: WaveSource,
  soundSpeedMps: number = 343
): { y1: number; y2: number; yTotal: number; r1: number; r2: number } {
  const r1 = Math.hypot(x - sA.x, y - sA.y);
  const r2 = Math.hypot(x - sB.x, y - sB.y);

  const lambda = soundSpeedMps / (sA.frequencyHz || 700);
  const k = (2 * Math.PI) / lambda;
  const omega = 2 * Math.PI * sA.frequencyHz;

  const phi1Rad = (sA.phaseDeg * Math.PI) / 180;
  const phi2Rad = (sB.phaseDeg * Math.PI) / 180;

  const y1 = sA.enabled ? sA.amplitude * Math.sin(k * r1 - omega * tSec + phi1Rad) : 0;
  const y2 = sB.enabled ? sB.amplitude * Math.sin(k * r2 - omega * tSec + phi2Rad) : 0;

  return {
    y1,
    y2,
    yTotal: y1 + y2,
    r1,
    r2,
  };
}

export function analyzeInterferenceState(
  mode: 'SOUND' | 'LIGHT' = 'SOUND',
  puzzleMode: 'NOISE_CANCELLATION' | 'SIGNAL_AMPLIFICATION' | 'POSITION_PUZZLE' = 'NOISE_CANCELLATION',
  viewSourceMode: 'BOTH' | 'SOURCE_A' | 'SOURCE_B' | 'RESULTANT' = 'BOTH',
  sourceA: WaveSource,
  sourceB: WaveSource,
  activeSensor: SensorTarget,
  sensorTargets: SensorTarget[] = [],
  slitSeparationMm: number = 0.20,
  screenDistanceM: number = 2.0,
  lightWavelengthNm: number = 650,
  predictedDb: number | null = null,
  predictedType: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | null = null,
  predictionLocked: boolean = false,
  isEmittingWaves: boolean = true,
  showPhysicsInspector: boolean = false,
  attemptCount: number = 1,
  experimentLog: InterferenceAttemptLog[] = []
): InterferenceState {
  const soundSpeedMps = 343;

  // 1. Calculate Exact Distance from Source A and Source B to Microphone Target
  const r1 = Math.hypot(activeSensor.x - sourceA.x, activeSensor.y - sourceA.y);
  const r2 = Math.hypot(activeSensor.y - sourceB.y, activeSensor.x - sourceB.x); // hypot(x - xB, y - yB)
  const pathA = Math.hypot(activeSensor.x - sourceA.x, activeSensor.y - sourceA.y);
  const pathB = Math.hypot(activeSensor.x - sourceB.x, activeSensor.y - sourceB.y);
  const pathDiffM = Math.abs(pathB - pathA);

  const freq = sourceA.frequencyHz || 700;
  const wavelengthM = soundSpeedMps / freq;

  // Propagation phase delta = 2 * pi * delta_L / lambda
  const pathPhaseRad = ((2 * Math.PI * pathDiffM) / wavelengthM) % (2 * Math.PI);
  const pathPhaseDeg = Number(((pathPhaseRad * 180) / Math.PI).toFixed(1));

  // Source phase delta = phiB - phiA
  const sourcePhaseDiffRad = ((sourceB.phaseDeg - sourceA.phaseDeg) * Math.PI) / 180;

  // Total phase difference at microphone arrival: delta_phi_total = phiB - phiA + (k * r2 - k * r1)
  let totalPhaseRad = (sourcePhaseDiffRad + (2 * Math.PI * (pathB - pathA)) / wavelengthM) % (2 * Math.PI);
  if (totalPhaseRad < 0) totalPhaseRad += 2 * Math.PI;
  const totalPhaseDiffDeg = Number(((totalPhaseRad * 180) / Math.PI).toFixed(1));

  // Phasor Superposition Resultant Amplitude: A_total = sqrt(A1^2 + A2^2 + 2*A1*A2*cos(delta_phi_total))
  const A1 = sourceA.enabled ? sourceA.amplitude : 0;
  const A2 = sourceB.enabled ? sourceB.amplitude : 0;

  const resultantAmp = Number(
    Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(totalPhaseRad)).toFixed(2)
  );

  // Sound Pressure Level (SPL) Decibel Calculation (Base 92 dB at max amplitude 2.0)
  const normalizedAmp = Math.max(0.005, resultantAmp / 2.0);
  const measuredDb = Math.round(92 + 20 * Math.log10(normalizedAmp));

  // Interference Classification
  let interferenceType: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | 'PARTIAL' = 'PARTIAL';
  if (resultantAmp >= 1.6 || totalPhaseDiffDeg <= 30 || totalPhaseDiffDeg >= 330) {
    interferenceType = 'CONSTRUCTIVE';
  } else if (resultantAmp <= 0.35 || (totalPhaseDiffDeg >= 150 && totalPhaseDiffDeg <= 210)) {
    interferenceType = 'DESTRUCTIVE';
  }

  // Check Target Objectives
  let targetMet = false;
  if (puzzleMode === 'NOISE_CANCELLATION' && measuredDb <= activeSensor.targetDb) {
    targetMet = true;
  } else if (puzzleMode === 'SIGNAL_AMPLIFICATION' && measuredDb >= activeSensor.targetDb) {
    targetMet = true;
  } else if (puzzleMode === 'POSITION_PUZZLE' && measuredDb <= activeSensor.targetDb) {
    targetMet = true;
  }

  const isComplete = targetMet;

  // Double Slit Optics Calculation
  const lambdaM = lightWavelengthNm * 1e-9;
  const dM = slitSeparationMm * 1e-3;
  const fringeSpacingMm = Number(((lambdaM * screenDistanceM * 1000) / dM).toFixed(2));

  let statusText = 'ACOUSTIC LABORATORY READY • EXPERIMENT AND SOLVE INTERFERENCE PUZZLE!';
  if (mode === 'LIGHT') {
    statusText = `🔬 DOUBLE-SLIT OPTICS: Slit separation d=${slitSeparationMm}mm, Screen D=${screenDistanceM}m. Fringe spacing Δy=${fringeSpacingMm}mm.`;
  } else if (isComplete) {
    statusText = `🎯 PUZZLE SOLVED! Noise level reduced to ${measuredDb} dB (${interferenceType} CANCELLATION ACHIEVED). +500 XP!`;
  } else if (puzzleMode === 'NOISE_CANCELLATION') {
    statusText = `🎙 NOISE CANCELLATION PUZZLE: Current noise ${measuredDb} dB. Goal: Reduce below ${activeSensor.targetDb} dB using destructive interference!`;
  } else if (puzzleMode === 'POSITION_PUZZLE') {
    statusText = `📍 POSITION REPOSITIONING PUZZLE: Phase is locked! Drag Speaker B to a position where path difference creates cancellation!`;
  } else {
    statusText = `🎙 SIGNAL AMPLIFICATION PUZZLE: Current level ${measuredDb} dB. Goal: Amplify above ${activeSensor.targetDb} dB using constructive interference!`;
  }

  return {
    mode,
    puzzleMode,
    viewSourceMode,
    soundSpeedMps,
    sourceA,
    sourceB,
    activeSensor,
    sensorTargets,
    pathA: Number(pathA.toFixed(2)),
    pathB: Number(pathB.toFixed(2)),
    pathDiffM: Number(pathDiffM.toFixed(3)),
    wavelengthM: Number(wavelengthM.toFixed(3)),
    pathPhaseDeg,
    totalPhaseDiffDeg,
    resultantAmp,
    measuredDb,
    targetMet,
    interferenceType,
    slitSeparationMm,
    screenDistanceM,
    lightWavelengthNm,
    fringeSpacingMm,
    predictedDb,
    predictedType,
    predictionLocked,
    isEmittingWaves,
    showPhysicsInspector,
    attemptCount,
    experimentLog,
    statusText,
    isComplete,
  };
}

export function generateWaveInterferenceRound(): WaveInterferenceRoundData {
  return {
    id: 'wave-interference-game-3',
    conceptId: 303,
    conceptName: 'Wave Interference Arena (Interference Puzzle)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 120,
    gravity: 9.8,
    correctVelocity: 1,
    soundSpeedMps: 343,
    defaultFrequencyHz: 700,
    sources: [
      {
        id: 'source-a',
        name: 'Speaker A (Noise Source)',
        x: -1.5,
        y: 0.8,
        frequencyHz: 700,
        amplitude: 1.0,
        phaseDeg: 0,
        enabled: true,
      },
      {
        id: 'source-b',
        name: 'Speaker B (Cancellation Speaker)',
        x: 1.5,
        y: 0.8,
        frequencyHz: 700,
        amplitude: 1.0,
        phaseDeg: 0,
        enabled: true,
      },
    ],
    sensorTargets: [
      {
        id: 'sensor-1',
        name: 'Red Microphone (Engineer Workstation)',
        x: 0.0,
        y: 2.8,
        mode: 'SILENCE',
        targetDb: 55,
        initialDb: 92,
      },
      {
        id: 'sensor-2',
        name: 'Blue Microphone (Signal Receiver)',
        x: 0.0,
        y: 1.8,
        mode: 'AMPLIFY',
        targetDb: 85,
        initialDb: 60,
      },
    ],
  };
}

export function evaluateInterferenceSubmission(state: InterferenceState): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  if (state.isComplete) {
    return { tier: 'hit', errorPercentage: 0, xpEarned: 500 };
  } else if (state.measuredDb <= 65) {
    return { tier: 'close', errorPercentage: 15, xpEarned: 300 };
  } else {
    return { tier: 'miss', errorPercentage: 45, xpEarned: 50 };
  }
}
