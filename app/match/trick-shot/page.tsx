'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { MatchCanvas } from '@/components/match/MatchCanvas';
import { SolvePanel } from '@/components/match/SolvePanel';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import { ResultModal } from '@/components/match/ResultModal';
import { RoundResult } from '@/lib/physics/types';

export default function TrickShotPage() {
  const router = useRouter();
  const {
    currentRound,
    currentRoundIndex,
    rounds,
    startMatch,
    isSimulating,
    setSimulating,
    recordRoundResult,
    nextRound,
    hasCompletedTutorial,
    isMatchCompleted,
  } = useGameStore();

  const [isLoadingEngine, setIsLoadingEngine] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<RoundResult | null>(null);
  const [userVelocity, setUserVelocity] = useState<number>(20.0);

  // Initialize match on mount if empty
  useEffect(() => {
    if (!currentRound) {
      startMatch('trick-shot');
    }
  }, []);

  // Show tutorial on initial load if not completed yet
  useEffect(() => {
    if (!hasCompletedTutorial && !isLoadingEngine) {
      setShowTutorial(true);
    }
  }, [hasCompletedTutorial, isLoadingEngine]);

  const handleLaunch = (velocity: number) => {
    setUserVelocity(velocity);
    setActiveResult(null);
    setSimulating(true);
  };

  const handleSimulationComplete = (result: RoundResult) => {
    setSimulating(false);
    setActiveResult(result);
    recordRoundResult(result);
  };

  const handleModalNext = () => {
    setActiveResult(null);
    if (currentRoundIndex >= (rounds.length || 5) - 1) {
      // Completed all 5 rounds -> redirect to match summary
      router.push('/match/trick-shot/summary');
    } else {
      nextRound();
    }
  };

  if (!currentRound) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Trick Shot Match...
      </div>
    );
  }

  const isLastRound = currentRoundIndex >= rounds.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Bar */}
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      {/* Main Gameplay Workbench */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Column: PixiJS + Matter.js Canvas (65% width on desktop) */}
        <div className="lg:col-span-8 relative min-h-[500px] flex flex-col">
          <LoadingOverlay isLoading={isLoadingEngine} />
          <MatchCanvas
            round={currentRound}
            userVelocity={userVelocity}
            isSimulating={isSimulating}
            onSimulationComplete={handleSimulationComplete}
            onCanvasLoaded={() => setIsLoadingEngine(false)}
          />
        </div>

        {/* Right Column: Physics Formula & Solve Control Panel (35% width on desktop) */}
        <div className="lg:col-span-4 flex flex-col">
          <SolvePanel
            round={currentRound}
            isSimulating={isSimulating}
            onLaunch={handleLaunch}
          />
        </div>
      </main>

      {/* Overlays */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <ResultModal
        result={activeResult}
        isLastRound={isLastRound}
        onNext={handleModalNext}
      />
    </div>
  );
}
