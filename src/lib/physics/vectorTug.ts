import { RoundData, ScoreTier } from './types';

export interface Vector2D {
  x: number;
  y: number;
}

export interface VectorRoundData extends RoundData {
  f1: Vector2D; // Force 1 vector (N)
  f2: Vector2D; // Force 2 vector (N)
  targetGoal: Vector2D; // Goal net force vector (N)
  idealUserForce: Vector2D; // Ideal user force vector required = targetGoal - (f1 + f2)
}

/**
 * Calculates ideal user force vector to balance / redirect to goal.
 * F_user = F_goal - (F1 + F2)
 */
export function calculateIdealUserVector(f1: Vector2D, f2: Vector2D, goal: Vector2D): Vector2D {
  return {
    x: Number((goal.x - (f1.x + f2.x)).toFixed(1)),
    y: Number((goal.y - (f1.y + f2.y)).toFixed(1)),
  };
}

/**
 * Generates 5 rounds for Vector Tug-of-War mechanic
 */
export function generateVectorRounds(): VectorRoundData[] {
  const configs = [
    { f1: { x: 30, y: 40 }, f2: { x: -10, y: 20 }, goal: { x: 50, y: 0 } },   // Ideal user force = (50 - 20, 0 - 60) = (30, -60)
    { f1: { x: -40, y: 30 }, f2: { x: 20, y: -10 }, goal: { x: 0, y: 60 } },  // Ideal user force = (20, 40)
    { f1: { x: 50, y: -20 }, f2: { x: -30, y: -30 }, goal: { x: 0, y: 0 } },  // Pure equilibrium round! Ideal = (-20, 50)
    { f1: { x: 40, y: 40 }, f2: { x: 40, y: -40 }, goal: { x: -20, y: 0 } },  // Ideal = (-100, 0)
    { f1: { x: -60, y: 30 }, f2: { x: 30, y: 50 }, goal: { x: 30, y: -20 } }, // Boss vector challenge
  ];

  return configs.map((cfg, idx) => {
    const idealUserForce = calculateIdealUserVector(cfg.f1, cfg.f2, cfg.goal);
    const idealMag = Math.sqrt(idealUserForce.x * idealUserForce.x + idealUserForce.y * idealUserForce.y);

    return {
      id: `vector-round-${idx + 1}`,
      conceptId: 102, // Custom concept ID for Vector Tug-of-War
      conceptName: 'Vector Tug-of-War',
      roundNumber: idx + 1,
      totalRounds: 5,
      height: 0,
      distance: Number(idealMag.toFixed(1)),
      gravity: 9.8,
      correctVelocity: Number(idealMag.toFixed(1)),
      f1: cfg.f1,
      f2: cfg.f2,
      targetGoal: cfg.goal,
      idealUserForce,
    };
  });
}

/**
 * Evaluates 2D vector accuracy comparing user vector vs ideal vector
 */
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
