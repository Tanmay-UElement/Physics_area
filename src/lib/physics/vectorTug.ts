import { RoundData, ScoreTier } from './types';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PolarVector {
  magnitude: number; // Force in Newtons
  angleDeg: number;  // Direction angle in degrees (0..360)
}

export interface VectorExperimentLog {
  attemptNum: number;
  scenario: 'TARGET_MATCH' | 'ZERO_RESULTANT' | 'MOVING_EQUILIBRIUM' | 'HORIZONTAL_ONLY';
  predictedMagN: number;
  predictedAngleDeg: number;
  actualMagN: number;
  actualAngleDeg: number;
  errorPercentage: number;
}

export interface VectorRoundData extends RoundData {
  f1: Vector2D;
  f2: Vector2D;
  targetGoal: Vector2D;
  idealUserForce: Vector2D;
}

export interface ForceSource {
  id: string;
  name: string;
  colorHex: number;
  vector: Vector2D;
  isDraggable: boolean;
  maxMagnitude: number;
}

export interface VectorTugState {
  scenarioMode: 'TARGET_MATCH' | 'ZERO_RESULTANT' | 'MOVING_EQUILIBRIUM' | 'HORIZONTAL_ONLY';
  
  // Object Properties
  objectMassKg: number; // e.g. 10 kg
  surfaceFriction: 'OFF' | 'LOW' | 'HIGH';
  initialVelocity: Vector2D; // e.g. (5.0, 0) for MOVING_EQUILIBRIUM
  
  // Active Force Vectors
  forces: ForceSource[];
  
  // Computed Telemetry
  netFx: number;
  netFy: number;
  netMagnitudeN: number;
  netAngleDeg: number;
  accelMagnitudeMps2: number;
  accelAngleDeg: number;
  
  // Target Requirements
  targetVector: Vector2D;
  targetMagnitudeN: number;
  targetAngleDeg: number;
  
  // Visual Toggles
  showResultant: boolean;
  showComponents: boolean;
  showHeadToTail: boolean;
  showFreeBodyDiagram: boolean;
  showTrajectoryTrail: boolean;
  angleSnap15Deg: boolean;
  
  // Workflow State
  predictedMagN: number | null;
  predictedAngleDeg: number | null;
  predictionLocked: boolean;
  isSimulating: boolean;
  isSimulationComplete: boolean;
  
  attemptCount: number;
  experimentLog: VectorExperimentLog[];
  statusText: string;
  physicsExplanation: string;
  targetMet: boolean;
  isComplete: boolean;
}

/**
 * Converts Cartesian (x, y) to Polar (magnitude, angle in degrees)
 */
export function cartesianToPolar(x: number, y: number): PolarVector {
  const magnitude = Math.sqrt(x * x + y * y);
  let angleRad = Math.atan2(y, x);
  let angleDeg = (angleRad * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return {
    magnitude: Number(magnitude.toFixed(1)),
    angleDeg: Number(angleDeg.toFixed(1)),
  };
}

/**
 * Converts Polar (magnitude, angle in degrees) to Cartesian (x, y)
 */
export function polarToCartesian(magnitude: number, angleDeg: number): Vector2D {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((magnitude * Math.cos(rad)).toFixed(1)),
    y: Number((magnitude * Math.sin(rad)).toFixed(1)),
  };
}

