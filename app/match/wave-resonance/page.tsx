'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { WaveResonanceCanvas } from '@/components/match/WaveResonanceCanvas';
import { WaveResonanceSolvePanel } from '@/components/match/WaveResonanceSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  ResonanceExperimentLog,
  ResonanceState,
  WaveResonanceRoundData,
  analyzeResonanceState,
  evaluateResonanceSubmission,
} from '@/lib/physics/waveResonance';
import { RoundResult } from '@/lib/physics/types';

export default function WaveResonancePage() {
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

  // Simulation & Workbench State
  const [mode, setMode] = useState<'STRING' | 'AIR_COLUMN'>('STRING');
  const [tubeBoundary, setTubeBoundary] = useState<'CLOSED_ONE_END' | 'OPEN_BOTH_ENDS'>('CLOSED_ONE_END');
  const [puzzleType, setPuzzleType] = useState<'FIND_FUNDAMENTAL' | 'CREATE_3RD_HARMONIC' | 'TUNE_TO_440HZ' | 'UNKNOWN_TENSION'>('CREATE_3RD_HARMONIC');

  const [stringLengthM, setStringLengthM] = useState<number>(1.2);
  const [tensionN, setTensionN] = useState<number>(40);
  const [tubeLengthM, setTubeLengthM] = useState<number>(0.85);

  const [driverFrequencyHz, setDriverFrequencyHz] = useState<number>(120);
  const [driverAmplitude, setDriverAmplitude] = useState<number>(1.0);

  const [showIncidentWave, setShowIncidentWave] = useState<boolean>(true);
  const [showReflectedWave, setShowReflectedWave] = useState<boolean>(true);
  const [showResultantWave, setShowResultantWave] = useState<boolean>(true);
  const [showNodesAntinodes, setShowNodesAntinodes] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<'LAB_VIEW' | 'CLOSE_UP' | 'SUPERPOSITION_VIEW'>('LAB_VIEW');

  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepGraphPoints, setSweepGraphPoints] = useState<{ freq: number; amp: number }[]>([]);

  const [predictedHz, setPredictedHz] = useState<number | null>(null);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [experimentLog, setExperimentLog] = useState<ResonanceExperimentLog[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('wave-resonance');
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

  // Automated Sweeper Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSweeping) {
      interval = setInterval(() => {
        setDriverFrequencyHz((prev) => {
          if (prev >= 450) {
            setIsSweeping(false);
            return 20;
          }
          return prev + 4;
        });
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSweeping]);

  const roundData = (currentRound as WaveResonanceRoundData) || {
    id: 'wave-resonance-game-4',
    conceptId: 304,
    conceptName: 'Resonance Studio (Harmonics & Standing Waves)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 120,
    gravity: 9.8,
    correctVelocity: 1,
    soundSpeedAirMps: 343,
    defaultLinearDensityKgM: 0.004,
    defaultStringLengthM: 1.2,
    defaultTensionN: 40,
    defaultTubeLengthM: 0.85,
  };

  const resonanceState: ResonanceState = analyzeResonanceState(
    mode,
    tubeBoundary,
    stringLengthM,
    tensionN,
    0.004,
    tubeLengthM,
    driverFrequencyHz,
    driverAmplitude,
    puzzleType,
    showIncidentWave,
    showReflectedWave,
    showResultantWave,
    showNodesAntinodes,
    cameraView,
    isSweeping,
    sweepGraphPoints,
    predictedHz,
    null,
    predictionLocked,
    attemptCount,
    experimentLog
  );

  const handleFrequencyChange = (freqHz: number) => {
    setDriverFrequencyHz(freqHz);
  };

  const handleLengthChange = (lM: number) => {
    if (mode === 'STRING') setStringLengthM(lM);
    else setTubeLengthM(lM);
  };

  const handleTensionChange = (tN: number) => {
    setTensionN(tN);
  };

  const handleRunExperiment = (predHz: number) => {
    setPredictedHz(predHz);
    setPredictionLocked(true);
    setAttemptCount((prev) => prev + 1);

    setExperimentLog((prev) => [
      {
        attemptNum: attemptCount,
        systemType: mode,
        lengthM: mode === 'STRING' ? stringLengthM : tubeLengthM,
        tensionN,
        frequencyHz: driverFrequencyHz,
        measuredAmp: resonanceState.responseAmplitude,
        detectedMode: resonanceState.activeHarmonicMode,
        predictedHz: predHz,
      },
      ...prev.slice(0, 4),
    ]);
  };

  const handleCompleteResonance = () => {
    const evalRes = evaluateResonanceSubmission(resonanceState);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: driverFrequencyHz,
      correctVelocity: resonanceState.targetFrequencyHz,
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
    return <LoadingOverlay conceptName="Resonance Studio (Standing Waves & Harmonics)" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero Section Canvas (Vibrating String & Tube Rig) */}
        <div className="w-full min-h-[480px]">
          <WaveResonanceCanvas
            round={roundData}
            resonanceState={resonanceState}
            theme={theme}
            onSimulationComplete={() => {}}
            onToggleNodesAntinodes={() => setShowNodesAntinodes((prev) => !prev)}
            onToggleSuperpositionWave={() => setShowResultantWave((prev) => !prev)}
            onChangeCameraView={(v) => setCameraView(v)}
          />
        </div>

        {/* Bottom Control Panel View */}
        <div className="w-full">
          <WaveResonanceSolvePanel
            round={roundData}
            resonanceState={resonanceState}
            theme={theme}
            onFrequencyChange={handleFrequencyChange}
            onLengthChange={handleLengthChange}
            onTensionChange={handleTensionChange}
            onSelectSystemMode={(sm) => setMode(sm)}
            onSelectTubeBoundary={(tb) => setTubeBoundary(tb)}
            onSelectPuzzleType={(pt) => setPuzzleType(pt)}
            onToggleSweep={() => setIsSweeping((prev) => !prev)}
            onRunExperiment={handleRunExperiment}
            onResetSimulation={() => {
              setDriverFrequencyHz(120);
              setStringLengthM(1.2);
              setTensionN(40);
              setPredictedHz(null);
              setPredictionLocked(false);
            }}
            onCompleteResonance={handleCompleteResonance}
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
