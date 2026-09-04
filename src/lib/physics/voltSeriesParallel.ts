import { RoundData, ScoreTier } from './types';

export type CircuitType = 'none' | 'series' | 'parallel' | 'short';

export interface VoltSeriesParallelRoundData extends RoundData {
  sourceVoltage: number; // e.g. 9.0 V
  bulb1Resistance: number; // e.g. 10.0 Ω
  bulb2Resistance: number; // e.g. 10.0 Ω
  correctCircuitType: CircuitType; // 'parallel'
}

export interface CircuitState {
  circuitType: CircuitType;
  isPowerOn: boolean;
  isSwitchClosed: boolean;
  isBulb1Installed: boolean;
  isBulb2Installed: boolean;
  voltage: number;
  current: number;
  totalResistance: number;
  power: number;
  bulb1Lit: boolean;
  bulb2Lit: boolean;
  statusText: string;
  diagnostic: 'ACTIVE' | 'OPEN' | 'SHORT' | 'FAULT';
}

/**
 * Calculates real-time electrical parameters based on circuit wiring and bulb status
 */
export function analyzeCircuitState(
  circuitType: CircuitType,
  isPowerOn: boolean,
  isSwitchClosed: boolean,
  isBulb1Installed: boolean,
  isBulb2Installed: boolean,
  vSource: number = 9.0,
  rBulb1: number = 10.0,
  rBulb2: number = 10.0
): CircuitState {
  if (!isPowerOn || !isSwitchClosed) {
    return {
      circuitType,
      isPowerOn,
      isSwitchClosed,
      isBulb1Installed,
      isBulb2Installed,
      voltage: vSource,
      current: 0.0,
      totalResistance: 0.0,
      power: 0.0,
      bulb1Lit: false,
      bulb2Lit: false,
      statusText: !isPowerOn ? 'SYSTEM POWER OFF' : 'SWITCH OPEN: Circuit Interrupted',
      diagnostic: 'OPEN',
    };
  }

  if (circuitType === 'short') {
    return {
      circuitType,
      isPowerOn,
      isSwitchClosed,
      isBulb1Installed,
      isBulb2Installed,
      voltage: vSource,
      current: 99.9,
      totalResistance: 0.05,
      power: 899.1,
      bulb1Lit: false,
      bulb2Lit: false,
      statusText: '⚠ SHORT CIRCUIT DETECTED: Fuse Breaker Tripped!',
      diagnostic: 'SHORT',
    };
  }

  if (circuitType === 'none') {
    return {
      circuitType,
      isPowerOn,
      isSwitchClosed,
      isBulb1Installed,
      isBulb2Installed,
      voltage: vSource,
      current: 0.0,
      totalResistance: Infinity,
      power: 0.0,
      bulb1Lit: false,
      bulb2Lit: false,
      statusText: '⚠ OPEN CIRCUIT: No continuous conductive loop detected.',
      diagnostic: 'OPEN',
    };
  }

  if (circuitType === 'series') {
    // Both bulbs in single series loop
    if (!isBulb1Installed || !isBulb2Installed) {
      // Removing any bulb breaks the entire single series path!
      return {
        circuitType,
        isPowerOn,
        isSwitchClosed,
        isBulb1Installed,
        isBulb2Installed,
        voltage: vSource,
        current: 0.0,
        totalResistance: Infinity,
        power: 0.0,
        bulb1Lit: false,
        bulb2Lit: false,
        statusText: '⚠ SERIES PATH BROKEN: Removing one bulb turns OFF the entire loop!',
        diagnostic: 'FAULT',
      };
    }

    const req = rBulb1 + rBulb2; // 20.0 Ω
    const current = vSource / req; // 0.45 A
    const power = vSource * current; // 4.05 W

    return {
      circuitType,
      isPowerOn,
      isSwitchClosed,
      isBulb1Installed,
      isBulb2Installed,
      voltage: vSource,
      current: Number(current.toFixed(2)),
      totalResistance: Number(req.toFixed(1)),
      power: Number(power.toFixed(2)),
      bulb1Lit: true,
      bulb2Lit: true,
      statusText: '⚡ SERIES ACTIVE: Single continuous path. Both bulbs illuminated at half voltage (4.5V each).',
      diagnostic: 'ACTIVE',
    };
  }

  // Parallel Circuit
  if (circuitType === 'parallel') {
    if (!isBulb1Installed && !isBulb2Installed) {
      return {
        circuitType,
        isPowerOn,
        isSwitchClosed,
        isBulb1Installed,
        isBulb2Installed,
        voltage: vSource,
        current: 0.0,
        totalResistance: Infinity,
        power: 0.0,
        bulb1Lit: false,
        bulb2Lit: false,
        statusText: '⚠ BOTH BULBS REMOVED: Open circuit.',
        diagnostic: 'OPEN',
      };
    }

    if (isBulb1Installed && isBulb2Installed) {
      // 1/Req = 1/10 + 1/10 = 2/10 -> Req = 5.0 Ω
      const req = (rBulb1 * rBulb2) / (rBulb1 + rBulb2); // 5.0 Ω
      const current = vSource / req; // 0.90 A
      const power = vSource * current; // 8.10 W

      return {
        circuitType,
        isPowerOn,
        isSwitchClosed,
        isBulb1Installed,
        isBulb2Installed,
        voltage: vSource,
        current: Number(current.toFixed(2)),
        totalResistance: Number(req.toFixed(1)),
        power: Number(power.toFixed(2)),
        bulb1Lit: true,
        bulb2Lit: true,
        statusText: '⚡ PARALLEL ACTIVE: Dual independent branches. Full 9V across both bulbs! Current splits at junction.',
        diagnostic: 'ACTIVE',
      };
    }

    // Only 1 bulb installed in Parallel (Independent branch remains ON!)
    const activeResistance = isBulb1Installed ? rBulb1 : rBulb2;
    const current = vSource / activeResistance; // 0.90 A for 1 bulb
    const power = vSource * current;

    return {
      circuitType,
      isPowerOn,
      isSwitchClosed,
      isBulb1Installed,
      isBulb2Installed,
      voltage: vSource,
      current: Number(current.toFixed(2)),
      totalResistance: Number(activeResistance.toFixed(1)),
      power: Number(power.toFixed(2)),
      bulb1Lit: isBulb1Installed,
      bulb2Lit: isBulb2Installed,
      statusText: '✓ INDEPENDENT BRANCH ACTIVE: One bulb removed, but alternate branch REMAINS ILLUMINATED!',
      diagnostic: 'ACTIVE',
    };
  }

  return {
    circuitType: 'none',
    isPowerOn: false,
    isSwitchClosed: false,
    isBulb1Installed: true,
    isBulb2Installed: true,
    voltage: vSource,
    current: 0,
    totalResistance: 0,
    power: 0,
    bulb1Lit: false,
    bulb2Lit: false,
    statusText: 'UNKNOWN STATE',
    diagnostic: 'OPEN',
  };
}

/**
 * Generates Game 6 data
 */
export function generateVoltSeriesParallelRound(): VoltSeriesParallelRoundData {
  return {
    id: 'volt-series-parallel-game-6',
    conceptId: 206,
    conceptName: 'Series vs. Parallel Puzzle',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 1,
    gravity: 9.8,
    correctVelocity: 1,
    sourceVoltage: 9.0,
    bulb1Resistance: 10.0,
    bulb2Resistance: 10.0,
    correctCircuitType: 'parallel',
  };
}

/**
 * Evaluates Game 6 submission
 */
export function evaluateSeriesParallelSubmission(
  userCircuitType: CircuitType,
  hasTestedRemoval: boolean
): { tier: ScoreTier; errorPercentage: number; xpEarned: number } {
  if (userCircuitType === 'parallel' && hasTestedRemoval) {
    return { tier: 'hit', errorPercentage: 0, xpEarned: 500 };
  } else if (userCircuitType === 'parallel') {
    return { tier: 'close', errorPercentage: 10, xpEarned: 250 };
  } else {
    return { tier: 'miss', errorPercentage: 50, xpEarned: 50 };
  }
}
