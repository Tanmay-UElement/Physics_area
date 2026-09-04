import { create } from 'zustand';
import { RoundData, RoundResult, SessionStats } from '../lib/physics/types';
import { generateHorizontalRounds } from '../lib/physics/horizontalProjectile';
import { generateLeverRounds } from '../lib/physics/leverBalance';
import { generateVectorRounds } from '../lib/physics/vectorTug';
import { generateFreeFallRounds } from '../lib/physics/freeFall';
import { generateElasticRounds } from '../lib/physics/elasticCollision';
import { generateMomentumRounds } from '../lib/physics/momentumConservation';

export type AppTheme = 'dark' | 'light';
export type GameModeKey =
  | 'trick-shot'
  | 'lever-balance'
  | 'vector-tug'
  | 'free-fall'
  | 'elastic-collision'
  | 'momentum-conservation';

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

  // Actions
  startMatch: (mode?: GameModeKey) => void;
  recordRoundResult: (result: RoundResult) => void;
  nextRound: () => void;
  restartCurrentMatch: () => void;
  setSimulating: (simulating: boolean) => void;
  setHasCompletedTutorial: (completed: boolean) => void;
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

    set({
      roundResults: updatedResults,
      sessionXP: newXP,
      simulationResult: result,
      isMatchCompleted: isMatchEnd,
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
}));
