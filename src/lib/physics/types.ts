export interface RoundData {
  id: string;
  conceptId: number;
  conceptName: string;
  roundNumber: number;
  totalRounds: number;
  height: number; // in meters (e.g. 10m to 50m)
  distance: number; // in meters (e.g. 20m to 120m)
  gravity: number; // m/s^2 (default 9.8)
  correctVelocity: number; // exact v in m/s
  angle?: number; // for angled projectile (Phase 4)
  targetHeightOffset?: number; // for elevated target (Phase 4)
}

export type ScoreTier = 'hit' | 'close' | 'miss';

export interface RoundResult {
  roundNumber: number;
  userVelocity: number;
  correctVelocity: number;
  errorPercentage: number;
  tier: ScoreTier;
  xpEarned: number;
  actualLandingX: number;
  targetX: number;
  trajectoryPoints: Array<{ x: number; y: number }>;
  idealTrajectoryPoints: Array<{ x: number; y: number }>;
}

export interface SessionStats {
  totalMatches: number;
  totalRoundsPlayed: number;
  totalXP: number;
  hitsCount: number;
  closeCount: number;
  missCount: number;
  accuracy: number; // percentage
  matchHistory: Array<{
    id: string;
    conceptName: string;
    timestamp: number;
    score: number;
    totalRounds: number;
    xpEarned: number;
  }>;
}
