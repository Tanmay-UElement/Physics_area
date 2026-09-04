'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { Trophy, RefreshCw, BarChart2, Home, Compass } from 'lucide-react';

export default function MatchSummaryPage() {
  const router = useRouter();
  const { roundResults, sessionXP, restartCurrentMatch } = useGameStore();

  const totalMatchXP = roundResults.reduce((acc, r) => acc + r.xpEarned, 0);
  const hits = roundResults.filter((r) => r.tier === 'hit').length;
  const accuracy = roundResults.length > 0 ? ((hits / roundResults.length) * 100).toFixed(1) : '0';

  const handlePlayAgain = () => {
    restartCurrentMatch();
    router.push('/match/trick-shot');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
        {/* Banner Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>CONCEPT #1 COMPLETED</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Match Summary
          </h1>
          <p className="text-sm text-slate-400">
            Horizontal Projectile Motion — 5 Round Performance Breakdown
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-500 font-mono mb-1">TOTAL XP</div>
            <div className="text-2xl font-black text-amber-400 font-mono">+{totalMatchXP}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-500 font-mono mb-1">ACCURACY</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{accuracy}%</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-500 font-mono mb-1">BULLSEYES</div>
            <div className="text-2xl font-black text-cyan-400 font-mono">{hits} / {roundResults.length || 5}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-500 font-mono mb-1">SESSION XP</div>
            <div className="text-2xl font-black text-indigo-400 font-mono">{sessionXP}</div>
          </div>
        </div>

        {/* Round by Round Telemetry Table */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-mono font-bold text-slate-400 flex justify-between">
            <span>ROUND</span>
            <span>USER VELOCITY</span>
            <span>IDEAL</span>
            <span>RESULT</span>
            <span>XP</span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs font-mono">
            {roundResults.map((res, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/50">
                <span className="text-slate-300 font-bold"># {res.roundNumber}</span>
                <span className="text-slate-200">{res.userVelocity} m/s</span>
                <span className="text-emerald-400">{res.correctVelocity} m/s</span>
                <span
                  className={`font-semibold capitalize ${
                    res.tier === 'hit'
                      ? 'text-emerald-400'
                      : res.tier === 'close'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {res.tier} ({res.errorPercentage}%)
                </span>
                <span className="text-amber-400 font-bold">+{res.xpEarned}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handlePlayAgain}
            className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <Link
            href="/stats"
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <BarChart2 className="w-4 h-4" />
            <span>SESSION STATS</span>
          </Link>

          <Link
            href="/class-select"
            className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>CLASS SELECT</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
