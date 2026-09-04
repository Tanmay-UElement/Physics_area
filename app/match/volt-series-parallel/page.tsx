'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { VoltSeriesParallelCanvas } from '@/components/match/VoltSeriesParallelCanvas';
import { VoltSeriesParallelSolvePanel } from '@/components/match/VoltSeriesParallelSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  CircuitState,
  CircuitType,
  VoltSeriesParallelRoundData,
  analyzeCircuitState,
  evaluateSeriesParallelSubmission,
} from '@/lib/physics/voltSeriesParallel';
import { RoundResult } from '@/lib/physics/types';

export default function VoltSeriesParallelPage() {
  const router = useRouter();
  const {
    currentRound,
    startMatch,
    recordRoundResult,
    isMatchCompleted,
    hasCompletedTutorial,
    setHasCompletedTutorial,
    theme,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);

  // Interactive Circuit Controls State
  const [circuitType, setCircuitType] = useState<CircuitType>('series');
  const [isPowerOn, setIsPowerOn] = useState<boolean>(true);
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(true);
  const [isBulb1Installed, setIsBulb1Installed] = useState<boolean>(true);
  const [isBulb2Installed, setIsBulb2Installed] = useState<boolean>(true);
  const [hasTestedRemoval, setHasTestedRemoval] = useState<boolean>(false);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('volt-series-parallel');
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!hasCompletedTutorial) {
        setShowTutorial(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMatchCompleted) {
      router.push('/match/trick-shot/summary');
    }
  }, [isMatchCompleted, router]);

  const generatorRound = (currentRound as VoltSeriesParallelRoundData) || {
    id: 'volt-sp-1',
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
    correctCircuitType: 'parallel' as CircuitType,
  };

  const circuitState: CircuitState = analyzeCircuitState(
    circuitType,
    isPowerOn,
    isSwitchClosed,
    isBulb1Installed,
    isBulb2Installed,
    generatorRound.sourceVoltage,
    generatorRound.bulb1Resistance,
    generatorRound.bulb2Resistance
  );

  const handleToggleBulb1 = () => {
    setIsBulb1Installed((prev) => !prev);
    setHasTestedRemoval(true);
  };

  const handleCompleteDesign = () => {
    const evalRes = evaluateSeriesParallelSubmission(circuitType, hasTestedRemoval);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: circuitType === 'parallel' ? 1 : 0,
      correctVelocity: 1,
      errorPercentage: evalRes.errorPercentage,
      tier: evalRes.tier,
      xpEarned: evalRes.xpEarned,
      actualLandingX: 1,
      targetX: 1,
      trajectoryPoints: [],
      idealTrajectoryPoints: [],
    };

    setCurrentResult(result);
    recordRoundResult(result);
  };

  if (isLoading) {
    return <LoadingOverlay conceptName="Series vs. Parallel Puzzle (Game 6)" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 min-h-[480px]">
          <VoltSeriesParallelCanvas
            round={generatorRound}
            circuitState={circuitState}
            theme={theme}
            onSimulationComplete={() => {}}
          />
        </div>

        <div className="lg:col-span-5">
          <VoltSeriesParallelSolvePanel
            round={generatorRound}
            circuitState={circuitState}
            theme={theme}
            onCircuitTypeChange={(type) => setCircuitType(type)}
            onTogglePower={() => setIsPowerOn((prev) => !prev)}
            onToggleSwitch={() => setIsSwitchClosed((prev) => !prev)}
            onToggleBulb1={handleToggleBulb1}
            onResetCircuit={() => {
              setCircuitType('series');
              setIsPowerOn(true);
              setIsSwitchClosed(true);
              setIsBulb1Installed(true);
              setIsBulb2Installed(true);
            }}
            onCompleteDesign={handleCompleteDesign}
          />
        </div>
      </main>

      <ResultModal
        result={currentResult}
        isLastRound={true}
        onNext={() => router.push('/class-select')}
      />

      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          setHasCompletedTutorial(true);
        }}
      />
    </div>
  );
}
