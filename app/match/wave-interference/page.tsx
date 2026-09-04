'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { WaveInterferenceCanvas } from '@/components/match/WaveInterferenceCanvas';
import { WaveInterferenceSolvePanel } from '@/components/match/WaveInterferenceSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  InterferenceAttemptLog,
  InterferenceState,
  SensorTarget,
  WaveInterferenceRoundData,
  WaveSource,
  analyzeInterferenceState,
  evaluateInterferenceSubmission,
} from '@/lib/physics/waveInterference';
import { RoundResult } from '@/lib/physics/types';

export default function WaveInterferencePage() {
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
  const [mode, setMode] = useState<'SOUND' | 'LIGHT'>('SOUND');
  const [puzzleMode, setPuzzleMode] = useState<'NOISE_CANCELLATION' | 'SIGNAL_AMPLIFICATION' | 'POSITION_PUZZLE'>('NOISE_CANCELLATION');
  const [viewSourceMode, setViewSourceMode] = useState<'BOTH' | 'SOURCE_A' | 'SOURCE_B' | 'RESULTANT'>('BOTH');

  const [sourceA, setSourceA] = useState<WaveSource>({
    id: 'source-a',
    name: 'Speaker A (Noise Source)',
    x: -1.5,
    y: 0.8,
    frequencyHz: 700,
    amplitude: 1.0,
    phaseDeg: 0,
    enabled: true,
  });

  const [sourceB, setSourceB] = useState<WaveSource>({
    id: 'source-b',
    name: 'Speaker B (Cancellation)',
    x: 1.5,
    y: 0.8,
    frequencyHz: 700,
    amplitude: 1.0,
    phaseDeg: 0,
    enabled: true,
  });

  const [activeSensor, setActiveSensor] = useState<SensorTarget>({
    id: 'sensor-1',
    name: 'Red Microphone (Engineer Workstation)',
    x: 0.0,
    y: 2.8,
    mode: 'SILENCE',
    targetDb: 55,
    initialDb: 92,
  });

  const [predictedDb, setPredictedDb] = useState<number | null>(null);
  const [predictedType, setPredictedType] = useState<'CONSTRUCTIVE' | 'DESTRUCTIVE' | null>(null);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);
  const [showPhysicsInspector, setShowPhysicsInspector] = useState<boolean>(false);

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [experimentLog, setExperimentLog] = useState<InterferenceAttemptLog[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('wave-interference');
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

  const roundData = (currentRound as WaveInterferenceRoundData) || {
    id: 'wave-interference-game-3',
    conceptId: 303,
    conceptName: 'Wave Interference Arena (Interference Puzzle)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 120,
    gravity: 9.8,
    correctVelocity: 1,
    soundSpeedMps: 343,
    defaultFrequencyHz: 700,
    sources: [sourceA, sourceB],
    sensorTargets: [activeSensor],
  };

  const interferenceState: InterferenceState = analyzeInterferenceState(
    mode,
    puzzleMode,
    viewSourceMode,
    sourceA,
    sourceB,
    activeSensor,
    roundData.sensorTargets,
    0.20,
    2.0,
    650,
    predictedDb,
    predictedType,
    predictionLocked,
    true,
    showPhysicsInspector,
    attemptCount,
    experimentLog
  );

  const handleSourceAPosChange = (x: number, y: number) => {
    setSourceA((prev) => ({ ...prev, x, y }));
  };

  const handleSourceBPosChange = (x: number, y: number) => {
    setSourceB((prev) => ({ ...prev, x, y }));
  };

  const handleMicPosChange = (x: number, y: number) => {
    setActiveSensor((prev) => ({ ...prev, x, y }));
  };

  const handlePhaseChange = (phaseDeg: number) => {
    setSourceB((prev) => ({ ...prev, phaseDeg }));
  };

  const handleFrequencyChange = (frequencyHz: number) => {
    setSourceA((prev) => ({ ...prev, frequencyHz }));
    setSourceB((prev) => ({ ...prev, frequencyHz }));
  };

  const handleAmplitudeChange = (amplitude: number) => {
    setSourceA((prev) => ({ ...prev, amplitude }));
    setSourceB((prev) => ({ ...prev, amplitude }));
  };

  const handleSelectPuzzleMode = (pmode: 'NOISE_CANCELLATION' | 'SIGNAL_AMPLIFICATION' | 'POSITION_PUZZLE') => {
    setPuzzleMode(pmode);
    if (pmode === 'POSITION_PUZZLE') {
      setSourceB((prev) => ({ ...prev, phaseDeg: 0 })); // Lock phase to 0, force spatial positioning!
    }
  };

  const handleRunExperiment = (predDb: number, predType: 'CONSTRUCTIVE' | 'DESTRUCTIVE') => {
    setPredictedDb(predDb);
    setPredictedType(predType);
    setPredictionLocked(true);
    setAttemptCount((prev) => prev + 1);

    setExperimentLog((prev) => [
      {
        attemptNum: attemptCount,
        phaseDeg: sourceB.phaseDeg,
        speakerBPosM: `(${sourceB.x}, ${sourceB.y})`,
        pathDiffM: interferenceState.pathDiffM,
        measuredDb: interferenceState.measuredDb,
        predictedDb: predDb,
        resultType: interferenceState.interferenceType,
      },
      ...prev.slice(0, 4),
    ]);
  };

  const handleCompleteInterference = () => {
    const evalRes = evaluateInterferenceSubmission(interferenceState);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: sourceB.phaseDeg,
      correctVelocity: 180,
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
    return <LoadingOverlay conceptName="Wave Interference Arena (Active Noise Control Puzzle)" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero Section Canvas (Interactive Draggable Laboratory Setup) */}
        <div className="w-full min-h-[480px]">
          <WaveInterferenceCanvas
            round={roundData}
            interferenceState={interferenceState}
            theme={theme}
            onSimulationComplete={() => {}}
            onSourceAPositionChange={handleSourceAPosChange}
            onSourceBPositionChange={handleSourceBPosChange}
            onMicPositionChange={handleMicPosChange}
            onViewModeChange={(m) => setViewSourceMode(m)}
            onInterferenceModeChange={(m) => setMode(m)}
            onTogglePhysicsInspector={() => setShowPhysicsInspector((prev) => !prev)}
          />
        </div>

        {/* Bottom Control Panel View */}
        <div className="w-full">
          <WaveInterferenceSolvePanel
            round={roundData}
            interferenceState={interferenceState}
            theme={theme}
            onPhaseChange={handlePhaseChange}
            onFrequencyChange={handleFrequencyChange}
            onAmplitudeChange={handleAmplitudeChange}
            onSelectPuzzleMode={handleSelectPuzzleMode}
            onRunExperiment={handleRunExperiment}
            onResetSimulation={() => {
              setSourceA({ id: 'source-a', name: 'Speaker A', x: -1.5, y: 0.8, frequencyHz: 700, amplitude: 1.0, phaseDeg: 0, enabled: true });
              setSourceB({ id: 'source-b', name: 'Speaker B', x: 1.5, y: 0.8, frequencyHz: 700, amplitude: 1.0, phaseDeg: 0, enabled: true });
              setActiveSensor({ id: 'sensor-1', name: 'Red Microphone', x: 0.0, y: 2.8, mode: 'SILENCE', targetDb: 55, initialDb: 92 });
              setPredictedDb(null);
              setPredictedType(null);
              setPredictionLocked(false);
            }}
            onCompleteInterference={handleCompleteInterference}
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
