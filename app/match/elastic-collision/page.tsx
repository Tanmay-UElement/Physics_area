'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { ElasticCanvas } from '@/components/match/ElasticCanvas';
import { ElasticSolvePanel } from '@/components/match/ElasticSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import { ElasticRoundData } from '@/lib/physics/elasticCollision';
import { RoundResult } from '@/lib/physics/types';

export default function ElasticCollisionPage() {
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
  const [userVelocity, setUserVelocity] = useState<number>(10.0);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('elastic-collision');
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

  const handleLaunch = (vB: number) => {
    setUserVelocity(vB);
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
    return <LoadingOverlay conceptName="Elastic Collision (Equal Mass)" />;
  }

  const elasticRound = currentRound as ElasticRoundData;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 min-h-[480px]">
          <ElasticCanvas
            round={elasticRound}
            userVelocity={userVelocity}
            isSimulating={isSimulating}
            theme={theme}
            onSimulationComplete={handleSimulationComplete}
          />
        </div>

        <div className="lg:col-span-4">
          <ElasticSolvePanel
            round={elasticRound}
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
