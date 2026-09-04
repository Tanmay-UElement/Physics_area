import { RoundData, ScoreTier } from './types';

export interface PowerLoadFacility {
  id: string;
  name: string;
  icon: string;
  powerWatts: number;
  priority: 'CRITICAL' | 'IMPORTANT' | 'INDUSTRIAL' | 'NON-CRITICAL';
  isOn: boolean;
}

export interface VoltPowerGridRoundData extends RoundData {
  gridCapacityWatts: number; // e.g. 5000 W
  defaultVoltage: number; // e.g. 230 V
  facilities: PowerLoadFacility[];
}

export interface GridState {
  voltage: number;
  totalPowerWatts: number;
  totalCurrentAmps: number;
  gridCapacityWatts: number;
  loadPercentage: number;
  isOverloaded: boolean;
  hospitalOnline: boolean;
  spikeActive: boolean;
  statusText: string;
  diagnostic: 'STABLE' | 'WARNING' | 'OVERLOAD';
}

export const DEFAULT_FACILITIES: PowerLoadFacility[] = [
  { id: 'hospital', name: 'Hospital', icon: '🏥', powerWatts: 1500, priority: 'CRITICAL', isOn: true },
  { id: 'house', name: 'Residential', icon: '🏠', powerWatts: 800, priority: 'IMPORTANT', isOn: true },
  { id: 'factory', name: 'Factory', icon: '🏭', powerWatts: 2000, priority: 'INDUSTRIAL', isOn: true },
  { id: 'ev', name: 'EV Charger', icon: '⚡', powerWatts: 1200, priority: 'NON-CRITICAL', isOn: false },
  { id: 'lights', name: 'Street Lights', icon: '💡', powerWatts: 400, priority: 'NON-CRITICAL', isOn: true },
];

/**
 * Calculates real-time grid physics (P = V * I)
 */
export function analyzePowerGridState(
  facilities: PowerLoadFacility[],
  voltage: number = 230,
  capacityWatts: number = 5000,
  spikeActive: boolean = false
): GridState {
  const spikePower = spikeActive ? 900 : 0;
  const baseActivePower = facilities
    .filter((f) => f.isOn)
    .reduce((sum, f) => sum + f.powerWatts, 0);

  const totalPowerWatts = baseActivePower + spikePower;
  const totalCurrentAmps = Number((totalPowerWatts / voltage).toFixed(2));
  const loadPercentage = Number(((totalPowerWatts / capacityWatts) * 100).toFixed(1));
  const isOverloaded = totalPowerWatts > capacityWatts;

  const hospitalFacility = facilities.find((f) => f.id === 'hospital');
  const hospitalOnline = hospitalFacility ? hospitalFacility.isOn : false;

  let statusText = '⚡ GRID STABLE: Normal power distribution.';
  let diagnostic: 'STABLE' | 'WARNING' | 'OVERLOAD' = 'STABLE';

  if (!hospitalOnline) {
    statusText = '🚨 CRITICAL FAILURE: Hospital Life Support OFFLINE!';
    diagnostic = 'OVERLOAD';
  } else if (isOverloaded) {
    statusText = `🚨 GRID OVERLOAD: Exceeded capacity by ${(totalPowerWatts - capacityWatts)}W! Fuse Breakers Tripping!`;
    diagnostic = 'OVERLOAD';
  } else if (loadPercentage >= 85) {
    statusText = '⚠ HIGH LOAD WARNING: Grid operating near safe thermal limit.';
    diagnostic = 'WARNING';
  }

  return {
    voltage,
    totalPowerWatts,
    totalCurrentAmps,
    gridCapacityWatts: capacityWatts,
    loadPercentage,
    isOverloaded,
    hospitalOnline,
    spikeActive,
    statusText,
    diagnostic,
  };
}

/**
 * Generates Game 7 data
 */
export function generateVoltPowerGridRound(): VoltPowerGridRoundData {
  return {
    id: 'volt-power-grid-game-7',
    conceptId: 207,
    conceptName: 'Power Grid Balancer (P = VI)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 1,
    gravity: 9.8,
    correctVelocity: 1,
    gridCapacityWatts: 5000,
    defaultVoltage: 230,
    facilities: DEFAULT_FACILITIES,
  };
}

/**
 * Evaluates Game 7 solution
 */
export function evaluatePowerGridSubmission(gridState: GridState): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  if (gridState.hospitalOnline && !gridState.isOverloaded && gridState.loadPercentage >= 70 && gridState.loadPercentage <= 95) {
    return { tier: 'hit', errorPercentage: 0, xpEarned: 500 };
  } else if (gridState.hospitalOnline && !gridState.isOverloaded) {
    return { tier: 'close', errorPercentage: 15, xpEarned: 300 };
  } else {
    return { tier: 'miss', errorPercentage: 50, xpEarned: 50 };
  }
}
