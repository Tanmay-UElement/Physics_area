'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { VoltMagneticCanvas } from '@/components/match/VoltMagneticCanvas';
import { VoltMagneticSolvePanel } from '@/components/match/VoltMagneticSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import { VoltMagneticRoundData } from '@/lib/physics/voltMagneticMaze';
import { RoundResult } from '@/lib/physics/types';

export default function VoltMagneticMazePage() {
  const router = useRouter();
  const {
    currentRound,
    currentRoundIndex,
    rounds,
    startMatch,
    recordRoundResult,
    nextRound,
    isMatchCompleted,
    isSimulating,
    setSimulating,
    hasCompletedTutorial,
    setHasCompletedTutorial,
    theme,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [userRadius, setUserRadius] = useState<number>(4.00);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('volt-magnetic-maze');
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

  const handleLaunch = (radius: number) => {
    setUserRadius(radius);
    setCurrentResult(null);
    setSimulating(true);
  };

  const handleSimulationComplete = (result: RoundResult) => {
    setSimulating(false);
    setCurrentResult(result);
    recordRoundResult(result);
  };

  const handleNextRound = () => {
    setCurrentResult(null);
    nextRound();
  };

  if (isLoading || !currentRound) {
    return <LoadingOverlay conceptName="Magnetic Maze (Lorentz Force)" />;
  }

  const magneticRound = currentRound as VoltMagneticRoundData;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 min-h-[480px]">
          <VoltMagneticCanvas
            round={magneticRound}
            userRadius={userRadius}
            isSimulating={isSimulating}
            theme={theme}
            onSimulationComplete={handleSimulationComplete}
          />
        </div>

        <div className="lg:col-span-4">
          <VoltMagneticSolvePanel
            round={magneticRound}
            isSimulating={isSimulating}
            theme={theme}
            onLaunch={handleLaunch}
          />
        </div>
      </main>

      <ResultModal
        result={currentResult}
        isLastRound={currentRoundIndex === rounds.length - 1}
        onNext={handleNextRound}
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
