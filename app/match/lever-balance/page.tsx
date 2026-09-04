'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { LeverCanvas } from '@/components/match/LeverCanvas';
import { LeverSolvePanel } from '@/components/match/LeverSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  WeightItem,
  LeverExperimentLog,
  LeverState,
  LeverRoundData,
  analyzeLeverState,
  evaluateLeverSubmission,
} from '@/lib/physics/leverBalance';
import { RoundResult } from '@/lib/physics/types';

export default function LeverBalancePage() {
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
  const [scenarioMode, setScenarioMode] = useState<'BALANCE_BEAM' | 'HEAVY_LOAD' | 'ANGLED_FORCE' | 'UNKNOWN_MASS'>('BALANCE_BEAM');
  const [fulcrumOffsetM, setFulcrumOffsetM] = useState<number>(0.0);
  const [beamLengthM, setBeamLengthM] = useState<number>(10.0);
  const [beamMassKg, setBeamMassKg] = useState<number>(20.0);
  const [dampingLevel, setDampingLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // Placed Weights & Forces
  const [weights, setWeights] = useState<WeightItem[]>([
    { id: 'w1', name: 'Load Box A', massKg: 10, distanceM: -0.4, colorHex: 0xef4444, isDraggable: false },
    { id: 'w2', name: 'Effort Box B', massKg: 5, distanceM: 2.0, colorHex: 0x10b981, isDraggable: true },
  ]);

  // Visual Toggles
  const [showRotationalAxis, setShowRotationalAxis] = useState<boolean>(true);
  const [showLeverArm, setShowLeverArm] = useState<boolean>(false);
  const [showLineOfAction, setShowLineOfAction] = useState<boolean>(false);
  const [showCenterOfMass, setShowCenterOfMass] = useState<boolean>(false);
  const [showFreeBodyDiagram, setShowFreeBodyDiagram] = useState<boolean>(false);

  // Workflow State
  const [predictedBalanceDistM, setPredictedBalanceDistM] = useState<number | null>(null);
  const [predictedDirection, setPredictedDirection] = useState<'LEFT' | 'RIGHT' | 'BALANCED' | null>(null);
  const [predictionLocked, setPredictionLocked] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSimulationComplete, setIsSimulationComplete] = useState<boolean>(false);

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [experimentLog, setExperimentLog] = useState<LeverExperimentLog[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('lever-balance');
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

  const roundData = (currentRound as LeverRoundData) || {
    id: 'lever-round-1',
    conceptId: 101,
    conceptName: 'Lever & Torque Balance',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 0.8,
    gravity: 9.81,
    correctVelocity: 0.8,
    leftMass: 10,
    leftDistance: 0.4,
    rightMass: 5,
    targetRightDistance: 0.8,
  };

  const leverState: LeverState = analyzeLeverState(
    scenarioMode,
    fulcrumOffsetM,
    beamLengthM,
    beamMassKg,
    dampingLevel,
    weights,
    predictedBalanceDistM,
    predictedDirection,
    predictionLocked,
    isSimulating,
    isSimulationComplete,
    showRotationalAxis,
    showLeverArm,
    showLineOfAction,
    showCenterOfMass,
    showFreeBodyDiagram,
    attemptCount,
    experimentLog
  );

  const handleWeightDistanceChange = (id: string, newDistM: number) => {
    setWeights((prev) => prev.map((w) => (w.id === id ? { ...w, distanceM: newDistM } : w)));
  };

  const handleForceAngleChange = (id: string, newAngleDeg: number) => {
    setWeights((prev) => prev.map((w) => (w.id === id ? { ...w, forceAngleDeg: newAngleDeg } : w)));
  };

  const handleStartSimulation = (predDist: number, predDir: 'LEFT' | 'RIGHT' | 'BALANCED') => {
    setPredictedBalanceDistM(predDist);
    setPredictedDirection(predDir);
    setPredictionLocked(true);
    setIsSimulating(true);
  };

  const handleSimulationComplete = () => {
    setIsSimulating(false);
    setIsSimulationComplete(true);
    setAttemptCount((prev) => prev + 1);

    if (predictedBalanceDistM !== null) {
      const rightItem = weights.find((w) => w.distanceM > 0);
      const userDist = rightItem ? Math.abs(rightItem.distanceM) : 0;

      setExperimentLog((prev) => [
        {
          attemptNum: attemptCount,
          scenario: scenarioMode,
          leftTorqueNm: leverState.leftTorqueNm,
          rightTorqueNm: leverState.rightTorqueNm,
          netTorqueNm: leverState.netTorqueNm,
          predictedBalanceDistM,
          actualBalanceDistM: userDist,
          errorPercentage: Math.abs(userDist - predictedBalanceDistM),
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleResetSimulation = () => {
    setPredictedBalanceDistM(null);
    setPredictedDirection(null);
    setPredictionLocked(false);
    setIsSimulating(false);
    setIsSimulationComplete(false);
    setCurrentResult(null);
  };

  const handleCompleteLever = () => {
    const rightItem = weights.find((w) => w.distanceM > 0);
    const userDist = rightItem ? Math.abs(rightItem.distanceM) : 0;
    const targetDist = 0.8;

    const evalRes = evaluateLeverSubmission(targetDist, userDist);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: userDist,
      correctVelocity: targetDist,
      errorPercentage: evalRes.errorPercentage,
      tier: evalRes.tier,
      xpEarned: evalRes.xpEarned,
      actualLandingX: userDist,
      targetX: targetDist,
      trajectoryPoints: [],
      idealTrajectoryPoints: [],
    };

    setCurrentResult(result);
    recordRoundResult(result);
  };

  if (isLoading) {
    return <LoadingOverlay conceptName="Lever & Torque Balance" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader
        onOpenTutorial={() => setShowTutorial(true)}
        onPlayAgain={handleResetSimulation}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero 2D Physics Canvas */}
        <div className="w-full min-h-[480px]">
          <LeverCanvas
            leverState={leverState}
            theme={theme}
            onWeightDistanceChange={handleWeightDistanceChange}
            onForceAngleChange={handleForceAngleChange}
            onSimulationComplete={handleSimulationComplete}
            onToggleRotationalAxis={() => setShowRotationalAxis((prev) => !prev)}
            onToggleLeverArm={() => setShowLeverArm((prev) => !prev)}
            onToggleLineOfAction={() => setShowLineOfAction((prev) => !prev)}
            onToggleCenterOfMass={() => setShowCenterOfMass((prev) => !prev)}
            onToggleFreeBody={() => setShowFreeBodyDiagram((prev) => !prev)}
          />
        </div>

        {/* Bottom Control Workbench */}
        <div className="w-full">
          <LeverSolvePanel
            leverState={leverState}
            theme={theme}
            onWeightDistanceChange={handleWeightDistanceChange}
            onFulcrumOffsetChange={(offsetM) => setFulcrumOffsetM(offsetM)}
            onSelectScenario={(s) => {
              setScenarioMode(s);
              if (s === 'HEAVY_LOAD') {
                setWeights([
                  { id: 'w1', name: 'Heavy Crate (500N)', massKg: 51, distanceM: -1.0, colorHex: 0xef4444, isDraggable: false },
                  { id: 'w2', name: 'Effort Force (100N)', massKg: 10.2, distanceM: 3.0, colorHex: 0x10b981, isDraggable: true },
                ]);
                setFulcrumOffsetM(-1.5);
              } else if (s === 'ANGLED_FORCE') {
                setWeights([
                  { id: 'w1', name: 'Load Box A', massKg: 10, distanceM: -1.0, colorHex: 0xef4444, isDraggable: false },
                  { id: 'w2', name: 'Effort Force (90°)', massKg: 10, distanceM: 1.0, colorHex: 0xa855f7, isDraggable: true, forceAngleDeg: 90 },
                ]);
                setFulcrumOffsetM(0.0);
              } else if (s === 'UNKNOWN_MASS') {
                setWeights([
                  { id: 'w1', name: 'Known 10kg Load', massKg: 10, distanceM: -0.5, colorHex: 0xef4444, isDraggable: false },
                  { id: 'w2', name: 'Unknown Crate (???)', massKg: 5, distanceM: 2.0, colorHex: 0x10b981, isDraggable: true },
                ]);
                setFulcrumOffsetM(0.0);
              } else {
                setWeights([
                  { id: 'w1', name: 'Load Box A (10kg)', massKg: 10, distanceM: -0.4, colorHex: 0xef4444, isDraggable: false },
                  { id: 'w2', name: 'Effort Box B (5kg)', massKg: 5, distanceM: 2.0, colorHex: 0x10b981, isDraggable: true },
                ]);
                setFulcrumOffsetM(0.0);
              }
              handleResetSimulation();
            }}
            onStartSimulation={handleStartSimulation}
            onResetSimulation={handleResetSimulation}
            onCompleteLever={handleCompleteLever}
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
