'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { MatchCanvas } from '@/components/match/MatchCanvas';
import { SolvePanel } from '@/components/match/SolvePanel';
import { ResultModal } from '@/components/match/ResultModal';
import { RoundResult } from '@/lib/physics/types';
import { generateHorizontalRounds } from '@/lib/physics/horizontalProjectile';
import { useGameStore } from '@/store/useGameStore';
import {
  Play,
  Zap,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Atom,
  Flame,
  Radio,
  Globe2,
  ShieldAlert,
  Scale,
  Compass,
} from 'lucide-react';

export default function LandingPage() {
  const { theme } = useGameStore();
  const isLight = theme === 'light';

  // Live Preview Embed round data (Concept #1 preview)
  const [previewRound] = useState(generateHorizontalRounds()[0]);
  const [userVelocity, setUserVelocity] = useState<number>(19.8);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<RoundResult | null>(null);

  const handleLaunch = (velocity: number) => {
    setUserVelocity(velocity);
    setPreviewResult(null);
    setIsSimulating(true);
  };

  const handleSimulationComplete = (result: RoundResult) => {
    setIsSimulating(false);
    setPreviewResult(result);
  };

  const classCards = [
    {
      id: 'kinetic',
      name: 'Kinetic Class',
      subtitle: 'Mechanics & Kinematics',
      description: 'Master horizontal projectiles, live torque balance, and 2D vector tug-of-war.',
      icon: <Zap className="w-6 h-6 text-cyan-500" />,
      conceptsCount: '8 Concepts (3 Active)',
      status: 'UNLOCKED',
      active: true,
      color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40',
    },
    {
      id: 'volt',
      name: 'Volt Class',
      subtitle: 'Electricity & Magnetism',
      description: 'Lorentz magnetic deflection, charged particle fields, and circuit loops.',
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      conceptsCount: '5 Concepts Planned',
      status: 'POST-MVP',
      active: false,
      color: 'from-purple-500/10 to-indigo-600/10 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-500 border-slate-700',
    },
    {
      id: 'thermo',
      name: 'Thermo Class',
      subtitle: 'Heat & Thermodynamics',
      description: 'Ideal gas expansion, heat engines, kinetic energy, and entropy.',
      icon: <Flame className="w-6 h-6 text-amber-400" />,
      conceptsCount: '4 Concepts Planned',
      status: 'POST-MVP',
      active: false,
      color: 'from-amber-500/10 to-red-600/10 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-500 border-slate-700',
    },
    {
      id: 'wave',
      name: 'Wave Class',
      subtitle: 'Sound & Optics',
      description: 'Snell\'s law refraction, Doppler shift frequency, and wave interference.',
      icon: <Radio className="w-6 h-6 text-emerald-400" />,
      conceptsCount: '4 Concepts Planned',
      status: 'POST-MVP',
      active: false,
      color: 'from-emerald-500/10 to-teal-600/10 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-500 border-slate-700',
    },
    {
      id: 'orbit',
      name: 'Orbit Class',
      subtitle: 'Gravity & Astrophysics',
      description: 'Escape velocities, planetary gravity wells, and Keplerian orbits.',
      icon: <Globe2 className="w-6 h-6 text-blue-400" />,
      conceptsCount: '3 Concepts Planned',
      status: 'POST-MVP',
      active: false,
      color: 'from-blue-500/10 to-sky-600/10 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-500 border-slate-700',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Navbar />

      {/* HERO SECTION */}
      <section className={`relative overflow-hidden pt-12 pb-20 px-6 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800/60'
      }`}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono text-cyan-500 shadow-md ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <Atom className="w-4 h-4 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>GAMIFIED 2D PHYSICS SIMULATOR</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
            Don't learn physics. <br />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Win at it.
            </span>
          </h1>

          <p className={`text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            Ride real physics simulations with your avatar pod. Solve launch vectors, feel torque balance, and master 2D force mechanics through gameplay.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/class-select"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>PLAY NOW (GUEST MODE)</span>
            </Link>

            <a
              href="#live-preview"
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-5 h-5 text-cyan-500" />
              <span>TRY LIVE DEMO BELOW</span>
            </a>
          </div>

          {/* Value props */}
          <div className={`pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant Guest Play</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              <span>Matter.js & PixiJS Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              <span>Kinetic Class Active (3 Games)</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STRIP */}
      <section className={`py-16 px-6 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800/60'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <span className="text-xs font-mono text-cyan-500 tracking-wider uppercase">HOW IT WORKS</span>
            <h2 className="text-2xl sm:text-3xl font-black">Three Steps to Master Physics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 font-bold text-lg font-mono">
                1
              </div>
              <h3 className="text-lg font-bold">Solve or Drag</h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Calculate launch velocity, drag weights along a seesaw, or direct 2D force vectors.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-lg font-mono">
                2
              </div>
              <h3 className="text-lg font-bold">Watch It Fire</h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Hit launch and watch your cyber avatar pod ride real 2D physics simulations at 60 FPS.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-lg font-mono">
                3
              </div>
              <h3 className="text-lg font-bold">See If You're Right</h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Land within ±5% for 100 XP Bullseyes and analyze ideal trajectory overlays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PREVIEW EMBED */}
      <section id="live-preview" className={`py-20 px-6 border-b ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800/60'}`}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LIVE PLAYABLE EMBED — ZERO GATE</span>
            </div>
            <h2 className="text-3xl font-black">
              Try Kinetic Concept #1: Horizontal Projectile Motion
            </h2>
            <p className={`text-xs max-w-xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Test horizontal launch velocity directly below. Solve for v using h = 20m and d = 40m (exact v = 19.80 m/s).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 min-h-[480px]">
              <MatchCanvas
                round={previewRound}
                userVelocity={userVelocity}
                isSimulating={isSimulating}
                onSimulationComplete={handleSimulationComplete}
              />
            </div>
            <div className="lg:col-span-4">
              <SolvePanel
                round={previewRound}
                isSimulating={isSimulating}
                onLaunch={handleLaunch}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5 PHYSICS CLASSES ROW */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className={`flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b pb-6 ${
            isLight ? 'border-slate-300' : 'border-slate-800'
          }`}>
            <div>
              <span className="text-xs font-mono text-cyan-500 tracking-wider uppercase">CURRICULUM ROADMAP</span>
              <h2 className="text-3xl font-black mt-1">Physics Arena Classes</h2>
            </div>
            <Link
              href="/class-select"
              className="text-xs font-bold text-cyan-500 hover:underline flex items-center gap-1"
            >
              <span>Explore All 5 Classes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classCards.map((card) => (
              <div
                key={card.id}
                className={`p-6 rounded-2xl bg-gradient-to-br ${card.color} border shadow-xl flex flex-col justify-between space-y-6 ${
                  isLight ? 'bg-white' : 'bg-slate-900/90'
                } ${card.active ? 'hover:border-cyan-500/60 transition-colors' : 'opacity-75'}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      {card.icon}
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${card.badgeBg}`}>
                      {card.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{card.name}</h3>
                    <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{card.subtitle}</p>
                  </div>

                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {card.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{card.conceptsCount}</span>
                  {card.active ? (
                    <Link
                      href="/class-select"
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1 shadow-md shadow-cyan-500/20"
                    >
                      <span>Explore Games</span>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className={`py-16 px-6 border-t text-center space-y-8 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800/80'}`}>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Guest Session Mode — In-Memory Progress</span>
          </div>

          <h2 className="text-3xl font-black">
            Ready to solve kinematics and feel physics balance?
          </h2>

          <div className="pt-2 flex justify-center">
            <Link
              href="/class-select"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>START KINETIC CLASS MATCH</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Result Modal for Live Preview embed */}
      <ResultModal
        result={previewResult}
        isLastRound={false}
        onNext={() => setPreviewResult(null)}
      />
    </div>
  );
}
