'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { FreeFallCanvas } from '@/components/match/FreeFallCanvas';
import { FreeFallSolvePanel } from '@/components/match/FreeFallSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  FreeFallExperimentLog,
  FreeFallState,
  FreeFallRoundData,
  analyzeFreeFallState,
  evaluateFreeFallTimeSubmission,
} from '@/lib/physics/freeFall';
import { RoundResult } from '@/lib/physics/types';

export default function FreeFallPage() {
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
  const [scenarioMode, setScenarioMode] = useState<'HEAVY_VS_LIGHT' | 'UPWARD_LAUNCH' | 'VACUUM_CHAMBER' | 'PLANET_GRAVITY' | 'FIND_G'>('HEAVY_VS_LIGHT');
  const [dropHeightM, setDropHeightM] = useState<number>(20.0);
  const [initialVelocityMps, setInitialVelocityMps] = useState<number>(0.0);
  const [planetGravityMps2, setPlanetGravityMps2] = useState<number>(9.81);
  const [planetName, setPlanetName] = useState<string>('Earth');
  const [airResistanceOn, setAirResistanceOn] = useState<boolean>(false);

  const [predictedTimeSec, setPredictedTimeSec] = useState<number | null>(null);
  const [predictedFirstLanding, setPredictedFirstLanding] = useState<'A' | 'B' | 'SAME' | null>('SAME');
  const [predictedPeakAccel, setPredictedPeakAccel] = useState<number | null>(-9.81);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);
  const [isDropReleased, setIsDropReleased] = useState<boolean>(false);
  const [isDropComplete, setIsDropComplete] = useState<boolean>(false);

  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showForceInspector, setShowForceInspector] = useState<boolean>(true);

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [experimentLog, setExperimentLog] = useState<FreeFallExperimentLog[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('free-fall');
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

  const roundData = (currentRound as FreeFallRoundData) || {
    id: 'free-fall-round-1',
    conceptId: 104,
    conceptName: 'Free Fall / Gravity Misconception',
    roundNumber: 1,
    totalRounds: 1,
    height: dropHeightM,
    distance: 2.02,
    gravity: planetGravityMps2,
    correctVelocity: 2.02,
    heavyMass: 5.0,
    lightMass: 0.5,
    dropHeight: dropHeightM,
    correctFallTime: 2.02,
  };

  const freeFallState: FreeFallState = analyzeFreeFallState(
    scenarioMode,
    dropHeightM,
    initialVelocityMps,
    planetGravityMps2,
    planetName,
    airResistanceOn,
    5.0,
    0.5,
    predictedTimeSec,
    predictedFirstLanding,
    predictedPeakAccel,
    predictionLocked,
    isDropReleased,
    isDropComplete,
    showVectors,
    showForceInspector,
    true,
    'LAB_VIEW',
    attemptCount,
    experimentLog
  );

  const handleStartExperiment = (predTime: number, landingPred: 'A' | 'B' | 'SAME', peakAccelPred: number) => {
    setPredictedTimeSec(predTime);
    setPredictedFirstLanding(landingPred);
    setPredictedPeakAccel(peakAccelPred);
    setPredictionLocked(true);
    setIsDropReleased(true);
  };

  const handleDropComplete = () => {
    setIsDropComplete(true);
    setAttemptCount((prev) => prev + 1);

    if (predictedTimeSec !== null) {
      setExperimentLog((prev) => [
        {
          attemptNum: attemptCount,
          scenario: scenarioMode,
          heightM: dropHeightM,
          gravityMps2: planetGravityMps2,
          predictedTimeSec,
          actualTimeSec: freeFallState.calculatedFallTimeSec,
          errorPercentage: Math.abs(predictedTimeSec - freeFallState.calculatedFallTimeSec),
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleCompleteFreeFall = () => {
    const evalRes = evaluateFreeFallTimeSubmission(freeFallState.calculatedFallTimeSec, predictedTimeSec || 0);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: predictedTimeSec || 0,
      correctVelocity: freeFallState.calculatedFallTimeSec,
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
    return <LoadingOverlay conceptName="Gravity Lab — Predict & Reveal" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader
        onOpenTutorial={() => setShowTutorial(true)}
        onPlayAgain={() => {
          setPredictedTimeSec(null);
          setPredictionLocked(false);
          setIsDropReleased(false);
          setIsDropComplete(false);
          setCurrentResult(null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero Section Canvas (Drop Tower Chamber) */}
        <div className="w-full min-h-[480px]">
          <FreeFallCanvas
            round={roundData}
            freeFallState={freeFallState}
            theme={theme}
            onDropComplete={handleDropComplete}
            onToggleVectors={() => setShowVectors((prev) => !prev)}
            onToggleForceInspector={() => setShowForceInspector((prev) => !prev)}
          />
        </div>

        {/* Bottom Control Panel View */}
        <div className="w-full">
          <FreeFallSolvePanel
            round={roundData}
            freeFallState={freeFallState}
            theme={theme}
            onDropHeightChange={(h) => setDropHeightM(h)}
            onInitialVelChange={(v0) => setInitialVelocityMps(v0)}
            onPlanetChange={(g, name) => {
              setPlanetGravityMps2(g);
              setPlanetName(name);
            }}
            onToggleAirResistance={() => setAirResistanceOn((prev) => !prev)}
            onSelectScenario={(s) => {
              setScenarioMode(s);
              setPredictedTimeSec(null);
              setPredictionLocked(false);
              setIsDropReleased(false);
              setIsDropComplete(false);
            }}
            onStartExperiment={handleStartExperiment}
            onResetSimulation={() => {
              setPredictedTimeSec(null);
              setPredictionLocked(false);
              setIsDropReleased(false);
              setIsDropComplete(false);
            }}
            onCompleteFreeFall={handleCompleteFreeFall}
          />
        </div>
      </main>

      <ResultModal
        result={currentResult}
        isLastRound={true}
        onNext={() => router.push('/class-select')}
        onPlayAgain={() => {
          setPredictedTimeSec(null);
          setPredictionLocked(false);
          setIsDropReleased(false);
          setIsDropComplete(false);
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
