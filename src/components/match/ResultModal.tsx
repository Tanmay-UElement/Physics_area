'use client';

import React from 'react';
import { RoundResult } from '@/lib/physics/types';
import { Trophy, ArrowRight } from 'lucide-react';

interface ResultModalProps {
  result: RoundResult | null;
  isLastRound: boolean;
  onNext: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  isLastRound,
  onNext,
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
        desc: `Unstoppable precision! You calculated the exact horizontal velocity within ${result.errorPercentage}% tolerance.`,
      }
    : isClose
    ? {
        bg: 'bg-amber-950/90',
        border: 'border-amber-500/40',
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30',
        title: 'SO CLOSE! NEAR MISS! 🤏',
        desc: `You were off by just ${result.errorPercentage}%. Adjust your velocity slightly next time to nail the bullseye!`,
      }
    : {
        bg: 'bg-slate-900/95',
        border: 'border-cyan-500/40',
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-400',
        badgeBorder: 'border-cyan-500/30',
        title: 'NICE TRY! GRAVITY CAUGHT YOU 🚀',
        desc: `Your avatar landed ${
          result.actualLandingX > result.targetX ? 'past' : 'short of'
        } the target. Notice the cyan ideal trajectory path overlay on the canvas!`,
      };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className={`relative w-full max-w-md ${tierTheme.bg} border ${tierTheme.border} rounded-2xl p-6 shadow-2xl space-y-6 text-slate-100`}>
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
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-3 text-xs font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Your Velocity (v):</span>
            <span className="font-bold text-white text-sm">{result.userVelocity} m/s</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Exact Ideal Velocity:</span>
            <span className="font-bold text-emerald-400 text-sm">{result.correctVelocity} m/s</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">Landing Error:</span>
            <span className={`font-bold ${isHit ? 'text-emerald-400' : isClose ? 'text-amber-400' : 'text-cyan-400'}`}>
              {result.errorPercentage}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Landing Position:</span>
            <span className="text-slate-200">
              {result.actualLandingX}m <span className="text-slate-500">(Target: {result.targetX}m)</span>
            </span>
          </div>
        </div>

        {/* Continue Action Button */}
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
        >
          <span>{isLastRound ? 'VIEW MATCH SUMMARY' : 'NEXT ROUND'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
