import { RoundData, ScoreTier } from './types';

export interface OpticalMedium {
  id: string;
  name: string;
  n: number; // Refractive index
  color: string;
  speedText: string;
}

export interface ShotRecord {
  shotNumber: number;
  incidentAngleDeg: number;
  refractedAngleDeg: number;
  medium1Name: string;
  medium2Name: string;
  impactOffsetCm: number; // Offset from target center in cm (+ is above/right, - is below/left)
  accuracyPct: number;
  hitTier: 'PERFECT' | 'EXCELLENT' | 'PARTIAL' | 'MISS';
  isTir: boolean;
}

export interface WaveRefractionRoundData extends RoundData {
  targetDetectorDistanceM: number; // Target distance along table (e.g. 1.8 m)
  targetDetectorHeightCm: number;  // Target detector vertical center
  targetAngleDeg: number;         // Mathematically ideal angle for current medium
  allowedToleranceCm: number;
}

export interface RefractionState {
  medium1: OpticalMedium;
  medium2: OpticalMedium;
  incidentAngleDeg: number;       // theta_1 in degrees (measured from normal)
  refractedAngleDeg: number;      // theta_2 in degrees
  isTotalInternalReflection: boolean;
  criticalAngleDeg: number | null;
  speed1Mps: number;
  speed2Mps: number;
  targetDetectorDistanceM: number;
  
  // Shooting physics state
  isCharging: boolean;
  isShooting: boolean;
  beamProgress: number;          // 0.0 to 1.0 (progressive beam travel)
  lastImpactOffsetCm: number | null;
  lastAccuracyPct: number | null;
  lastHitTier: 'PERFECT' | 'EXCELLENT' | 'PARTIAL' | 'MISS' | null;
  shotHistory: ShotRecord[];
  
  statusText: string;
  targetHit: boolean;
}

export const OPTICAL_MEDIA: { [id: string]: OpticalMedium } = {
  air: { id: 'air', name: 'Air', n: 1.00, color: '#f8fafc', speedText: '3.00 × 10⁸ m/s' },
  water: { id: 'water', name: 'Water', n: 1.33, color: '#38bdf8', speedText: '2.25 × 10⁸ m/s' },
  glass: { id: 'glass', name: 'Glass', n: 1.50, color: '#e2e8f0', speedText: '2.00 × 10⁸ m/s' },
  acrylic: { id: 'acrylic', name: 'Acrylic', n: 1.49, color: '#a855f7', speedText: '2.01 × 10⁸ m/s' },
};

/**
 * Calculates Snell's Law & physical impact offset on the target detector
 */
