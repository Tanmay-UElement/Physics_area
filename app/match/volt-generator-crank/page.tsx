'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { VoltGeneratorCanvas } from '@/components/match/VoltGeneratorCanvas';
import { VoltGeneratorSolvePanel } from '@/components/match/VoltGeneratorSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import { VoltGeneratorRoundData } from '@/lib/physics/voltGeneratorCrank';
import { RoundResult } from '@/lib/physics/types';

export default function VoltGeneratorCrankPage() {
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
  const [userRPM, setUserRPM] = useState<number>(286);
  const [isCranking, setIsCranking] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('volt-generator-crank');
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

  const handleLaunch = (rpm: number) => {
    setUserRPM(rpm);
    setIsCranking(true);
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
    setIsCranking(false);
    nextRound();
  };

  if (isLoading || !currentRound) {
    return <LoadingOverlay conceptName="Generator Crank (Faraday's Law)" />;
  }

  const generatorRound = currentRound as VoltGeneratorRoundData;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 min-h-[480px]">
          <VoltGeneratorCanvas
            round={generatorRound}
            userRPM={userRPM}
            isSimulating={isSimulating}
            isCranking={isCranking}
            theme={theme}
            onSimulationComplete={handleSimulationComplete}
            onRPMChange={(rpm) => setUserRPM(rpm)}
          />
        </div>

        <div className="lg:col-span-5">
          <VoltGeneratorSolvePanel
            round={generatorRound}
            userRPM={userRPM}
            isSimulating={isSimulating}
            isCranking={isCranking}
            theme={theme}
            onRPMChange={(rpm) => setUserRPM(rpm)}
            onToggleCrank={(cranking) => setIsCranking(cranking)}
            onReset={() => {
              setIsCranking(false);
              setUserRPM(286);
            }}
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
