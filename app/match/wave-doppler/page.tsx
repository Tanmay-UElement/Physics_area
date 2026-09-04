'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { WaveDopplerCanvas } from '@/components/match/WaveDopplerCanvas';
import { WaveDopplerSolvePanel } from '@/components/match/WaveDopplerSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  DopplerObservation,
  DopplerState,
  WaveDopplerRoundData,
  analyzeDopplerState,
  evaluateDopplerSubmission,
} from '@/lib/physics/waveDoppler';
import { RoundResult } from '@/lib/physics/types';

export default function WaveDopplerPage() {
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

  // Simulation State
  const [baseFreqHz, setBaseFreqHz] = useState<number>(700);
  const [sourceSpeedMps, setSourceSpeedMps] = useState<number>(20);
  const [playerSpeedMps, setPlayerSpeedMps] = useState<number>(10);
  const [sourceX, setSourceX] = useState<number>(20);
  const [playerX, setPlayerX] = useState<number>(140);

  const [cameraMode, setCameraMode] = useState<'OVERVIEW' | 'FOLLOW_SIREN' | 'FOLLOW_PLAYER'>('OVERVIEW');
  const [simSpeedScale, setSimSpeedScale] = useState<number>(1.0);

  const [predictedFreqHz, setPredictedFreqHz] = useState<number | null>(null);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);
  const [observationLog, setObservationLog] = useState<DopplerObservation[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('wave-doppler');
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!hasCompletedTutorial) {
        setShowTutorial(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Continuous Vehicles Motion Tick with Time Scaling
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      const step = 0.05 * simSpeedScale;
      setSourceX((prev) => {
        const next = prev + sourceSpeedMps * step;
        return next > 240 ? 0 : next;
      });
      setPlayerX((prev) => {
        const next = prev + playerSpeedMps * step;
        return next > 240 ? 0 : next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLoading, sourceSpeedMps, playerSpeedMps, simSpeedScale]);

  useEffect(() => {
    if (isMatchCompleted) {
      router.push('/match/trick-shot/summary');
    }
  }, [isMatchCompleted, router]);

  const dopplerRound = (currentRound as WaveDopplerRoundData) || {
    id: 'wave-doppler-1',
    conceptId: 302,
    conceptName: 'Doppler Chase (Doppler Shift)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 120,
    gravity: 9.8,
    correctVelocity: 1,
    baseFrequencyHz: 700,
    sourceSpeedMps: 20,
    playerSpeedMps: 10,
    soundSpeedMps: 343,
    initialDistanceM: 120,
  };

  const dopplerState: DopplerState = analyzeDopplerState(
    baseFreqHz,
    sourceSpeedMps,
    playerSpeedMps,
    sourceX,
    playerX,
    343,
    cameraMode,
    simSpeedScale,
    predictedFreqHz,
    predictionLocked,
    [],
    observationLog
  );

  const handlePredictFrequency = (predFreq: number) => {
    setPredictedFreqHz(predFreq);
    setPredictionLocked(true);

    setObservationLog((prev) => [
      {
        id: prev.length + 1,
        timestampSec: Number((Date.now() / 1000).toFixed(1)),
        distanceM: Number(dopplerState.distanceM.toFixed(1)),
        relVelocityMps: sourceSpeedMps + playerSpeedMps,
        observedFreqHz: dopplerState.observedFreqHz,
        phase: dopplerState.phase,
      },
      ...prev.slice(0, 4),
    ]);
  };

  const handleCompleteChase = () => {
    const evalRes = evaluateDopplerSubmission(dopplerState);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: dopplerState.predictedFreqHz || 0,
      correctVelocity: dopplerState.observedFreqHz,
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
    return <LoadingOverlay conceptName="Doppler Chase (Doppler Shift)" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Simulation View (Hero Section) */}
        <div className="w-full min-h-[480px]">
          <WaveDopplerCanvas
            round={dopplerRound}
            dopplerState={dopplerState}
            theme={theme}
            onSimulationComplete={() => {}}
            onCameraChange={(mode) => setCameraMode(mode)}
            onSpeedScaleChange={(scale) => setSimSpeedScale(scale)}
          />
        </div>

        {/* Bottom Control Panel View */}
        <div className="w-full">
          <WaveDopplerSolvePanel
            round={dopplerRound}
            dopplerState={dopplerState}
            theme={theme}
            onPlayerSpeedChange={(sp) => setPlayerSpeedMps(sp)}
            onSourceSpeedChange={(sp) => setSourceSpeedMps(sp)}
            onBaseFreqChange={(f) => setBaseFreqHz(f)}
            onPredictFrequency={handlePredictFrequency}
            onResetSimulation={() => {
              setSourceX(20);
              setPlayerX(140);
              setPredictionLocked(false);
              setPredictedFreqHz(null);
            }}
            onCompleteChase={handleCompleteChase}
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
