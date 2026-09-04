'use client';

import React from 'react';
import { RoundResult } from '@/lib/physics/types';
import { Trophy, ArrowRight, RotateCcw } from 'lucide-react';

interface ResultModalProps {
  result: RoundResult | null;
  isLastRound: boolean;
  onNext: () => void;
  onPlayAgain?: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  isLastRound,
  onNext,
  onPlayAgain,
}) => {
  if (!result) return null;

  const isHit = result.tier === 'hit';
  const isClose = result.tier === 'close';

  const tierTheme = isHit
    ? {
        bg: 'bg-emerald-950/90',
        border: 'border-emerald-500/40',
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/30',
        title: 'BULLSEYE! DIRECT HIT! 🎯',
        desc: `Unstoppable precision! You calculated the exact physics result within ${result.errorPercentage}% tolerance.`,
      }
    : isClose
    ? {
        bg: 'bg-amber-950/90',
        border: 'border-amber-500/40',
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30',
        title: 'SO CLOSE! NEAR MISS! 🤏',
        desc: `You were off by just ${result.errorPercentage}%. Adjust your parameters next time to nail the bullseye!`,
      }
    : {
        bg: 'bg-slate-900/95',
        border: 'border-cyan-500/40',
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-400',
        badgeBorder: 'border-cyan-500/30',
        title: 'NICE TRY! GRAVITY / PHYSICS CAUGHT YOU 🚀',
        desc: `Your trajectory or calculation was off by ${result.errorPercentage}%. Inspect the live vector HUD to optimize your setup!`,
      };

  const handlePlayAgainClick = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className={`relative w-full max-w-md ${tierTheme.bg} border ${tierTheme.border} rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100`}>
        {/* Tier Header */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${tierTheme.badgeBg} ${tierTheme.badgeText} ${tierTheme.badgeBorder}`}>
            <Trophy className="w-3.5 h-3.5" />
            <span>+{result.xpEarned} XP AWARDED</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight text-white pt-1">
            {tierTheme.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            {tierTheme.desc}
          </p>
        </div>

        {/* Math & Telemetry Breakdown Card */}
        <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Your Calculated Input:</span>
            <span className="font-bold text-white text-sm">{result.userVelocity}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Exact Ideal Physics Result:</span>
            <span className="font-bold text-emerald-400 text-sm">{result.correctVelocity}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Precision Error:</span>
            <span className={`font-bold ${isHit ? 'text-emerald-400' : isClose ? 'text-amber-400' : 'text-cyan-400'}`}>
              {result.errorPercentage}%
            </span>
          </div>
        </div>

        {/* Action Buttons: Play Again & Next/Continue */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handlePlayAgainClick}
            className="py-3.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="py-3.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>{isLastRound ? 'CONTINUE' : 'NEXT ROUND'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
