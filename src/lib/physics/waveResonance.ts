import { RoundData, ScoreTier } from './types';

export interface ResonanceExperimentLog {
  attemptNum: number;
  systemType: 'STRING' | 'AIR_COLUMN';
  lengthM: number;
  tensionN: number;
  frequencyHz: number;
  measuredAmp: number;
  detectedMode: number;
  predictedHz?: number;
}

export interface WaveResonanceRoundData extends RoundData {
  soundSpeedAirMps: number;
  defaultLinearDensityKgM: number;
  defaultStringLengthM: number;
  defaultTensionN: number;
  defaultTubeLengthM: number;
}

export interface ResonanceState {
  mode: 'STRING' | 'AIR_COLUMN';
  tubeBoundary: 'CLOSED_ONE_END' | 'OPEN_BOTH_ENDS';
  
  // Physical Parameters - String
  stringLengthM: number; // L (0.5m to 2.0m)
  tensionN: number; // T (10N to 120N)
  linearDensityKgM: number; // mu (0.004 kg/m)
  waveSpeedMps: number; // v = sqrt(T / mu)
  
  // Physical Parameters - Air Tube
  tubeLengthM: number; // L (0.4m to 1.8m)
  airSoundSpeedMps: number; // v = 343 m/s
  
  // Driver Generator Controls
  driverFrequencyHz: number; // f (20Hz to 600Hz)
  driverAmplitude: number; // A_drive (0.1 to 1.0)
  dampingQ: number; // Q factor (quality factor, e.g. 25)
  simSpeed: number; // 0.25, 0.5, 1.0
  
  // Physics Calculated Telemetry
  fundamentalFreqHz: number; // f1
  allowedFrequenciesHz: number[]; // [f1, f2, f3, f4, ...]
  activeHarmonicMode: number; // n (1, 2, 3, 4...) or 0 if not at resonance
  isAtResonance: boolean;
  harmonicLock: boolean;
  
  // Driven Amplitude at current frequency
  responseAmplitude: number; // Actual physical oscillation amplitude
  nodePositionsM: number[];
  antinodePositionsM: number[];
  
  // Target Objectives
  puzzleType: 'FIND_FUNDAMENTAL' | 'CREATE_3RD_HARMONIC' | 'TUNE_TO_440HZ' | 'UNKNOWN_TENSION';
  targetFrequencyHz: number;
  targetHarmonic: number;
  
  // UI Toggles & Visual Overlays
  showIncidentWave: boolean;
  showReflectedWave: boolean;
  showResultantWave: boolean;
  showNodesAntinodes: boolean;
  showSpectrumAnalyzer: boolean;
  cameraView: 'LAB_VIEW' | 'CLOSE_UP' | 'SUPERPOSITION_VIEW';
  
  // Automated Frequency Sweep Engine
  isSweeping: boolean;
  sweepStartHz: number;
  sweepEndHz: number;
  sweepGraphPoints: { freq: number; amp: number }[];
  
  // Workflow & Prediction State
  predictedHz: number | null;
  predictedMode: number | null;
  predictionLocked: boolean;
  
  attemptCount: number;
  experimentLog: ResonanceExperimentLog[];
  statusText: string;
  targetMet: boolean;
  isComplete: boolean;
}

/**
 * Calculates driven damped harmonic oscillator amplitude response:
 * A(f) = A_drive / sqrt( (1 - (f / f_n)^2)^2 + (f / (Q * f_n))^2 )
 */
export function calculateResonanceResponse(
  fDriver: number,
  allowedFreqs: number[],
  driveAmp: number = 1.0,
  Q: number = 25
): { totalAmp: number; closestMode: number; proximity: number } {
  let maxAmp = 0.05;
  let closestMode = 0;
  let minDiff = Infinity;

  allowedFreqs.forEach((fn, idx) => {
    const modeNum = idx + 1;
    const ratio = fDriver / fn;
    const denom = Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(ratio / Q, 2));
    const ampForMode = (driveAmp * 0.8) / Math.max(0.04, denom);

    if (ampForMode > maxAmp) {
      maxAmp = ampForMode;
      closestMode = modeNum;
    }

    const diff = Math.abs(fDriver - fn);
    if (diff < minDiff) {
      minDiff = diff;
    }
  });

  const cappedAmp = Number(Math.min(2.5, maxAmp).toFixed(3));
  return {
    totalAmp: cappedAmp,
    closestMode,
    proximity: minDiff,
  };
}

