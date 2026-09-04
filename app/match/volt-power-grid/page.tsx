'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { VoltPowerGridCanvas } from '@/components/match/VoltPowerGridCanvas';
import { VoltPowerGridSolvePanel } from '@/components/match/VoltPowerGridSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  DEFAULT_FACILITIES,
  GridState,
  PowerLoadFacility,
  VoltPowerGridRoundData,
  analyzePowerGridState,
  evaluatePowerGridSubmission,
} from '@/lib/physics/voltPowerGrid';
import { RoundResult } from '@/lib/physics/types';

export default function VoltPowerGridPage() {
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

  // Interactive Grid Controls State
  const [facilities, setFacilities] = useState<PowerLoadFacility[]>(DEFAULT_FACILITIES);
  const [voltage, setVoltage] = useState<number>(230);
  const [spikeActive, setSpikeActive] = useState<boolean>(false);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('volt-power-grid');
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

  const gridRound = (currentRound as VoltPowerGridRoundData) || {
    id: 'volt-power-grid-1',
    conceptId: 207,
    conceptName: 'Power Grid Balancer (P = VI)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 1,
    gravity: 9.8,
    correctVelocity: 1,
    gridCapacityWatts: 5000,
    defaultVoltage: 230,
    facilities: DEFAULT_FACILITIES,
  };

  const gridState: GridState = analyzePowerGridState(
    facilities,
    voltage,
    gridRound.gridCapacityWatts,
    spikeActive
  );

  const handleFacilityToggle = (id: string) => {
    setFacilities((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isOn: !f.isOn } : f))
    );
  };

  const handleCompleteBalancing = () => {
    const evalRes = evaluatePowerGridSubmission(gridState);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: gridState.totalPowerWatts,
      correctVelocity: 4350,
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
    return <LoadingOverlay conceptName="Power Grid Balancer (Game 7)" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 min-h-[480px]">
          <VoltPowerGridCanvas
            round={gridRound}
            gridState={gridState}
            facilities={facilities}
            theme={theme}
            onSimulationComplete={() => {}}
          />
        </div>

        <div className="lg:col-span-5">
          <VoltPowerGridSolvePanel
            round={gridRound}
            gridState={gridState}
            facilities={facilities}
            theme={theme}
            onVoltageChange={(v) => setVoltage(v)}
            onFacilityToggle={handleFacilityToggle}
            onToggleSpike={() => setSpikeActive((prev) => !prev)}
            onResetGrid={() => {
              setFacilities(DEFAULT_FACILITIES);
              setVoltage(230);
              setSpikeActive(false);
            }}
            onCompleteBalancing={handleCompleteBalancing}
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
