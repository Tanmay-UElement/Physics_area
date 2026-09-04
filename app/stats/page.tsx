'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useGameStore } from '@/store/useGameStore';
import {
  Trophy,
  Target,
  Award,
  Zap,
  BarChart2,
  ShieldAlert,
  Play,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';

export default function SessionStatsPage() {
  const { sessionXP, sessionStats } = useGameStore();

  const userLevel = Math.floor(sessionXP / 200) + 1;
  const nextLevelXP = userLevel * 200;
  const levelProgress = Math.min(100, Math.round((sessionXP / nextLevelXP) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Guest Session Notification Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-amber-300">GUEST SESSION ACTIVE</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                  In-Memory
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Progress won't be saved after closing or refreshing this tab. <span className="text-amber-400 font-semibold">Sign in soon to save your progress!</span>
              </p>
            </div>
          </div>

          <Link
            href="/class-select"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Continue Playing</span>
          </Link>
        </div>

        {/* Profile Header & Avatar Gear Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Avatar Pod Equipment Preview Card */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-xs text-slate-400 font-bold uppercase">Guest Pilot Profile</span>
              </div>
              <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                LEVEL {userLevel}
              </span>
            </div>

            {/* Visual Pod Graphic */}
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-1 shadow-2xl shadow-cyan-500/30 animate-pulse">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-cyan-300" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow">
                  EQUIPPED
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Cyber Jetpack Pod v1</h3>
                <p className="text-xs text-slate-400 font-mono">Standard Kinetic Launch Vehicle</p>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>XP Progress to Level {userLevel + 1}</span>
                <span className="text-amber-400 font-bold">{sessionXP} / {nextLevelXP} XP</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TOTAL XP</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-4">
                +{sessionXP}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Earned this session</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>ACCURACY</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-4">
                {sessionStats.accuracy}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Hit rate ratio</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>MATCHES PLAYED</span>
                <BarChart2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-400 font-mono mt-4">
                {sessionStats.totalMatches}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Completed matches</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>BULLSEYES</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="text-3xl font-black text-white font-mono mt-4">
                {sessionStats.hitsCount} <span className="text-xs text-slate-500 font-normal">/ {sessionStats.totalRoundsPlayed} rounds</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">±5% bullseye landings</div>
            </div>
          </div>
        </div>

        {/* Match History Table */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Session Match History</span>
              </h2>
              <p className="text-xs text-slate-400">In-memory telemetry log of matches completed this session</p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {sessionStats.matchHistory.length} Matches Logged
            </span>
          </div>

          {sessionStats.matchHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-3">
              <BarChart2 className="w-8 h-8 mx-auto text-slate-700" />
              <div>No completed matches in this session yet.</div>
              <Link
                href="/match/trick-shot"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 font-bold"
              >
                <span>Play First Match Now</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 text-xs font-mono">
              {sessionStats.matchHistory.map((m) => (
                <div key={m.id} className="py-3.5 flex items-center justify-between hover:bg-slate-950/40 px-2 rounded-lg">
                  <div>
                    <div className="font-bold text-slate-200">{m.conceptName}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(m.timestamp).toLocaleTimeString()} • {m.totalRounds} Rounds
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">+{m.score} XP</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">Completed</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
