import { RoundData, ScoreTier } from './types';

export interface WeightItem {
  id: string;
  name: string;
  massKg: number;
  distanceM: number; // Signed distance from fulcrum (-5.0m to +5.0m)
  colorHex: number;
  isDraggable: boolean;
  forceAngleDeg?: number; // Force direction angle (default 90 deg = perpendicular downward)
}

export interface LeverExperimentLog {
  attemptNum: number;
  scenario: 'BALANCE_BEAM' | 'HEAVY_LOAD' | 'ANGLED_FORCE' | 'UNKNOWN_MASS';
  leftTorqueNm: number;
  rightTorqueNm: number;
  netTorqueNm: number;
  predictedBalanceDistM: number;
  actualBalanceDistM: number;
  errorPercentage: number;
}

export interface LeverRoundData extends RoundData {
  leftMass: number;
  leftDistance: number;
  rightMass: number;
  targetRightDistance: number;
}

export interface LeverState {
  scenarioMode: 'BALANCE_BEAM' | 'HEAVY_LOAD' | 'ANGLED_FORCE' | 'UNKNOWN_MASS';
  
  // Mechanical Apparatus Parameters
  beamLengthM: number; // e.g. 10.0m total beam (-5m to +5m)
  beamMassKg: number;   // e.g. 20.0kg beam mass
  fulcrumOffsetM: number; // Pivot offset from center (0 = center fulcrum)
  dampingLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Placed Mass & Force Items
  weights: WeightItem[];
  
  // Computed Rotational Physics
  leftTorqueNm: number;
  rightTorqueNm: number;
  netTorqueNm: number;
  rotationalInertiaI: number; // I_total = I_beam + sum(m_i * r_i^2)
  angularAccelRadps2: number; // alpha = netTorque / I
  mechanicalAdvantageMA: number; // d_effort / d_load
  centerOfMassX: number; // Relative to fulcrum
  
  // Visual Toggles
  showRotationalAxis: boolean;
  showLeverArm: boolean;
  showLineOfAction: boolean;
  showCenterOfMass: boolean;
  showFreeBodyDiagram: boolean;
  
  // Workflow State
  predictedBalanceDistM: number | null;
  predictedDirection: 'LEFT' | 'RIGHT' | 'BALANCED' | null;
  predictionLocked: boolean;
  isSimulating: boolean;
  isSimulationComplete: boolean;
  
  attemptCount: number;
  experimentLog: LeverExperimentLog[];
  statusText: string;
  physicsExplanation: string;
  isBalanced: boolean;
  isComplete: boolean;
}

/**
 * Calculates torque produced by a mass/force at distance r and angle theta
 * τ = r * F * sin(theta) where F = m * g (g = 9.81 m/s²)
 */
export function calculateItemTorque(massKg: number, distanceM: number, angleDeg: number = 90): number {
  const g = 9.81;
  const rad = (angleDeg * Math.PI) / 180;
  const forceN = massKg * g;
  const dist = Math.abs(distanceM);
  const torque = dist * forceN * Math.sin(rad);
  return Number(torque.toFixed(1));
}

