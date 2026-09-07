'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useGameStore } from '@/store/useGameStore';
import {
  Trophy,
  Target,
  Zap,
  BarChart2,
  ShieldAlert,
  Play,
  CheckCircle2,
  Clock,
  User,
  TrendingUp,
  Award,
  Activity,
} from 'lucide-react';

export default function SessionStatsPage() {
  const { sessionXP, sessionStats, theme } = useGameStore();
  const isLight = theme === 'light';

  const userLevel = Math.floor(sessionXP / 200) + 1;
  const nextLevelXP = userLevel * 200;
  const levelProgress = Math.min(100, Math.round((sessionXP / nextLevelXP) * 100));

  const statCards = [
    {
      label: 'TOTAL XP',
      value: `+${sessionXP}`,
      sub: 'Earned this session',
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      color: 'text-amber-400',
      iconBg: isLight ? 'bg-amber-100 border-amber-200' : 'bg-amber-500/10 border-amber-500/30',
      glow: isLight ? '' : 'shadow-amber-500/5',
    },
    {
      label: 'ACCURACY',
      value: `${sessionStats.accuracy}%`,
      sub: 'Hit rate ratio',
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      color: 'text-emerald-400',
      iconBg: isLight ? 'bg-emerald-100 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30',
      glow: isLight ? '' : 'shadow-emerald-500/5',
    },
    {
      label: 'MATCHES PLAYED',
      value: String(sessionStats.totalMatches),
      sub: 'Completed matches',
      icon: <BarChart2 className="w-5 h-5 text-cyan-400" />,
      color: 'text-cyan-400',
      iconBg: isLight ? 'bg-cyan-100 border-cyan-200' : 'bg-cyan-500/10 border-cyan-500/30',
      glow: isLight ? '' : 'shadow-cyan-500/5',
    },
    {
      label: 'BULLSEYES',
      value: String(sessionStats.hitsCount),
      sub: `/ ${sessionStats.totalRoundsPlayed} rounds`,
      icon: <CheckCircle2 className="w-5 h-5 text-purple-400" />,
      color: 'text-purple-400',
      iconBg: isLight ? 'bg-purple-100 border-purple-200' : 'bg-purple-500/10 border-purple-500/30',
      glow: isLight ? '' : 'shadow-purple-500/5',
    },
  ];

  const tierStats = [
    { label: 'Bullseyes (≤5%)', count: sessionStats.hitsCount, color: 'text-emerald-400', bar: 'bg-emerald-500', pct: sessionStats.totalRoundsPlayed > 0 ? (sessionStats.hitsCount / sessionStats.totalRoundsPlayed) * 100 : 0 },
    { label: 'Near Misses (5–15%)', count: sessionStats.closeCount, color: 'text-amber-400', bar: 'bg-amber-500', pct: sessionStats.totalRoundsPlayed > 0 ? (sessionStats.closeCount / sessionStats.totalRoundsPlayed) * 100 : 0 },
    { label: 'Misses (>15%)', count: sessionStats.missCount, color: 'text-slate-400', bar: 'bg-slate-600', pct: sessionStats.totalRoundsPlayed > 0 ? (sessionStats.missCount / sessionStats.totalRoundsPlayed) * 100 : 0 },
  ];

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#020817] text-slate-100'
    }`}>
      <Navbar />

      {/* Background decoration */}
      {!isLight && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_70%_0%,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_10%_100%,rgba(34,211,238,0.05)_0%,transparent_70%)]" />
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8 relative z-10">

        {/* Guest Session Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
          isLight
            ? 'bg-amber-50 border-amber-300 text-amber-800'
            : 'bg-amber-500/8 border-amber-500/25 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isLight ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-xs ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>GUEST SESSION ACTIVE</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isLight ? 'bg-amber-200 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
                  In-Memory
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-amber-700/80' : 'text-slate-300'}`}>
                Progress won't be saved after closing or refreshing.{' '}
                <span className={`font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>Sign in soon to save your progress!</span>
              </p>
            </div>
          </div>
          <Link
            href="/class-select"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Continue Playing</span>
          </Link>
        </div>

        {/* Profile + Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Profile Card */}
          <div className={`md:col-span-4 p-6 rounded-3xl border shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            {!isLight && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.05)_0%,transparent_70%)] pointer-events-none" />
            )}

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <User className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-cyan-400'}`} />
                <span className={`font-mono text-xs font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Guest Pilot Profile
                </span>
              </div>
              <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border ${
                isLight ? 'bg-cyan-50 border-cyan-300 text-cyan-600' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                LEVEL {userLevel}
              </span>
            </div>

            {/* Avatar */}
            <div className="py-4 flex flex-col items-center space-y-4 relative z-10">
              <div className="relative">
                <div className={`w-28 h-28 rounded-full p-1 shadow-2xl animate-float ${
                  isLight ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500' : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600'
                }`}>
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
                      isLight ? 'bg-cyan-50 border-cyan-300' : 'bg-cyan-500/15 border-cyan-400'
                    }`}>
                      <Zap className={`w-8 h-8 ${isLight ? 'text-cyan-500' : 'text-cyan-300'}`} />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow">
                  EQUIPPED
                </div>
              </div>

              <div className="text-center">
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Cyber Jetpack Pod v1</h3>
                <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Standard Kinetic Launch Vehicle</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className={`space-y-2 pt-2 border-t relative z-10 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className={`flex justify-between text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>XP → Level {userLevel + 1}</span>
                <span className="text-amber-500 font-bold">{sessionXP} / {nextLevelXP} XP</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className={`text-[10px] font-mono text-right ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                {levelProgress}% to next level
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-8 grid grid-cols-2 gap-4">
            {statCards.map((stat, i) => (
              <div key={i} className={`card-lift p-6 rounded-2xl border shadow-xl flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200' : `bg-slate-900/80 border-slate-800 ${stat.glow}`
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</span>
                  <div className={`p-2 rounded-xl border ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <div className={`text-3xl font-black font-mono mt-4 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Precision Tier Breakdown */}
        <div className={`p-6 rounded-3xl border shadow-2xl space-y-5 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 border-b pb-4 border-slate-800/60">
            <Activity className={`w-5 h-5 ${isLight ? 'text-cyan-500' : 'text-cyan-400'}`} />
            <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Precision Tier Breakdown</h2>
          </div>
          <div className="space-y-4">
            {tierStats.map((tier, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className={`font-bold ${tier.color}`}>{tier.label}</span>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>{tier.count} rounds</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
                  <div
                    className={`h-full ${tier.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${tier.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match History */}
        <div className={`p-6 rounded-3xl border shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Clock className={`w-5 h-5 ${isLight ? 'text-cyan-500' : 'text-cyan-400'}`} />
                <span>Session Match History</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>In-memory telemetry log of matches completed this session</p>
            </div>
            <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
              isLight ? 'text-slate-500 border-slate-200 bg-slate-50' : 'text-slate-500 border-slate-800 bg-slate-950/50'
            }`}>
              {sessionStats.matchHistory.length} Logged
            </span>
          </div>

          {sessionStats.matchHistory.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800 border border-slate-700'
              }`}>
                <BarChart2 className="w-8 h-8 text-slate-500" />
              </div>
              <div className={`text-sm font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>No completed matches in this session yet.</div>
              <Link
                href="/match/trick-shot"
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-xs transition-all hover:scale-[1.02] ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-600 border-cyan-300 hover:bg-cyan-100'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Play First Match Now</span>
              </Link>
            </div>
          ) : (
            <div className={`divide-y text-xs font-mono ${isLight ? 'divide-slate-100' : 'divide-slate-800/80'}`}>
              {sessionStats.matchHistory.map((m) => (
                <div key={m.id} className={`py-3.5 flex items-center justify-between px-2 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/40'
                }`}>
                  <div>
                    <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{m.conceptName}</div>
                    <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(m.timestamp).toLocaleTimeString()} • {m.totalRounds} Rounds
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-500">+{m.score} XP</div>
                    <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">Completed</div>
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