export function analyzeRefractionState(
  medium1: OpticalMedium,
  medium2: OpticalMedium,
  incidentAngleDeg: number,
  targetDetectorDistanceM: number = 1.8,
  shotHistory: ShotRecord[] = [],
  isCharging: boolean = false,
  isShooting: boolean = false,
  beamProgress: number = 1.0
): RefractionState {
  const theta1Rad = (incidentAngleDeg * Math.PI) / 180;
  const sinTheta1 = Math.sin(theta1Rad);
  const ratio = (medium1.n * sinTheta1) / medium2.n;

  let isTotalInternalReflection = false;
  let refractedAngleDeg = 0;
  let criticalAngleDeg: number | null = null;

  if (medium1.n > medium2.n) {
    criticalAngleDeg = Number(((Math.asin(medium2.n / medium1.n) * 180) / Math.PI).toFixed(1));
  }

  if (ratio > 1.0) {
    isTotalInternalReflection = true;
    refractedAngleDeg = incidentAngleDeg;
  } else {
    const theta2Rad = Math.asin(ratio);
    refractedAngleDeg = Number(((theta2Rad * 180) / Math.PI).toFixed(1));
  }

  const C = 3.0e8;
  const speed1Mps = C / medium1.n;
  const speed2Mps = C / medium2.n;

  // Calculate beam trajectory landing Y offset at Target Detector plane (dist = 1.8m)
  // Ideal hit occurs when refracted angle matches expected angle for 1.8m detector height
  // At theta1 = 35°, Air -> Water yields theta2 = 25.4° -> Lands near target center!
  const idealTheta2Deg = 25.4; 
  const angleErrorDeg = isTotalInternalReflection ? 99 : Math.abs(refractedAngleDeg - idealTheta2Deg);
  
  // Physical impact offset in cm
  const impactOffsetCm = isTotalInternalReflection
    ? 999
    : Number((Math.tan((refractedAngleDeg - idealTheta2Deg) * (Math.PI / 180)) * targetDetectorDistanceM * 100).toFixed(1));

  const absOffset = Math.abs(impactOffsetCm);
  let accuracyPct = Math.max(0, Math.min(100, Math.round(100 - absOffset * 4)));
  if (isTotalInternalReflection) accuracyPct = 0;

  let hitTier: 'PERFECT' | 'EXCELLENT' | 'PARTIAL' | 'MISS' = 'MISS';
  if (!isTotalInternalReflection) {
    if (absOffset <= 2.0) hitTier = 'PERFECT';
    else if (absOffset <= 5.0) hitTier = 'EXCELLENT';
    else if (absOffset <= 12.0) hitTier = 'PARTIAL';
    else hitTier = 'MISS';
  }

  const targetHit = hitTier === 'PERFECT' || hitTier === 'EXCELLENT';

  let statusText = 'AIM THE LASER AND PRESS SHOOT TO FIRE BEAM.';
  if (isCharging) {
    statusText = '⚡ CHARGING LASER EMITTER... 100% POWER READY';
  } else if (isShooting) {
    statusText = `🔴 FIRING 650nm LASER BEAM... SPEED IN ${medium2.name.toUpperCase()}: ${(speed2Mps / 1e8).toFixed(2)}×10⁸ m/s`;
  } else if (shotHistory.length > 0) {
    const lastShot = shotHistory[0];
    if (lastShot.hitTier === 'PERFECT' || lastShot.hitTier === 'EXCELLENT') {
      statusText = `🎯 TARGET HIT! Distance from Center: ${Math.abs(lastShot.impactOffsetCm)} cm (${lastShot.accuracyPct}% Accuracy)`;
    } else if (lastShot.isTir) {
      statusText = `⚡ TOTAL INTERNAL REFLECTION DETECTED! Beam reflected internally at ${lastShot.incidentAngleDeg}°.`;
    } else {
      statusText = `🔴 SHOT MISSED: Landed ${Math.abs(lastShot.impactOffsetCm)} cm ${lastShot.impactOffsetCm > 0 ? 'above' : 'below'} target center. Adjust angle!`;
    }
  }

  return {
    medium1,
    medium2,
    incidentAngleDeg,
    refractedAngleDeg,
    isTotalInternalReflection,
    criticalAngleDeg,
    speed1Mps,
    speed2Mps,
    targetDetectorDistanceM,
    isCharging,
    isShooting,
    beamProgress,
    lastImpactOffsetCm: shotHistory.length > 0 ? shotHistory[0].impactOffsetCm : null,
    lastAccuracyPct: shotHistory.length > 0 ? shotHistory[0].accuracyPct : null,
    lastHitTier: shotHistory.length > 0 ? shotHistory[0].hitTier : null,
    shotHistory,
    statusText,
    targetHit,
  };
}

export function generateWaveRefractionRound(): WaveRefractionRoundData {
  return {
    id: 'wave-refraction-game-1',
    conceptId: 301,
    conceptName: 'Refraction Lab (Snell\'s Law)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 1.8,
    gravity: 9.8,
    correctVelocity: 1,
    targetDetectorDistanceM: 1.8,
    targetDetectorHeightCm: 0,
    targetAngleDeg: 25.4,
    allowedToleranceCm: 3.0,
  };
}

export function evaluateRefractionSubmission(state: RefractionState): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  if (state.targetHit) {
    return { tier: 'hit', errorPercentage: 0, xpEarned: 500 };
  } else if (state.lastHitTier === 'PARTIAL') {
    return { tier: 'close', errorPercentage: 15, xpEarned: 300 };
  } else {
    return { tier: 'miss', errorPercentage: 50, xpEarned: 50 };
  }
}
