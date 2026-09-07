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

  const navLinks = [
    { href: '/', label: 'Home', icon: null },
    { href: '/class-select', label: 'Classes', icon: <Compass className="w-3.5 h-3.5" /> },
    { href: '/stats', label: 'Stats', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className={`w-full sticky top-0 z-40 transition-all duration-300 border-b px-6 py-3.5 ${
      isLight
        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-sm shadow-slate-100'
        : 'bg-slate-950/85 border-slate-800/80 text-slate-100 shadow-lg shadow-slate-950/20'
    }`}
      style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Animated atom orb */}
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg transition-all duration-300 ${
            isLight ? 'shadow-cyan-200' : 'shadow-cyan-500/20 group-hover:shadow-cyan-500/50'
          }`}>
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center transition-colors ${
              isLight ? 'bg-white' : 'bg-slate-950'
            }`}>
              <Atom className={`w-5 h-5 text-cyan-500 transition-transform duration-700 ${
                isLight ? '' : 'group-hover:rotate-180'
              }`} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`font-black text-xl tracking-tight transition-colors ${
              isLight
                ? 'text-slate-900'
                : 'bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent'
            }`}>
              PhysicsArena
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-black bg-cyan-500/15 text-cyan-500 border border-cyan-500/40 rounded-md uppercase tracking-wide">
              BETA
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
          isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? isLight
                      ? 'bg-white text-cyan-600 border border-cyan-400/50 shadow-sm shadow-cyan-100'
                      : 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Toolbar */}
        <div className="flex items-center gap-2.5">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`relative p-2 rounded-xl border transition-all duration-300 active:scale-95 ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300'
                : 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800 hover:border-slate-600'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
          >
            {isLight
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {/* XP Badge */}
          <Link
            href="/stats"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200 hover:scale-[1.03] ${
              isLight
                ? 'bg-amber-50 border-amber-200 hover:border-amber-300 shadow-sm'
                : 'bg-gradient-to-r from-amber-500/8 to-orange-500/8 border-amber-500/30 hover:border-amber-500/50 shadow-md'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <div className="flex items-baseline gap-1">
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>XP</span>
              <span className="font-mono font-extrabold text-amber-500 text-sm leading-none">{sessionXP}</span>
            </div>
          </Link>

          {/* Play Now CTA */}
          <Link
            href="/class-select"
            className="relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all duration-300 active:scale-95 hover:scale-[1.03] hover:shadow-cyan-500/40"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Play Now</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