export function analyzeVectorTugState(
  scenarioMode: 'TARGET_MATCH' | 'ZERO_RESULTANT' | 'MOVING_EQUILIBRIUM' | 'HORIZONTAL_ONLY' = 'TARGET_MATCH',
  objectMassKg: number = 10.0,
  surfaceFriction: 'OFF' | 'LOW' | 'HIGH' = 'OFF',
  forces: ForceSource[] = [],
  targetVector: Vector2D = { x: 100, y: 0 },
  predictedMagN: number | null = null,
  predictedAngleDeg: number | null = null,
  predictionLocked: boolean = false,
  isSimulating: boolean = false,
  isSimulationComplete: boolean = false,
  showResultant: boolean = true,
  showComponents: boolean = false,
  showHeadToTail: boolean = false,
  showFreeBodyDiagram: boolean = false,
  showTrajectoryTrail: boolean = true,
  angleSnap15Deg: boolean = false,
  attemptCount: number = 1,
  experimentLog: VectorExperimentLog[] = []
): VectorTugState {
  // 1. Calculate Resultant Sum of all active forces: F_net = sum(F_i)
  let netFx = 0;
  let netFy = 0;
  forces.forEach((f) => {
    netFx += f.vector.x;
    netFy += f.vector.y;
  });

  netFx = Number(netFx.toFixed(1));
  netFy = Number(netFy.toFixed(1));

  const netPolar = cartesianToPolar(netFx, netFy);
  const targetPolar = cartesianToPolar(targetVector.x, targetVector.y);

  // 2. Acceleration according to Newton's Second Law: a = F_net / m
  const accelMagnitudeMps2 = Number((netPolar.magnitude / objectMassKg).toFixed(2));
  const accelAngleDeg = netPolar.angleDeg;

  // 3. Initial velocity for moving equilibrium scenario
  const initialVelocity: Vector2D = scenarioMode === 'MOVING_EQUILIBRIUM' ? { x: 5.0, y: 0.0 } : { x: 0.0, y: 0.0 };

  // 4. Target matching verification
  let targetMet = false;
  let errorPercentage = 100;

  if (scenarioMode === 'ZERO_RESULTANT' || scenarioMode === 'MOVING_EQUILIBRIUM') {
    targetMet = netPolar.magnitude <= 2.0; // Net force <= 2N considered balanced
    errorPercentage = netPolar.magnitude;
  } else {
    const diffX = netFx - targetVector.x;
    const diffY = netFy - targetVector.y;
    const distError = Math.sqrt(diffX * diffX + diffY * diffY);
    const targetMag = targetPolar.magnitude || 1;
    errorPercentage = (distError / targetMag) * 100;
    targetMet = errorPercentage <= 5.0;
  }

  const isComplete = predictionLocked && isSimulationComplete && targetMet;

  // 5. Educational physics explanation based on active forces & resultant
  let physicsExplanation = '';
  if (scenarioMode === 'ZERO_RESULTANT' || scenarioMode === 'MOVING_EQUILIBRIUM') {
    if (netPolar.magnitude <= 2.0) {
      physicsExplanation = `✨ FORCE EQUILIBRIUM ACHIEVED! Net force ΣF = 0.0 N. According to Newton's First Law, acceleration a = 0 m/s², so velocity remains constant!`;
    } else {
      physicsExplanation = `💡 UNBALANCED FORCES: Net force ΣF = ${netPolar.magnitude} N @ ${netPolar.angleDeg}°. This causes an acceleration of a = ${accelMagnitudeMps2} m/s²! Drag vectors to balance.`;
    }
  } else {
    physicsExplanation = `🔬 VECTOR ADDITION: Combined forces produce Net Force ΣF = ${netPolar.magnitude} N at ${netPolar.angleDeg}°. Acceleration a = ${accelMagnitudeMps2} m/s² (mass = ${objectMassKg}kg).`;
  }

  // Status Text
  let statusText = 'VECTOR TUG LAB READY • DRAG VECTOR ARROWS & PREDICT MOTION!';
  if (isComplete) {
    statusText = `🎉 VECTOR TARGET MATCHED! Net Force: ${netPolar.magnitude}N @ ${netPolar.angleDeg}° (+500 XP)!`;
  } else if (isSimulationComplete) {
    statusText = `🔬 SIMULATION COMPLETE! Resultant Force: ${netPolar.magnitude}N @ ${netPolar.angleDeg}°. Accel: ${accelMagnitudeMps2} m/s².`;
  } else if (isSimulating) {
    statusText = `🚀 SIMULATING MOTION • Robot accelerating under Net Force ΣF = ${netPolar.magnitude}N...`;
  } else if (netPolar.magnitude <= 2.0) {
    statusText = `⚖️ FORCE EQUILIBRIUM DETECTED • Net Force ΣF ≈ 0 N! Acceleration a = 0 m/s².`;
  }

  return {
    scenarioMode,
    objectMassKg,
    surfaceFriction,
    initialVelocity,
    forces,
    netFx,
    netFy,
    netMagnitudeN: netPolar.magnitude,
    netAngleDeg: netPolar.angleDeg,
    accelMagnitudeMps2,
    accelAngleDeg,
    targetVector,
    targetMagnitudeN: targetPolar.magnitude,
    targetAngleDeg: targetPolar.angleDeg,
    showResultant,
    showComponents,
    showHeadToTail,
    showFreeBodyDiagram,
    showTrajectoryTrail,
    angleSnap15Deg,
    predictedMagN,
    predictedAngleDeg,
    predictionLocked,
    isSimulating,
    isSimulationComplete,
    attemptCount,
    experimentLog,
    statusText,
    physicsExplanation,
    targetMet,
    isComplete,
  };
}

export function generateVectorRounds(): VectorRoundData[] {
  const configs = [
    { f1: { x: 30, y: 40 }, f2: { x: -10, y: 20 }, goal: { x: 50, y: 0 } },
    { f1: { x: -40, y: 30 }, f2: { x: 20, y: -10 }, goal: { x: 0, y: 60 } },
    { f1: { x: 50, y: -20 }, f2: { x: -30, y: -30 }, goal: { x: 0, y: 0 } },
    { f1: { x: 40, y: 40 }, f2: { x: 40, y: -40 }, goal: { x: -20, y: 0 } },
    { f1: { x: -60, y: 30 }, f2: { x: 30, y: 50 }, goal: { x: 30, y: -20 } },
  ];

  return configs.map((cfg, idx) => {
    const idealUserForce = {
      x: Number((cfg.goal.x - (cfg.f1.x + cfg.f2.x)).toFixed(1)),
      y: Number((cfg.goal.y - (cfg.f1.y + cfg.f2.y)).toFixed(1)),
    };
    const idealMag = Math.sqrt(idealUserForce.x * idealUserForce.x + idealUserForce.y * idealUserForce.y);

    return {
      id: `vector-round-${idx + 1}`,
      conceptId: 102,
      conceptName: 'Vector Tug-of-War',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: Number(idealMag.toFixed(1)),
      gravity: 9.81,
      correctVelocity: Number(idealMag.toFixed(1)),
      f1: cfg.f1,
      f2: cfg.f2,
      targetGoal: cfg.goal,
      idealUserForce,
    };
  });
}

export function evaluateVectorSubmission(
  ideal: Vector2D,
  user: Vector2D
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const diffX = user.x - ideal.x;
  const diffY = user.y - ideal.y;
  const distError = Math.sqrt(diffX * diffX + diffY * diffY);
  const idealMag = Math.sqrt(ideal.x * ideal.x + ideal.y * ideal.y) || 1;

  const errorPercentage = (distError / idealMag) * 100;

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