export function analyzeResonanceState(
  mode: 'STRING' | 'AIR_COLUMN' = 'STRING',
  tubeBoundary: 'CLOSED_ONE_END' | 'OPEN_BOTH_ENDS' = 'CLOSED_ONE_END',
  stringLengthM: number = 1.2,
  tensionN: number = 40,
  linearDensityKgM: number = 0.004,
  tubeLengthM: number = 0.85,
  driverFrequencyHz: number = 120,
  driverAmplitude: number = 1.0,
  puzzleType: 'FIND_FUNDAMENTAL' | 'CREATE_3RD_HARMONIC' | 'TUNE_TO_440HZ' | 'UNKNOWN_TENSION' = 'CREATE_3RD_HARMONIC',
  showIncidentWave: boolean = true,
  showReflectedWave: boolean = true,
  showResultantWave: boolean = true,
  showNodesAntinodes: boolean = true,
  cameraView: 'LAB_VIEW' | 'CLOSE_UP' | 'SUPERPOSITION_VIEW' = 'LAB_VIEW',
  isSweeping: boolean = false,
  sweepGraphPoints: { freq: number; amp: number }[] = [],
  predictedHz: number | null = null,
  predictedMode: number | null = null,
  predictionLocked: boolean = false,
  attemptCount: number = 1,
  experimentLog: ResonanceExperimentLog[] = []
): ResonanceState {
  const airSoundSpeedMps = 343;

  // 1. Calculate Wave Speed
  let waveSpeedMps = 0;
  let L = 1.2;
  let allowedFrequenciesHz: number[] = [];

  if (mode === 'STRING') {
    waveSpeedMps = Number(Math.sqrt(tensionN / linearDensityKgM).toFixed(1)); // v = sqrt(T / mu)
    L = stringLengthM;
    const f1 = waveSpeedMps / (2 * L); // f1 = v / (2L)
    allowedFrequenciesHz = [
      Number(f1.toFixed(1)),
      Number((2 * f1).toFixed(1)),
      Number((3 * f1).toFixed(1)),
      Number((4 * f1).toFixed(1)),
      Number((5 * f1).toFixed(1)),
    ];
  } else {
    waveSpeedMps = airSoundSpeedMps;
    L = tubeLengthM;
    if (tubeBoundary === 'CLOSED_ONE_END') {
      const f1 = airSoundSpeedMps / (4 * L); // f1 = v / (4L) (Odd harmonics only)
      allowedFrequenciesHz = [
        Number(f1.toFixed(1)),
        Number((3 * f1).toFixed(1)),
        Number((5 * f1).toFixed(1)),
        Number((7 * f1).toFixed(1)),
      ];
    } else {
      const f1 = airSoundSpeedMps / (2 * L); // f1 = v / (2L) (All harmonics)
      allowedFrequenciesHz = [
        Number(f1.toFixed(1)),
        Number((2 * f1).toFixed(1)),
        Number((3 * f1).toFixed(1)),
        Number((4 * f1).toFixed(1)),
      ];
    }
  }

  const fundamentalFreqHz = allowedFrequenciesHz[0] || 100;

  // 2. Response Amplitude & Proximity
  const dampingQ = 25;
  const { totalAmp, closestMode, proximity } = calculateResonanceResponse(
    driverFrequencyHz,
    allowedFrequenciesHz,
    driverAmplitude,
    dampingQ
  );

  const isAtResonance = totalAmp >= 0.8 && proximity <= 4.0;
  const activeHarmonicMode = isAtResonance ? closestMode : 0;
  const harmonicLock = isAtResonance && activeHarmonicMode > 0;

  // 3. Node and Antinode Positions along length L
  const nodePositionsM: number[] = [];
  const antinodePositionsM: number[] = [];

  const n = activeHarmonicMode > 0 ? activeHarmonicMode : 1;
  if (mode === 'STRING' || tubeBoundary === 'OPEN_BOTH_ENDS') {
    // Fixed-Fixed String: Nodes at x = m * (L / n) for m = 0..n
    for (let m = 0; m <= n; m++) {
      nodePositionsM.push(Number(((m * L) / n).toFixed(3)));
    }
    for (let m = 0; m < n; m++) {
      antinodePositionsM.push(Number((((m + 0.5) * L) / n).toFixed(3)));
    }
  } else {
    // Closed at one end (x=0 fixed node, x=L open antinode)
    const oddN = 2 * n - 1;
    for (let m = 0; m < n; m++) {
      nodePositionsM.push(Number(((m * (2 * L)) / oddN).toFixed(3)));
    }
    for (let m = 0; m < n; m++) {
      antinodePositionsM.push(Number((((m + 0.5) * (2 * L)) / oddN).toFixed(3)));
    }
  }

  // 4. Target Objectives Check
  let targetFrequencyHz = 0;
  let targetHarmonic = 1;

  if (puzzleType === 'FIND_FUNDAMENTAL') {
    targetFrequencyHz = fundamentalFreqHz;
    targetHarmonic = 1;
  } else if (puzzleType === 'CREATE_3RD_HARMONIC') {
    targetFrequencyHz = allowedFrequenciesHz[2] || 3 * fundamentalFreqHz;
    targetHarmonic = 3;
  } else if (puzzleType === 'TUNE_TO_440HZ') {
    targetFrequencyHz = 440;
    targetHarmonic = 1;
  } else if (puzzleType === 'UNKNOWN_TENSION') {
    targetFrequencyHz = fundamentalFreqHz;
    targetHarmonic = 1;
  }

  let targetMet = false;
  if (puzzleType === 'TUNE_TO_440HZ') {
    targetMet = Math.abs(fundamentalFreqHz - 440) <= 2.5 && isAtResonance;
  } else {
    targetMet = harmonicLock && activeHarmonicMode === targetHarmonic;
  }

  const isComplete = targetMet;

  // Status Text Feedback
  let statusText = 'RESONANCE STUDIO READY • SWEEP FREQUENCY & DISCOVER STANDING WAVES!';
  if (isComplete) {
    statusText = `🎉 HARMONIC LOCKED! Target ${targetHarmonic}rd Harmonic achieved at ${driverFrequencyHz} Hz (+500 XP)!`;
  } else if (isAtResonance) {
    statusText = `🔥 RESONANCE DETECTED! Mode n=${activeHarmonicMode} active (Amp: ${totalAmp}). Target mode: n=${targetHarmonic}.`;
  } else if (proximity <= 10.0) {
    statusText = `⚡ APPROACHING NATURAL FREQUENCY (${driverFrequencyHz} Hz → Peak near ${allowedFrequenciesHz[closestMode - 1]} Hz)...`;
  } else {
    statusText = `🔊 DRIVING AT ${driverFrequencyHz} Hz • Off-resonance vibration small. Sweep frequency to find peaks.`;
  }

  return {
    mode,
    tubeBoundary,
    stringLengthM,
    tensionN,
    linearDensityKgM,
    waveSpeedMps,
    tubeLengthM,
    airSoundSpeedMps,
    driverFrequencyHz,
    driverAmplitude,
    dampingQ,
    simSpeed: 1.0,
    fundamentalFreqHz,
    allowedFrequenciesHz,
    activeHarmonicMode,
    isAtResonance,
    harmonicLock,
    responseAmplitude: totalAmp,
    nodePositionsM,
    antinodePositionsM,
    puzzleType,
    targetFrequencyHz,
    targetHarmonic,
    showIncidentWave,
    showReflectedWave,
    showResultantWave,
    showNodesAntinodes,
    showSpectrumAnalyzer: true,
    cameraView,
    isSweeping,
    sweepStartHz: 20,
    sweepEndHz: 450,
    sweepGraphPoints,
    predictedHz,
    predictedMode,
    predictionLocked,
    attemptCount,
    experimentLog,
    statusText,
    targetMet,
    isComplete,
  };
}

export function generateWaveResonanceRound(): WaveResonanceRoundData {
  return {
    id: 'wave-resonance-game-4',
    conceptId: 304,
    conceptName: 'Resonance Studio (Harmonics & Standing Waves)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 120,
    gravity: 9.8,
    correctVelocity: 1,
    soundSpeedAirMps: 343,
    defaultLinearDensityKgM: 0.004,
    defaultStringLengthM: 1.2,
    defaultTensionN: 40,
    defaultTubeLengthM: 0.85,
  };
}

export function evaluateResonanceSubmission(state: ResonanceState): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  if (state.isComplete) {
    return { tier: 'hit', errorPercentage: 0, xpEarned: 500 };
  } else if (state.isAtResonance) {
    return { tier: 'close', errorPercentage: 12, xpEarned: 300 };
  } else {
    return { tier: 'miss', errorPercentage: 45, xpEarned: 50 };
  }
}
