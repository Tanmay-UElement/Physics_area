import { create } from 'zustand';
import { RoundData, RoundResult, SessionStats } from '../lib/physics/types';
import { ClassXP, getClassGroup } from '../lib/pod/podPhysicsTypes';
import { generateHorizontalRounds } from '../lib/physics/horizontalProjectile';
import { generateLeverRounds } from '../lib/physics/leverBalance';
import { generateVectorRounds } from '../lib/physics/vectorTug';
import { generateFreeFallRounds } from '../lib/physics/freeFall';
import { generateElasticRounds } from '../lib/physics/elasticCollision';
import { generateMomentumRounds } from '../lib/physics/momentumConservation';
import { generateVoltCircuitRounds } from '../lib/physics/voltCircuitBuilder';
import { generateVoltCoulombRounds } from '../lib/physics/voltCoulombTug';
import { generateVoltMagneticRounds } from '../lib/physics/voltMagneticMaze';
import { generateVoltCapacitorRounds } from '../lib/physics/voltCapacitorRace';
import { generateVoltKirchhoffRounds } from '../lib/physics/voltKirchhoff';
import { generateVoltGeneratorRounds } from '../lib/physics/voltGeneratorCrank';
import { generateVoltSeriesParallelRound } from '../lib/physics/voltSeriesParallel';
import { generateVoltPowerGridRound } from '../lib/physics/voltPowerGrid';
import { generateWaveRefractionRound } from '../lib/physics/waveRefraction';
import { generateWaveDopplerRound } from '../lib/physics/waveDoppler';
import { generateWaveInterferenceRound } from '../lib/physics/waveInterference';
import { generateWaveResonanceRound } from '../lib/physics/waveResonance';

export type AppTheme = 'dark' | 'light';
export type GameModeKey =
  | 'trick-shot'
  | 'lever-balance'
  | 'vector-tug'
  | 'free-fall'
  | 'elastic-collision'
  | 'momentum-conservation'
  | 'volt-circuit-builder'
  | 'volt-coulomb-tug'
  | 'volt-magnetic-maze'
  | 'volt-capacitor-race'
  | 'volt-kirchhoff'
  | 'volt-generator-crank'
  | 'volt-series-parallel'
  | 'volt-power-grid'
  | 'wave-refraction'
  | 'wave-doppler'
  | 'wave-interference'
  | 'wave-resonance';

interface GameState {
  // Theme state
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;

  // Active match state
  activeMode: GameModeKey;
  rounds: RoundData[];
  currentRoundIndex: number;
  currentRound: RoundData | null;
  roundResults: RoundResult[];
  isMatchCompleted: boolean;

  // Session global state (in-memory, cleared on refresh)
  sessionXP: number;
  sessionStats: SessionStats;
  hasCompletedTutorial: boolean;

  // Canvas animation state
  isSimulating: boolean;
  simulationResult: RoundResult | null;

  // Active agent state
  activeAgentId: 'aura-9' | 'titan-x' | 'synapse' | 'nova';
  setActiveAgent: (id: 'aura-9' | 'titan-x' | 'synapse' | 'nova') => void;

  // ── Pod physics state ─────────────────────────────────────────────────────
  /** Current hint aperture tier (0=closed, 1=nudge, 2=formula, 3=setup) */
  podHintTier: 0 | 1 | 2 | 3;
  /** Unix ms of last player input — used for idle sensing */
  lastInputTimestamp: number;
  /** Per-class XP for agent maturity system */
  classXP: ClassXP;
  /** Latest player input value (raw, for error-trend tracking) */
  lastPlayerInputValue: number | null;
  /** Previous player input value (for trend comparison) */
  prevPlayerInputValue: number | null;

  // Actions
  startMatch: (mode?: GameModeKey) => void;
  recordRoundResult: (result: RoundResult) => void;
  nextRound: () => void;
  restartCurrentMatch: () => void;
  setSimulating: (simulating: boolean) => void;
  setHasCompletedTutorial: (completed: boolean) => void;
  /** Cycle pod hint tier: 0→1→2→3→0 */
  cyclePodHintTier: () => void;
  /** Reset hint tier to closed */
  closePodHint: () => void;
  /** Record a player input value for idle and trend sensing */
  recordPlayerInput: (value: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),

  activeMode: 'trick-shot',
  rounds: [],
  currentRoundIndex: 0,
  currentRound: null,
  roundResults: [],
  isMatchCompleted: false,

  sessionXP: 0,
  sessionStats: {
    totalMatches: 0,
    totalRoundsPlayed: 0,
    totalXP: 0,
    hitsCount: 0,
    closeCount: 0,
    missCount: 0,
    accuracy: 0,
    matchHistory: [],
  },
  hasCompletedTutorial: false,

  isSimulating: false,
  simulationResult: null,

  activeAgentId: 'aura-9',
  setActiveAgent: (id) => set({ activeAgentId: id }),

  // Pod physics initial state
  podHintTier: 0,
  lastInputTimestamp: Date.now(),
  classXP: { kinetic: 0, volt: 0, wave: 0 },
  lastPlayerInputValue: null,
  prevPlayerInputValue: null,