export function analyzeLeverState(
  scenarioMode: 'BALANCE_BEAM' | 'HEAVY_LOAD' | 'ANGLED_FORCE' | 'UNKNOWN_MASS' = 'BALANCE_BEAM',
  fulcrumOffsetM: number = 0.0,
  beamLengthM: number = 10.0,
  beamMassKg: number = 20.0,
  dampingLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  weights: WeightItem[] = [],
  predictedBalanceDistM: number | null = null,
  predictedDirection: 'LEFT' | 'RIGHT' | 'BALANCED' | null = null,
  predictionLocked: boolean = false,
  isSimulating: boolean = false,
  isSimulationComplete: boolean = false,
  showRotationalAxis: boolean = true,
  showLeverArm: boolean = false,
  showLineOfAction: boolean = false,
  showCenterOfMass: boolean = false,
  showFreeBodyDiagram: boolean = false,
  attemptCount: number = 1,
  experimentLog: LeverExperimentLog[] = []
): LeverState {
  const g = 9.81;

  // 1. Calculate Counterclockwise (Left) Torque vs Clockwise (Right) Torque
  let leftTorqueNm = 0;
  let rightTorqueNm = 0;
  let totalMassKg = beamMassKg;
  let weightedDistSum = 0; // for Center of Mass

  weights.forEach((w) => {
    const angle = w.forceAngleDeg ?? 90;
    const torque = calculateItemTorque(w.massKg, w.distanceM, angle);
    totalMassKg += w.massKg;

    if (w.distanceM < 0) {
      leftTorqueNm += torque; // Counterclockwise torque (↺)
      weightedDistSum += w.massKg * w.distanceM;
    } else if (w.distanceM > 0) {
      rightTorqueNm += torque; // Clockwise torque (↻)
      weightedDistSum += w.massKg * w.distanceM;
    }
  });

  leftTorqueNm = Number(leftTorqueNm.toFixed(1));
  rightTorqueNm = Number(rightTorqueNm.toFixed(1));

  // Net Torque (Positive = Counterclockwise / Left tilt, Negative = Clockwise / Right tilt)
  const netTorqueNm = Number((leftTorqueNm - rightTorqueNm).toFixed(1));

  // 2. Rotational Inertia: I_total = 1/12 * M_beam * L^2 + M_beam * fulcrumOffset^2 + sum(m_i * r_i^2)
  let sumMr2 = 0;
  weights.forEach((w) => {
    sumMr2 += w.massKg * Math.pow(w.distanceM, 2);
  });
  const iBeam = (1 / 12) * beamMassKg * Math.pow(beamLengthM, 2) + beamMassKg * Math.pow(fulcrumOffsetM, 2);
  const rotationalInertiaI = Number((iBeam + sumMr2).toFixed(2));

  // 3. Angular Acceleration α = netTorque / I
  const angularAccelRadps2 = Number((netTorqueNm / Math.max(0.1, rotationalInertiaI)).toFixed(2));

  // 4. Center of Mass relative to fulcrum
  const centerOfMassX = Number((weightedDistSum / Math.max(1, totalMassKg)).toFixed(2));

  // 5. Mechanical Advantage MA = Effort Arm / Load Arm
  const leftItem = weights.find((w) => w.distanceM < 0);
  const rightItem = weights.find((w) => w.distanceM > 0);
  const loadArm = leftItem ? Math.abs(leftItem.distanceM) : 1.0;
  const effortArm = rightItem ? Math.abs(rightItem.distanceM) : 1.0;
  const mechanicalAdvantageMA = Number((effortArm / Math.max(0.1, loadArm)).toFixed(2));

  // 6. Balance verification (Net Torque <= 2.0 N·m considered balanced within physical tolerance)
  const isBalanced = Math.abs(netTorqueNm) <= 2.5;
  const isComplete = predictionLocked && isSimulationComplete && isBalanced;

  // 7. Physics Explanation Generator
  let physicsExplanation = '';
  if (isBalanced) {
    physicsExplanation = `✨ ROTATIONAL EQUILIBRIUM ACHIEVED! Left torque τ_left (${leftTorqueNm} N·m) = Right torque τ_right (${rightTorqueNm} N·m). Net torque Στ = ${netTorqueNm} N·m, so angular acceleration α = 0.0 rad/s²!`;
  } else if (netTorqueNm > 0) {
    physicsExplanation = `💡 COUNTERCLOCKWISE IMBALANCE: Left torque (${leftTorqueNm} N·m) > Right torque (${rightTorqueNm} N·m). Net torque Στ = ${netTorqueNm} N·m causes CCW angular acceleration α = +${angularAccelRadps2} rad/s²!`;
  } else {
    physicsExplanation = `💡 CLOCKWISE IMBALANCE: Right torque (${rightTorqueNm} N·m) > Left torque (${leftTorqueNm} N·m). Net torque Στ = ${netTorqueNm} N·m causes CW angular acceleration α = ${angularAccelRadps2} rad/s²!`;
  }

  let statusText = 'LEVER LAB READY • DRAG WEIGHTS ALONG BEAM TO BALANCE TORQUES!';
  if (isComplete) {
    statusText = `🎉 LEVER PERFECTLY BALANCED! Net Torque Στ ≈ 0 N·m (+500 XP)!`;
  } else if (isSimulationComplete) {
    statusText = `🔬 SIMULATION COMPLETE! Net Torque: ${netTorqueNm} N·m. Angular Accel: ${angularAccelRadps2} rad/s².`;
  } else if (isSimulating) {
    statusText = `🚀 SIMULATING ROTATION • Lever settling under Net Torque Στ = ${netTorqueNm} N·m...`;
  } else if (isBalanced) {
    statusText = `⚖️ EQUILIBRIUM DETECTED • Net Torque Στ ≈ 0 N·m! Beam is horizontal.`;
  }

  return {
    scenarioMode,
    beamLengthM,
    beamMassKg,
    fulcrumOffsetM,
    dampingLevel,
    weights,
    leftTorqueNm,
    rightTorqueNm,
    netTorqueNm,
    rotationalInertiaI,
    angularAccelRadps2,
    mechanicalAdvantageMA,
    centerOfMassX,
    showRotationalAxis,
    showLeverArm,
    showLineOfAction,
    showCenterOfMass,
    showFreeBodyDiagram,
    predictedBalanceDistM,
    predictedDirection,
    predictionLocked,
    isSimulating,
    isSimulationComplete,
    attemptCount,
    experimentLog,
    statusText,
    physicsExplanation,
    isBalanced,
    isComplete,
  };
}

export function generateLeverRounds(): LeverRoundData[] {
  const configs = [
    { leftMass: 30, leftDistance: 4.0, rightMass: 20 }, // Target = (30 * 4)/20 = 6.0m
    { leftMass: 50, leftDistance: 2.0, rightMass: 25 }, // Target = (50 * 2)/25 = 4.0m
    { leftMass: 15, leftDistance: 8.0, rightMass: 30 }, // Target = (15 * 8)/30 = 4.0m
    { leftMass: 40, leftDistance: 3.5, rightMass: 20 }, // Target = (40 * 3.5)/20 = 7.0m
    { leftMass: 60, leftDistance: 3.0, rightMass: 45 }, // Target = (60 * 3)/45 = 4.0m
  ];

  return configs.map((cfg, idx) => {
    const targetRightDistance = Number(((cfg.leftMass * cfg.leftDistance) / cfg.rightMass).toFixed(2));

    return {
      id: `lever-round-${idx + 1}`,
      conceptId: 101,
      conceptName: 'Lever & Torque Balance',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: targetRightDistance,
      gravity: 9.81,
      correctVelocity: targetRightDistance,
      leftMass: cfg.leftMass,
      leftDistance: cfg.leftDistance,
      rightMass: cfg.rightMass,
      targetRightDistance,
    };
  });
}

export function evaluateLeverSubmission(
  targetDistance: number,
  userDistance: number
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  const errorPercentage = Math.abs((userDistance - targetDistance) / targetDistance) * 100;

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
