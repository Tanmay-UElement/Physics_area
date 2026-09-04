'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { VectorCanvas } from '@/components/match/VectorCanvas';
import { VectorSolvePanel } from '@/components/match/VectorSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  Vector2D,
  ForceSource,
  VectorExperimentLog,
  VectorTugState,
  VectorRoundData,
  analyzeVectorTugState,
  evaluateVectorSubmission,
} from '@/lib/physics/vectorTug';
import { RoundResult } from '@/lib/physics/types';

export default function VectorTugPage() {
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
  const [scenarioMode, setScenarioMode] = useState<'TARGET_MATCH' | 'ZERO_RESULTANT' | 'MOVING_EQUILIBRIUM' | 'HORIZONTAL_ONLY'>('TARGET_MATCH');
  const [objectMassKg, setObjectMassKg] = useState<number>(10.0);
  const [surfaceFriction, setSurfaceFriction] = useState<'OFF' | 'LOW' | 'HIGH'>('OFF');

  // Active Forces State
  const [forces, setForces] = useState<ForceSource[]>([
    { id: 'f1', name: 'Force A', colorHex: 0x38bdf8, vector: { x: 50, y: 30 }, isDraggable: true, maxMagnitude: 120 },
    { id: 'f2', name: 'Force B', colorHex: 0xa855f7, vector: { x: -20, y: 40 }, isDraggable: true, maxMagnitude: 120 },
    { id: 'f3', name: 'Force C', colorHex: 0x10b981, vector: { x: 70, y: -70 }, isDraggable: true, maxMagnitude: 120 },
  ]);

  const [targetVector, setTargetVector] = useState<Vector2D>({ x: 100, y: 0 });

  // Toggles
  const [showResultant, setShowResultant] = useState<boolean>(true);
  const [showComponents, setShowComponents] = useState<boolean>(false);
  const [showHeadToTail, setShowHeadToTail] = useState<boolean>(false);
  const [showFreeBodyDiagram, setShowFreeBodyDiagram] = useState<boolean>(false);
  const [angleSnap15Deg, setAngleSnap15Deg] = useState<boolean>(false);

  // Workflow State
  const [predictedMagN, setPredictedMagN] = useState<number | null>(null);
  const [predictedAngleDeg, setPredictedAngleDeg] = useState<number | null>(null);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSimulationComplete, setIsSimulationComplete] = useState<boolean>(false);

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [experimentLog, setExperimentLog] = useState<VectorExperimentLog[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('vector-tug');
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

  const roundData = (currentRound as VectorRoundData) || {
    id: 'vector-round-1',
    conceptId: 102,
    conceptName: 'Vector Tug-of-War',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 100,
    gravity: 9.81,
    correctVelocity: 100,
    f1: { x: 50, y: 30 },
    f2: { x: -20, y: 40 },
    targetGoal: { x: 100, y: 0 },
    idealUserForce: { x: 70, y: -70 },
  };

  const vectorState: VectorTugState = analyzeVectorTugState(
    scenarioMode,
    objectMassKg,
    surfaceFriction,
    forces,
    targetVector,
    predictedMagN,
    predictedAngleDeg,
    predictionLocked,
    isSimulating,
    isSimulationComplete,
    showResultant,
    showComponents,
    showHeadToTail,
    showFreeBodyDiagram,
    true,
    angleSnap15Deg,
    attemptCount,
    experimentLog
  );

  const handleForceChange = (id: string, newVec: Vector2D) => {
    setForces((prev) => prev.map((f) => (f.id === id ? { ...f, vector: newVec } : f)));
  };

  const handleStartSimulation = (predMag: number, predAngle: number) => {
    setPredictedMagN(predMag);
    setPredictedAngleDeg(predAngle);
    setPredictionLocked(true);
    setIsSimulating(true);
  };

  const handleSimulationComplete = () => {
    setIsSimulating(false);
    setIsSimulationComplete(true);
    setAttemptCount((prev) => prev + 1);

    if (predictedMagN !== null && predictedAngleDeg !== null) {
      setExperimentLog((prev) => [
        {
          attemptNum: attemptCount,
          scenario: scenarioMode,
          predictedMagN,
          predictedAngleDeg,
          actualMagN: vectorState.netMagnitudeN,
          actualAngleDeg: vectorState.netAngleDeg,
          errorPercentage: Math.abs(predictedMagN - vectorState.netMagnitudeN),
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleResetSimulation = () => {
    setPredictedMagN(null);
    setPredictedAngleDeg(null);
    setPredictionLocked(false);
    setIsSimulating(false);
    setIsSimulationComplete(false);
    setCurrentResult(null);
  };

  const handleCompleteVectorTug = () => {
    const evalRes = evaluateVectorSubmission({ x: 100, y: 0 }, { x: vectorState.netFx, y: vectorState.netFy });
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: vectorState.netMagnitudeN,
      correctVelocity: vectorState.targetMagnitudeN,
      errorPercentage: evalRes.errorPercentage,
      tier: evalRes.tier,
      xpEarned: evalRes.xpEarned,
      actualLandingX: vectorState.netMagnitudeN,
      targetX: vectorState.targetMagnitudeN,
      trajectoryPoints: [],
      idealTrajectoryPoints: [],
    };

    setCurrentResult(result);
    recordRoundResult(result);
  };

  if (isLoading) {
    return <LoadingOverlay conceptName="Vector Tug-of-War" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader
        onOpenTutorial={() => setShowTutorial(true)}
        onPlayAgain={handleResetSimulation}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero 2D Physics Canvas */}
        <div className="w-full min-h-[480px]">
          <VectorCanvas
            vectorState={vectorState}
            theme={theme}
            onForceChange={handleForceChange}
            onSimulationComplete={handleSimulationComplete}
            onToggleResultant={() => setShowResultant((prev) => !prev)}
            onToggleComponents={() => setShowComponents((prev) => !prev)}
            onToggleHeadToTail={() => setShowHeadToTail((prev) => !prev)}
            onToggleFreeBody={() => setShowFreeBodyDiagram((prev) => !prev)}
          />
        </div>

        {/* Bottom Control Workbench */}
        <div className="w-full">
          <VectorSolvePanel
            vectorState={vectorState}
            theme={theme}
            onForceVectorChange={handleForceChange}
            onMassChange={(m) => setObjectMassKg(m)}
            onSelectScenario={(s) => {
              setScenarioMode(s);
              if (s === 'ZERO_RESULTANT' || s === 'MOVING_EQUILIBRIUM') {
                setForces([
                  { id: 'f1', name: 'Force A', colorHex: 0x38bdf8, vector: { x: 100, y: 0 }, isDraggable: false, maxMagnitude: 120 },
                  { id: 'f2', name: 'Force B', colorHex: 0xa855f7, vector: { x: -50, y: 40 }, isDraggable: false, maxMagnitude: 120 },
                  { id: 'f3', name: 'Force C (Your Pull)', colorHex: 0x10b981, vector: { x: -50, y: -40 }, isDraggable: true, maxMagnitude: 120 },
                ]);
              } else if (s === 'HORIZONTAL_ONLY') {
                setTargetVector({ x: 100, y: 0 });
                setForces([
                  { id: 'f1', name: 'Force A', colorHex: 0x38bdf8, vector: { x: 60, y: 40 }, isDraggable: true, maxMagnitude: 120 },
                  { id: 'f2', name: 'Force B', colorHex: 0xa855f7, vector: { x: 40, y: -40 }, isDraggable: true, maxMagnitude: 120 },
                ]);
              } else {
                setTargetVector({ x: 100, y: 0 });
                setForces([
                  { id: 'f1', name: 'Force A', colorHex: 0x38bdf8, vector: { x: 50, y: 30 }, isDraggable: true, maxMagnitude: 120 },
                  { id: 'f2', name: 'Force B', colorHex: 0xa855f7, vector: { x: -20, y: 40 }, isDraggable: true, maxMagnitude: 120 },
                  { id: 'f3', name: 'Force C', colorHex: 0x10b981, vector: { x: 70, y: -70 }, isDraggable: true, maxMagnitude: 120 },
                ]);
              }
              handleResetSimulation();
            }}
            onToggleAngleSnap={() => setAngleSnap15Deg((prev) => !prev)}
            onStartSimulation={handleStartSimulation}
            onResetSimulation={handleResetSimulation}
            onCompleteVectorTug={handleCompleteVectorTug}
          />
        </div>
      </main>

      <ResultModal
        result={currentResult}
        isLastRound={true}
        onNext={() => router.push('/class-select')}
        onPlayAgain={handleResetSimulation}
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
