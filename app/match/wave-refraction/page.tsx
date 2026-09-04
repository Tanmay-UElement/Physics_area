'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { MatchHeader } from '@/components/match/MatchHeader';
import { WaveRefractionCanvas } from '@/components/match/WaveRefractionCanvas';
import { WaveRefractionSolvePanel } from '@/components/match/WaveRefractionSolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { TutorialOverlay } from '@/components/match/TutorialOverlay';
import { LoadingOverlay } from '@/components/match/LoadingOverlay';
import {
  OPTICAL_MEDIA,
  OpticalMedium,
  RefractionState,
  ShotRecord,
  WaveRefractionRoundData,
  analyzeRefractionState,
  evaluateRefractionSubmission,
} from '@/lib/physics/waveRefraction';
import { RoundResult } from '@/lib/physics/types';

export default function WaveRefractionPage() {
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

  // Interactive Refraction Controls State
  const [incidentAngleDeg, setIncidentAngleDeg] = useState<number>(35);
  const [medium1, setMedium1] = useState<OpticalMedium>(OPTICAL_MEDIA.air);
  const [medium2, setMedium2] = useState<OpticalMedium>(OPTICAL_MEDIA.water);

  // Shooting Animation State
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [beamProgress, setBeamProgress] = useState<number>(0);
  const [shotHistory, setShotHistory] = useState<ShotRecord[]>([]);

  const isLight = theme === 'light';

  useEffect(() => {
    startMatch('wave-refraction');
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

  const refractionRound = (currentRound as WaveRefractionRoundData) || {
    id: 'wave-refraction-1',
    conceptId: 301,
    conceptName: 'Refraction Lab (Snell\'s Law)',
    roundNumber: 1,
    totalRounds: 1,
    height: 0,
    distance: 1.8,
    gravity: 9.8,
    correctVelocity: 1,
    targetDetectorDistanceM: 1.8,
    targetDetectorHeightCm: 0,
    targetAngleDeg: 25.4,
    allowedToleranceCm: 3.0,
  };

  const refractionState: RefractionState = analyzeRefractionState(
    medium1,
    medium2,
    incidentAngleDeg,
    refractionRound.targetDetectorDistanceM,
    shotHistory,
    isCharging,
    isShooting,
    beamProgress
  );

  // Real Shooting Sequence: CHARGE -> FIRE -> PROGRESS -> IMPACT RECORD
  const handleShoot = () => {
    if (isCharging || isShooting) return;

    setIsCharging(true);

    // Step 1: Laser Charging (300ms)
    setTimeout(() => {
      setIsCharging(false);
      setIsShooting(true);
      setBeamProgress(0);

      // Step 2: Progressive Beam Travel Animation (800ms)
      const startTime = Date.now();
      const duration = 800;

      const animInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const prog = Math.min(1.0, elapsed / duration);
        setBeamProgress(prog);

        if (prog >= 1.0) {
          clearInterval(animInterval);
          setIsShooting(false);

          // Step 3: Record Shot Impact History
          const newShot: ShotRecord = {
            shotNumber: shotHistory.length + 1,
            incidentAngleDeg: refractionState.incidentAngleDeg,
            refractedAngleDeg: refractionState.refractedAngleDeg,
            medium1Name: refractionState.medium1.name,
            medium2Name: refractionState.medium2.name,
            impactOffsetCm: refractionState.lastImpactOffsetCm || 0,
            accuracyPct: refractionState.lastAccuracyPct || 0,
            hitTier: refractionState.lastHitTier || 'MISS',
            isTir: refractionState.isTotalInternalReflection,
          };

          setShotHistory((prev) => [newShot, ...prev]);
        }
      }, 16);
    }, 300);
  };

  const handleCompleteAlignment = () => {
    const evalRes = evaluateRefractionSubmission(refractionState);
    const result: RoundResult = {
      roundNumber: 1,
      userVelocity: refractionState.refractedAngleDeg,
      correctVelocity: refractionRound.targetAngleDeg,
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
    return <LoadingOverlay conceptName="Refraction Lab (Snell's Law)" />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => setShowTutorial(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Workbench Canvas View */}
        <div className="w-full min-h-[460px]">
          <WaveRefractionCanvas
            round={refractionRound}
            refractionState={refractionState}
            theme={theme}
            onSimulationComplete={() => {}}
          />
        </div>

        {/* Bottom Control & Telemetry Panel View */}
        <div className="w-full">
          <WaveRefractionSolvePanel
            round={refractionRound}
            refractionState={refractionState}
            theme={theme}
            onIncidentAngleChange={(angle) => setIncidentAngleDeg(angle)}
            onMedium1Change={(m) => setMedium1(m)}
            onMedium2Change={(m) => setMedium2(m)}
            onShoot={handleShoot}
            onResetLab={() => {
              setIncidentAngleDeg(35);
              setMedium1(OPTICAL_MEDIA.air);
              setMedium2(OPTICAL_MEDIA.water);
              setShotHistory([]);
            }}
            onCompleteAlignment={handleCompleteAlignment}
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
