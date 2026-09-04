'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { Atom, Trophy, BarChart2, Compass, Play, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { sessionXP, theme, toggleTheme } = useGameStore();

  const isLight = theme === 'light';

  return (
    <header className={`w-full sticky top-0 z-40 backdrop-blur-md transition-colors border-b px-6 py-4 ${
      isLight ? 'bg-white/90 border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-950/80 border-slate-800/80 text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
              <Atom className="w-5 h-5 text-cyan-500 group-hover:rotate-90 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-black text-xl tracking-tight ${isLight ? 'text-slate-900' : 'bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent'}`}>
              PhysicsArena
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 rounded uppercase">
              GUEST
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname === '/'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Home
          </Link>
          <Link
            href="/class-select"
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === '/class-select'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Class Select</span>
          </Link>
          <Link
            href="/stats"
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === '/stats'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Session Stats</span>
          </Link>
        </nav>

        {/* Right Toolbar: XP + Theme Toggle + Play Button */}
        <div className="flex items-center gap-3">
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

          {/* XP Display */}
          <Link
            href="/stats"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-md hover:border-amber-500/50 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <div className="flex items-baseline gap-1">
              <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>XP:</span>
              <span className="font-mono font-extrabold text-amber-500 text-sm">{sessionXP}</span>
            </div>
          </Link>

          <Link
            href="/class-select"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Play Now</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