  startMatch: (mode = 'trick-shot') => {
    let rounds: RoundData[] = [];
    if (mode === 'lever-balance') {
      rounds = generateLeverRounds();
    } else if (mode === 'vector-tug') {
      rounds = generateVectorRounds();
    } else if (mode === 'free-fall') {
      rounds = generateFreeFallRounds();
    } else if (mode === 'elastic-collision') {
      rounds = generateElasticRounds();
    } else if (mode === 'momentum-conservation') {
      rounds = generateMomentumRounds();
    } else if (mode === 'volt-circuit-builder') {
      rounds = generateVoltCircuitRounds();
    } else if (mode === 'volt-coulomb-tug') {
      rounds = generateVoltCoulombRounds();
    } else if (mode === 'volt-magnetic-maze') {
      rounds = generateVoltMagneticRounds();
    } else if (mode === 'volt-capacitor-race') {
      rounds = generateVoltCapacitorRounds();
    } else if (mode === 'volt-kirchhoff') {
      rounds = generateVoltKirchhoffRounds();
    } else if (mode === 'volt-generator-crank') {
      rounds = generateVoltGeneratorRounds();
    } else if (mode === 'volt-series-parallel') {
      rounds = [generateVoltSeriesParallelRound()];
    } else if (mode === 'volt-power-grid') {
      rounds = [generateVoltPowerGridRound()];
    } else if (mode === 'wave-refraction') {
      rounds = [generateWaveRefractionRound()];
    } else if (mode === 'wave-doppler') {
      rounds = [generateWaveDopplerRound()];
    } else if (mode === 'wave-interference') {
      rounds = [generateWaveInterferenceRound()];
    } else if (mode === 'wave-resonance') {
      rounds = [generateWaveResonanceRound()];
    } else {
      rounds = generateHorizontalRounds();
    }

    set({
      activeMode: mode,
      rounds,
      currentRoundIndex: 0,
      currentRound: rounds[0] || null,
      roundResults: [],
      isMatchCompleted: false,
      isSimulating: false,
      simulationResult: null,
      // Reset pod state for new match
      podHintTier: 0,
      lastInputTimestamp: Date.now(),
      lastPlayerInputValue: null,
      prevPlayerInputValue: null,
    });
  },

  recordRoundResult: (result: RoundResult) => {
    const { roundResults, sessionXP, sessionStats, rounds, currentRoundIndex } = get();
    const updatedResults = [...roundResults, result];
    const newXP = sessionXP + result.xpEarned;

    const hitsCount = sessionStats.hitsCount + (result.tier === 'hit' ? 1 : 0);
    const closeCount = sessionStats.closeCount + (result.tier === 'close' ? 1 : 0);
    const missCount = sessionStats.missCount + (result.tier === 'miss' ? 1 : 0);
    const totalRoundsPlayed = sessionStats.totalRoundsPlayed + 1;
    const accuracy = Number(((hitsCount / totalRoundsPlayed) * 100).toFixed(1));

    const isMatchEnd = currentRoundIndex >= rounds.length - 1;

    let updatedHistory = [...sessionStats.matchHistory];
    let totalMatches = sessionStats.totalMatches;

    if (isMatchEnd) {
      totalMatches += 1;
      const matchScore = updatedResults.reduce((acc, r) => acc + r.xpEarned, 0);
      updatedHistory.unshift({
        id: `match-${Date.now()}`,
        conceptName: rounds[0]?.conceptName || 'Physics Challenge',
        timestamp: Date.now(),
        score: matchScore,
        totalRounds: rounds.length,
        xpEarned: matchScore,
      });
    }

    // Update per-class XP for the maturity system
    const classGroup = getClassGroup(get().activeMode);
    const updatedClassXP = { ...get().classXP };
    updatedClassXP[classGroup] = (updatedClassXP[classGroup] || 0) + result.xpEarned;

    set({
      roundResults: updatedResults,
      sessionXP: newXP,
      simulationResult: result,
      isMatchCompleted: isMatchEnd,
      classXP: updatedClassXP,
      sessionStats: {
        totalMatches,
        totalRoundsPlayed,
        totalXP: sessionStats.totalXP + result.xpEarned,
        hitsCount,
        closeCount,
        missCount,
        accuracy,
        matchHistory: updatedHistory,
      },
    });
  },

  nextRound: () => {
    const { rounds, currentRoundIndex } = get();
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < rounds.length) {
      set({
        currentRoundIndex: nextIndex,
        currentRound: rounds[nextIndex],
        simulationResult: null,
        isSimulating: false,
      });
    } else {
      set({
        isMatchCompleted: true,
        simulationResult: null,
        isSimulating: false,
      });
    }
  },

  restartCurrentMatch: () => {
    const { startMatch, activeMode } = get();
    startMatch(activeMode);
  },

  setSimulating: (simulating: boolean) => set({ isSimulating: simulating }),
  setHasCompletedTutorial: (completed: boolean) => set({ hasCompletedTutorial: completed }),

  cyclePodHintTier: () => set((state) => ({
    podHintTier: ((state.podHintTier + 1) % 4) as 0 | 1 | 2 | 3,
  })),

  closePodHint: () => set({ podHintTier: 0 }),

  recordPlayerInput: (value: number) => set((state) => ({
    prevPlayerInputValue: state.lastPlayerInputValue,
    lastPlayerInputValue: value,
    lastInputTimestamp: Date.now(),
  })),
}));
