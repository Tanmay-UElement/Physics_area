'use client';

import React from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/useGameStore';
import { Trophy, HelpCircle, Atom, Sun, Moon } from 'lucide-react';

interface MatchHeaderProps {
  onOpenTutorial: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ onOpenTutorial }) => {
  const { currentRoundIndex, rounds, sessionXP, theme, toggleTheme } = useGameStore();
  const isLight = theme === 'light';

  return (
    <header className={`w-full border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors ${
      isLight ? 'bg-white/90 border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-950/80 border-slate-800/80 text-slate-100'
    }`}>
      {/* Brand Header */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
              <Atom className="w-5 h-5 text-cyan-500 group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-lg tracking-tight ${isLight ? 'text-slate-900' : 'bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent'}`}>
                PhysicsArena
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 rounded">
                GUEST
              </span>
            </div>
          </div>
        </Link>

        {/* Round Dots Indicator */}
        <div className={`hidden md:flex items-center gap-2 pl-6 border-l ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
          <span className={`text-xs font-mono mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Rounds:</span>
          {rounds.map((r, idx) => {
            const isCurrent = idx === currentRoundIndex;
            const isCompleted = idx < currentRoundIndex;

            return (
              <div
                key={r.id}
                className={`flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'w-7 h-7 rounded-lg bg-cyan-500/20 border-2 border-cyan-400 text-cyan-500 dark:text-cyan-300 font-bold text-xs shadow-md shadow-cyan-500/30'
                    : isCompleted
                    ? 'w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 font-semibold text-xs'
                    : isLight
                    ? 'w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs'
                    : 'w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 text-xs'
                }`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all ${
            isLight
              ? 'bg-amber-100/80 border-amber-300 text-amber-700 hover:bg-amber-200'
              : 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800'
          }`}
          title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
        >
          {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Session XP Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-md">
          <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
          <div className="flex items-baseline gap-1">
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>XP:</span>
            <span className="font-mono font-extrabold text-amber-500 text-sm">{sessionXP}</span>
          </div>
        </div>

        {/* Tutorial Button */}
        <button
          onClick={onOpenTutorial}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-cyan-500" />
          <span className="hidden sm:inline">How to Play</span>
        </button>
      </div>
    </header>
  );
};
