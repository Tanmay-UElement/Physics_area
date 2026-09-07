'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Target,
  Trophy,
  ChevronRight,
} from 'lucide-react';

/* ─── Floating physics equation particles ────────────────────────── */
const EQUATIONS = [
  'F = ma', 'v = d/t', 'E = mc²', 'F = qvB',
  'V = IR', 'τ = rF', 'p = mv', 'KE = ½mv²',
  'f = 1/T', 'ε = -dΦ/dt', 'n₁sinθ₁ = n₂sinθ₂',
];

interface Particle {
  id: number;
  eq: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  opacity: number;
  size: number;
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); }
      }),
      { threshold: 0.12 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function LandingPage() {
  const { theme } = useGameStore();
  const isLight = theme === 'light';

  const [previewRound] = useState(generateHorizontalRounds()[0]);
  const [userVelocity, setUserVelocity] = useState<number>(19.8);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<RoundResult | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useScrollReveal();

  /* Generate floating particles only on client to avoid hydration mismatch */
  useEffect(() => {
    setMounted(true);
    setParticles(
      EQUATIONS.map((eq, i) => ({
        id: i,
        eq,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 6,
        opacity: 0.07 + Math.random() * 0.12,
        size: 10 + Math.random() * 8,
      })),
    );
  }, []);

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
      description: 'Master horizontal projectiles, live torque balance, 2D vector tug, and calculation collisions.',
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      conceptsCount: '8 Concepts (6 Active)',
      status: 'UNLOCKED',
      active: true,
      color: 'from-cyan-500/15 to-blue-600/15 border-cyan-500/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      accentColor: 'cyan',
      glowColor: 'rgba(34,211,238,0.15)',
    },
    {
      id: 'volt',
      name: 'Volt Class',
      subtitle: 'Electricity & Magnetism',
      description: "Ohm's Law breadboard circuits, RC charging race, Coulomb tug, Lorentz magnetic maze, and Kirchhoff network.",
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      conceptsCount: '8 Concepts (8 Active)',
      status: 'UNLOCKED',
      active: true,
      color: 'from-purple-500/15 to-indigo-600/15 border-purple-500/40',
      badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      accentColor: 'purple',
      glowColor: 'rgba(168,85,247,0.15)',
    },
    {
      id: 'wave',
      name: 'Wave Class',
      subtitle: 'Sound & Optics',
      description: "Snell's law refraction, Doppler shift frequency, wave interference arenas, and resonance studio.",
      icon: <Radio className="w-6 h-6 text-emerald-400" />,
      conceptsCount: '4 Concepts (4 Active)',
      status: 'UNLOCKED',
      active: true,
      color: 'from-emerald-500/15 to-teal-600/15 border-emerald-500/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      accentColor: 'emerald',
      glowColor: 'rgba(16,185,129,0.15)',
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
      color: 'from-amber-500/5 to-red-600/5 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-500 border-slate-700',
      accentColor: 'amber',
      glowColor: 'transparent',
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
      color: 'from-blue-500/5 to-sky-600/5 border-slate-800',
      badgeBg: 'bg-slate-800 text-slate-500 border-slate-700',
      accentColor: 'blue',
      glowColor: 'transparent',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020817] text-slate-100'
    }`}>
      <Navbar />

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className={`relative overflow-hidden pt-16 pb-24 px-6 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800/60'
      }`}>
        {/* Deep background gradient */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {!isLight && (
            <>
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,102,241,0.12)_0%,transparent_60%)]" />
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_10%,rgba(34,211,238,0.08)_0%,transparent_55%)]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-purple-500/8 blur-[140px] rounded-full" />
            </>
          )}
          {isLight && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-400/10 blur-[120px] rounded-full" />
          )}
        </div>

        {/* Floating equation particles */}
        {mounted && !isLight && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute font-mono font-bold select-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `${p.size}px`,
                  opacity: p.opacity,
                  color: '#22d3ee',
                  animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                }}
              >
                {p.eq}
              </span>
            ))}
          </div>
        )}

        {/* Hero content */}
        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
          {/* Eyebrow badge */}
          <div className="animate-fade-up flex justify-center">
            <div className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full border text-xs font-mono font-bold shadow-lg ${
              isLight
                ? 'bg-white border-slate-200 text-purple-600 shadow-purple-100'
                : 'bg-slate-900/80 border-purple-500/40 text-purple-300 shadow-purple-500/10'
            }`}>
              <Atom className="w-4 h-4 text-purple-400 animate-spin-slow" />
              <span>GAMIFIED 2D PHYSICS SIMULATOR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>15 GAMES LIVE</span>
            </div>
          </div>

          {/* Main headline */}
          <div className="animate-fade-up delay-100 space-y-2">
            <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.92] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Don't learn physics.
            </h1>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.92] shimmer-text">
              Win at it.
            </h1>
          </div>

          {/* Subheadline */}
          <p className={`animate-fade-up delay-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            Ride real physics simulations with your avatar pod. Solve launch vectors, circuit breadboards, Lorentz magnetic deflection, wave optics, and Kirchhoff networks!
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up delay-300 pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/class-select"
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-95 hover:shadow-purple-500/50 hover:scale-[1.03]"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>EXPLORE ALL CLASSES</span>
              <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Link>

            <a
              href="#live-preview"
              className={`group w-full sm:w-auto px-8 py-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <Eye className="w-5 h-5 text-cyan-500" />
              <span>TRY LIVE DEMO BELOW</span>
            </a>
          </div>

          {/* Value props */}
          <div className={`animate-fade-up delay-400 pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-mono ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: 'Instant Guest Play' },
              { icon: <CheckCircle2 className="w-4 h-4 text-cyan-500" />, text: 'Kinetic Class (6 Games)' },
              { icon: <CheckCircle2 className="w-4 h-4 text-purple-500" />, text: 'Volt Class (8 Games)' },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, text: 'Wave Class (4 Games)' },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                {v.icon}
                <span>{v.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS TICKER BAR ───────────────────────────────────────── */}
      <div className={`relative overflow-hidden py-3 border-b ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800/60'
      }`}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, ri) => (
            <div key={ri} className="flex items-center gap-10 px-10">
              {[
                '⚡ 15 Active Games',
                '🎯 3 Physics Classes Unlocked',
                '🔬 Kinetic Class Live',
                '⚡ Volt Class Live',
                '〰️ Wave Class Live',
                '🏆 XP-Based Progression',
                '🤖 4 AI Pod Agents',
                '60 FPS Simulations',
                '±5% Precision Tolerance',
                '🧮 Real Physics Math',
              ].map((item, i) => (
                <span key={i} className={`text-xs font-mono font-bold ${
                  isLight ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className={`py-20 px-6 border-b ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#020817] border-slate-800/60'
      }`}>
        <div className="max-w-6xl mx-auto scroll-reveal">
          <div className="text-center space-y-2 mb-14">
            <span className="text-xs font-mono text-purple-400 tracking-widest uppercase">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-black">Three Steps to Master Physics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-purple-500/40 via-cyan-500/40 to-emerald-500/40 z-0" />

            {[
              {
                num: '01',
                title: 'Calculate or Drag',
                desc: 'Calculate launch velocity, resistor values, Lorentz cyclotron radius, or KCL branch currents.',
                color: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                glow: 'shadow-purple-500/10',
              },
              {
                num: '02',
                title: 'Watch It Fire',
                desc: 'Hit fire and watch your avatar pod ride 2D mechanics and electrodynamic simulations at 60 FPS.',
                color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                glow: 'shadow-cyan-500/10',
              },
              {
                num: '03',
                title: "See If You're Right",
                desc: 'Land within ±5% tolerance for 100 XP Bullseyes and level up your physical problem solving!',
                color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
                glow: 'shadow-emerald-500/10',
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`card-lift relative z-10 p-7 rounded-2xl border shadow-xl ${
                  isLight ? 'bg-white border-slate-200 shadow-slate-100' : `bg-slate-900/80 border-slate-800 ${step.glow}`
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-black text-xl font-mono mb-5 ${step.color}`}>
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE PREVIEW EMBED ─────────────────────────────────────── */}
      <section id="live-preview" className={`py-20 px-6 border-b relative overflow-hidden ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/60'
      }`}>
        {!isLight && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />
          </div>
        )}
        <div className="max-w-7xl mx-auto space-y-10 relative z-10 scroll-reveal">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold shadow-lg shadow-cyan-500/10">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE PLAYABLE EMBED — ZERO GATE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black">
              Try Kinetic Concept #1: Horizontal Projectile Motion
            </h2>
            <p className={`text-sm max-w-xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Calculate horizontal launch velocity using h = 20m and d = 40m (exact v = 19.80 m/s). Fire your pod!
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

      {/* ── PHYSICS CLASSES GRID ───────────────────────────────────── */}
      <section className={`py-20 px-6 ${isLight ? 'bg-white' : 'bg-[#020817]'}`}>
        <div className="max-w-6xl mx-auto space-y-12 scroll-reveal">
          <div className={`flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b pb-6 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div>
              <span className="text-xs font-mono text-purple-400 tracking-widest uppercase">CURRICULUM ROADMAP</span>
              <h2 className="text-3xl sm:text-4xl font-black mt-1">Physics Arena Classes</h2>
            </div>
            <Link
              href="/class-select"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors group"
            >
              <span>Explore All 5 Classes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classCards.map((card) => (
              <div
                key={card.id}
                className={`card-lift gradient-border p-6 rounded-2xl bg-gradient-to-br border shadow-xl flex flex-col justify-between space-y-6 ${card.color} ${
                  isLight ? 'bg-white' : 'bg-slate-900/90'
                } ${card.active ? '' : 'opacity-70'}`}
                style={card.active && !isLight ? { boxShadow: `0 8px 32px ${card.glowColor}` } : {}}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      {card.icon}
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${card.badgeBg}`}>
                      {card.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{card.name}</h3>
                    <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{card.subtitle}</p>
                  </div>

                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {card.description}
                  </p>
                </div>

                <div className={`pt-4 border-t flex items-center justify-between ${
                  isLight ? 'border-slate-200' : 'border-slate-800/60'
                }`}>
                  <span className="text-xs font-mono text-slate-400">{card.conceptsCount}</span>
                  {card.active ? (
                    <Link
                      href="/class-select"
                      className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1 shadow-md shadow-purple-500/20 transition-all active:scale-95"
                    >
                      <span>Explore</span>
                      <Play className="w-3 h-3 fill-slate-950" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ─────────────────────────────────────────────── */}
      <footer className={`py-20 px-6 border-t relative overflow-hidden ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
      }`}>
        {!isLight && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-purple-500/8 blur-[100px] rounded-full" />
          </div>
        )}
        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10 scroll-reveal">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Guest Session Mode — In-Memory Progress</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black">
            Ready to solve electricity,<br />magnetism, and kinematics?
          </h2>

          <p className={`text-sm max-w-lg mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Jump into any of 15 active physics games across 3 unlocked classes. No account required — start playing instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/class-select"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>EXPLORE PHYSICS CLASSES</span>
            </Link>
            <Link
              href="/stats"
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
                isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>View Session Stats</span>
            </Link>
          </div>

          {/* Footer credits */}
          <div className={`pt-8 border-t text-xs font-mono ${
            isLight ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-600'
          }`}>
            <p>PhysicsArena — Gamified Physics Education Platform</p>
            <p className="mt-1">Built with Next.js • React 19 • Tailwind CSS • Pixi.js</p>
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
