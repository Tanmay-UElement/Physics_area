'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { MomentumCanvas } from '@/components/match/MomentumCanvas';
import { MomentumSolvePanel } from '@/components/match/MomentumSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  MomentumAttemptLog,
  MomentumState,
  MomentumRoundData,
  analyzeMomentumState,
  evaluateMomentumSubmission,
} from '@/lib/physics/momentumConservation';
import { RoundResult } from '@/lib/physics/types';

export default function MomentumConservationPage() {
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

  // Workbench State
  const [scenarioMode, setScenarioMode] = useState<'LAB_TRACK' | 'SPACECRAFT_DOCKING' | 'ZERO_MOMENTUM'>('LAB_TRACK');
  const [massA, setMassA] = useState<number>(4.0);
  const [velA, setVelA] = useState<number>(3.0);
  const [massB, setMassB] = useState<number>(1.5);
  const [velB, setVelB] = useState<number>(-1.0);

  const [predictedVf, setPredictedVf] = useState<number | null>(null);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);
  const [isCollisionReleased, setIsCollisionReleased] = useState<boolean>(false);
  const [isCollisionComplete, setIsCollisionComplete] = useState<boolean>(false);

  const [showMomentumVectors, setShowMomentumVectors] = useState<boolean>(true);
  const [showSystemBoundary, setShowSystemBoundary] = useState<boolean>(true);

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [experimentLog, setExperimentLog] = useState<MomentumAttemptLog[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('momentum-conservation');
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

  const roundData = (currentRound as MomentumRoundData) || {
    id: 'momentum-round-1',
    conceptId: 106,
    conceptName: 'Momentum Conservation (Unequal Mass)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 1.86,
    gravity: 9.8,
    correctVelocity: 1.86,
    mass1: massA,
    velocity1: velA,
    mass2: massB,
    velocity2: velB,
    totalMomentum: massA * velA + massB * velB,
    correctFinalVelocity: 1.86,
  };

  const momentumState: MomentumState = analyzeMomentumState(
    scenarioMode,
    massA,
    velA,
    massB,
    velB,
    predictedVf,
    predictionLocked,
    isCollisionReleased,
    isCollisionComplete,
    showMomentumVectors,
    showSystemBoundary,
    true,
    'LAB_VIEW',
    1.0,
    attemptCount,
    experimentLog
  );

  const handleStartExperiment = (predVf: number) => {
    setPredictedVf(predVf);
    setPredictionLocked(true);
    setIsCollisionReleased(true);
  };

  const handleCollisionComplete = () => {
    setIsCollisionComplete(true);
    setAttemptCount((prev) => prev + 1);

    if (predictedVf !== null) {
      setExperimentLog((prev) => [
        {
          attemptNum: attemptCount,
          massA,
          velA,
          massB,
          velB,
          predictedVf,
          actualVf: momentumState.actualVf,
          errorPercentage: Math.abs(predictedVf - momentumState.actualVf),
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleCompleteMomentum = () => {
    const evalRes = evaluateMomentumSubmission(momentumState.actualVf, predictedVf || 0);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: predictedVf || 0,
      correctVelocity: momentumState.actualVf,
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
    return <LoadingOverlay conceptName="Predict & Reveal — Momentum Collision Lab" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader
        onOpenTutorial={() => setShowTutorial(true)}
        onPlayAgain={() => {
          setPredictedVf(null);
          setPredictionLocked(false);
          setIsCollisionReleased(false);
          setIsCollisionComplete(false);
          setCurrentResult(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero Section Canvas (Laboratory Collision Track) */}
        <div className="w-full min-h-[480px]">
          <MomentumCanvas
            round={roundData}
            momentumState={momentumState}
            theme={theme}
            onCollisionComplete={handleCollisionComplete}
            onToggleVectors={() => setShowMomentumVectors((prev) => !prev)}
            onToggleSystemBoundary={() => setShowSystemBoundary((prev) => !prev)}
          />
        </div>

        {/* Bottom Control Panel View */}
        <div className="w-full">
          <MomentumSolvePanel
            round={roundData}
            momentumState={momentumState}
            theme={theme}
            onMassAChange={(mA) => setMassA(mA)}
            onVelAChange={(vA) => setVelA(vA)}
            onMassBChange={(mB) => setMassB(mB)}
            onVelBChange={(vB) => setVelB(vB)}
            onSelectScenario={(s) => {
              setScenarioMode(s);
              setPredictedVf(null);
              setPredictionLocked(false);
              setIsCollisionReleased(false);
              setIsCollisionComplete(false);
              if (s === 'ZERO_MOMENTUM') {
                setMassA(4.0);
                setVelA(2.0);
                setMassB(2.0);
                setVelB(-4.0); // pTotal = 4*2 + 2*(-4) = 0
              }
            }}
            onStartExperiment={handleStartExperiment}
            onResetSimulation={() => {
              setPredictedVf(null);
              setPredictionLocked(false);
              setIsCollisionReleased(false);
              setIsCollisionComplete(false);
            }}
            onCompleteMomentum={handleCompleteMomentum}
          />
        </div>
      </main>

      <ResultModal
        result={currentResult}
        isLastRound={true}
        onNext={() => router.push('/class-select')}
        onPlayAgain={() => {
          setPredictedVf(null);
          setPredictionLocked(false);
          setIsCollisionReleased(false);
          setIsCollisionComplete(false);
          setCurrentResult(null);
        }}
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
