'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useGameStore } from '@/store/useGameStore';
import {
  Zap,
  Sparkles,
  Flame,
  Radio,
  Globe2,
  Lock,
  Play,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
} from 'lucide-react';

export default function ClassSelectPage() {
  const { theme } = useGameStore();
  const isLight = theme === 'light';

  const [expandedClass, setExpandedClass] = useState<string | null>('kinetic');

  const kineticConcepts = [
    { num: 1, name: 'Horizontal Projectile Motion', type: 'Scalar Kinematics', status: 'PLAYABLE NOW', playable: true, route: '/match/trick-shot' },
    { num: 2, name: 'Lever & Torque Balance', type: 'Intuitive Drag & Feel', status: 'PLAYABLE NOW', playable: true, route: '/match/lever-balance' },
    { num: 3, name: 'Vector Tug-of-War', type: '2D Vector Drag Mechanics', status: 'PLAYABLE NOW', playable: true, route: '/match/vector-tug' },
    { num: 4, name: 'Free Fall / Gravity Misconception', type: 'Predict & Reveal (Calculation)', status: 'PLAYABLE NOW', playable: true, route: '/match/free-fall' },
    { num: 5, name: 'Elastic Collision (Equal Mass)', type: 'Predict & Reveal (Calculation)', status: 'PLAYABLE NOW', playable: true, route: '/match/elastic-collision' },
    { num: 6, name: 'Momentum Conservation (Unequal)', type: 'Predict & Reveal (Calculation)', status: 'PLAYABLE NOW', playable: true, route: '/match/momentum-conservation' },
    { num: 7, name: 'Ramp / Inclined Plane', type: 'Trick Shot', status: 'PLANNED', playable: false },
    { num: 8, name: 'Two-Stage "Boss Round"', type: 'Boss Challenge', status: 'PLANNED', playable: false },
  ];

  const voltConcepts = [
    { num: 1, name: 'Circuit Builder', type: "Ohm's Law (V = IR)", status: 'PLAYABLE NOW', playable: true, route: '/match/volt-circuit-builder' },
    { num: 2, name: 'Capacitor Race', type: 'RC Charging (τ = RC)', status: 'PLAYABLE NOW', playable: true, route: '/match/volt-capacitor-race' },
    { num: 3, name: 'Coulomb Tug', type: "Coulomb's Law (F = kq₁q₂/r²)", status: 'PLAYABLE NOW', playable: true, route: '/match/volt-coulomb-tug' },
    { num: 4, name: 'Magnetic Maze', type: 'Lorentz Force (F = qv × B)', status: 'PLAYABLE NOW', playable: true, route: '/match/volt-magnetic-maze' },
    { num: 5, name: 'Generator Crank', type: "Faraday's Law (ε = -dΦ/dt)", status: 'PLAYABLE NOW', playable: true, route: '/match/volt-generator-crank' },
    { num: 6, name: 'Series vs. Parallel Puzzle', type: 'Circuit Combination', status: 'PLAYABLE NOW', playable: true, route: '/match/volt-series-parallel' },
    { num: 7, name: 'Power Grid Balancer', type: 'Power Law (P = VI)', status: 'PLAYABLE NOW', playable: true, route: '/match/volt-power-grid' },
    { num: 8, name: "Kirchhoff's Boss Round", type: "Kirchhoff's Current Law (KCL)", status: 'PLAYABLE NOW', playable: true, route: '/match/volt-kirchhoff' },
  ];

  const waveConcepts = [
    { num: 1, name: 'Refraction Lab', type: "Snell's Law (n₁sinθ₁ = n₂sinθ₂)", status: 'PLAYABLE NOW', playable: true, route: '/match/wave-refraction' },
    { num: 2, name: 'Doppler Chase', type: "Doppler Shift (f' = f(v±v_o)/(v∓v_s))", status: 'PLAYABLE NOW', playable: true, route: '/match/wave-doppler' },
    { num: 3, name: 'Wave Interference Arena', type: 'Interference Patterns', status: 'PLAYABLE NOW', playable: true, route: '/match/wave-interference' },
    { num: 4, name: 'Resonance Studio', type: 'Harmonics & Standing Waves', status: 'PLAYABLE NOW', playable: true, route: '/match/wave-resonance' },
  ];

  const futureClasses = [
    {
      id: 'thermo',
      name: 'Thermo Class',
      subtitle: 'Heat & Thermodynamics',
      conceptsCount: '4 Concepts Planned',
      description: 'Ideal gas expansion work, heat exchange engines, kinetic particle motion, and entropy.',
      icon: <Flame className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/8 to-red-600/8',
      borderColor: 'border-amber-500/20',
    },
    {
      id: 'orbit',
      name: 'Orbit Class',
      subtitle: 'Gravity & Astrophysics',
      conceptsCount: '3 Concepts Planned',
      description: 'Escape velocities, planetary gravity wells, Keplerian orbits, and Lagrange points.',
      icon: <Globe2 className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500/8 to-sky-600/8',
      borderColor: 'border-blue-500/20',
    },
  ];

  const activeClasses = [
    {
      id: 'kinetic',
      label: 'CLASS 1 OF 5',
      labelColor: 'text-cyan-500',
      name: 'Kinetic Class',
      description: 'Mechanics, Kinematics, Torque Balance, 2D Vectors & Numerical Collisions',
      icon: <Zap className="w-8 h-8 text-cyan-400" />,
      iconBg: 'bg-cyan-500/15 border-cyan-500/40',
      iconGlow: 'shadow-cyan-500/20',
      badge: 'UNLOCKED • 6 GAMES ACTIVE',
      badgeStyle: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      gradient: isLight
        ? 'from-cyan-500/8 via-white to-slate-50 border-cyan-500/40 shadow-cyan-500/8'
        : 'from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40 shadow-cyan-500/15',
      startRoute: '/match/trick-shot',
      startGradient: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25',
      btnText: 'START KINETIC MATCH',
      accentBg: isLight ? 'bg-white border-cyan-500/30' : 'bg-slate-950/80 border-cyan-500/30',
      accentText: 'text-cyan-400',
      accentBadge: 'bg-cyan-500 text-slate-950',
      playGradient: 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20',
      concepts: kineticConcepts,
      sectionTitle: 'Kinetic Concepts & Games',
    },
    {
      id: 'volt',
      label: 'CLASS 2 OF 5',
      labelColor: 'text-purple-400',
      name: 'Volt Class',
      description: "Electricity & Magnetism — Power Grid (P = VI), Series vs. Parallel, Faraday's Generator, Ohm's Law & Kirchhoff",
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      iconBg: 'bg-purple-500/15 border-purple-500/40',
      iconGlow: 'shadow-purple-500/20',
      badge: 'UNLOCKED • 8 GAMES ACTIVE',
      badgeStyle: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      gradient: isLight
        ? 'from-purple-500/8 via-white to-slate-50 border-purple-500/40 shadow-purple-500/8'
        : 'from-purple-950/40 via-slate-900 to-slate-950 border-purple-500/40 shadow-purple-500/15',
      startRoute: '/match/volt-power-grid',
      startGradient: 'from-purple-500 via-indigo-600 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-purple-500/25',
      btnText: 'START VOLT MATCH',
      accentBg: isLight ? 'bg-white border-purple-500/30' : 'bg-slate-950/80 border-purple-500/30',
      accentText: 'text-purple-400',
      accentBadge: 'bg-purple-500 text-slate-950',
      playGradient: 'from-purple-500 via-indigo-600 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-purple-500/20',
      concepts: voltConcepts,
      sectionTitle: 'Volt Concepts & Playable Games',
    },
    {
      id: 'wave',
      label: 'CLASS 3 OF 5',
      labelColor: 'text-emerald-400',
      name: 'Wave Class',
      description: "Sound & Optics — Refraction Lab, Doppler Chase, Wave Interference & Resonance Studio",
      icon: <Radio className="w-8 h-8 text-emerald-400" />,
      iconBg: 'bg-emerald-500/15 border-emerald-500/40',
      iconGlow: 'shadow-emerald-500/20',
      badge: 'UNLOCKED • ALL 4 GAMES ACTIVE!',
      badgeStyle: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      gradient: isLight
        ? 'from-emerald-500/8 via-white to-slate-50 border-emerald-500/40 shadow-emerald-500/8'
        : 'from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-500/15',
      startRoute: '/match/wave-resonance',
      startGradient: 'from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/25',
      btnText: 'START WAVE MATCH',
      accentBg: isLight ? 'bg-white border-emerald-500/30' : 'bg-slate-950/80 border-emerald-500/30',
      accentText: 'text-emerald-400',
      accentBadge: 'bg-emerald-500 text-slate-950',
      playGradient: 'from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/20',
      concepts: waveConcepts,
      sectionTitle: 'Wave Concepts & Playable Games',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#020817] text-slate-100'
    }`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Page Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold shadow-lg shadow-cyan-500/10">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>5 PHYSICS CLASSES • 15 GAMES ACTIVE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Select Physics Class
          </h1>
          <p className={`text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Master Kinetic, Volt, and Wave mechanics to build deep physical intuition through numerical calculation!
          </p>

          {/* Quick stat badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {[
              { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, text: 'XP Progression', color: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
              { icon: <Target className="w-3.5 h-3.5 text-cyan-400" />, text: '±5% Precision', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' },
              { icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />, text: '4 AI Pod Agents', color: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
            ].map((badge, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${badge.color}`}>
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Classes Accordion */}
        {activeClasses.map((cls) => {
          const isOpen = expandedClass === cls.id;
          const playableCount = cls.concepts.filter((c) => c.playable).length;
          return (
            <div
              key={cls.id}
              className={`rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all duration-500 bg-gradient-to-br ${cls.gradient}`}
            >
              {/* Background watermark icon */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.06] pointer-events-none">
                <div className="w-48 h-48">{cls.icon}</div>
              </div>

              {/* Header — always visible, clickable to expand */}
              <button
                type="button"
                onClick={() => setExpandedClass(isOpen ? null : cls.id)}
                className="w-full text-left p-8 relative z-10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${cls.iconBg} ${cls.iconGlow}`}>
                      {cls.icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${cls.labelColor}`}>{cls.label}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${cls.badgeStyle}`}>
                          {cls.badge}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black">{cls.name}</h2>
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{cls.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={cls.startRoute}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-5 py-3 rounded-2xl bg-gradient-to-r ${cls.startGradient} text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95`}
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{cls.btnText}</span>
                    </Link>
                    <div className={`p-2.5 rounded-xl border transition-colors ${isLight ? 'border-slate-300 text-slate-500' : 'border-slate-700 text-slate-400'}`}>
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
              </button>

              {/* Concept grid — collapsible */}
              {isOpen && (
                <div className="px-8 pb-8 space-y-4 relative z-10 animate-fade-up">
                  <div className={`border-t pt-6 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className={`text-sm font-mono font-bold uppercase tracking-wider ${cls.accentText}`}>
                        {cls.sectionTitle}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">{playableCount} Playable Now</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cls.concepts.map((concept) => (
                        <div
                          key={concept.num}
                          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono transition-all ${
                            concept.playable
                              ? `card-lift ${cls.accentBg} shadow-md`
                              : isLight
                              ? 'bg-slate-100/60 border-slate-200 text-slate-400'
                              : 'bg-slate-950/40 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                              concept.playable ? cls.accentBadge : isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-slate-600'
                            }`}>
                              {concept.num}
                            </span>
                            <div>
                              <div className={`font-bold ${concept.playable ? (isLight ? 'text-slate-900' : 'text-slate-100') : ''}`}>
                                {concept.name}
                              </div>
                              <div className="text-[10px] text-slate-400">{concept.type}</div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {concept.playable && concept.route ? (
                              <Link
                                href={concept.route}
                                className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${cls.playGradient} text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95 transition-all`}
                              >
                                <span>PLAY</span>
                                <Play className="w-3 h-3 fill-slate-950" />
                              </Link>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-slate-600 border border-slate-800'
                              }`}>
                                {concept.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Future Classes */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Lock className="w-5 h-5 text-slate-400" />
              <span>Future Physics Classes (Classes 4–5)</span>
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">Post-MVP Expansion</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {futureClasses.map((cls) => (
              <div
                key={cls.id}
                className={`p-6 rounded-3xl border space-y-5 opacity-70 hover:opacity-90 transition-all bg-gradient-to-br ${cls.color} ${cls.borderColor} ${
                  isLight ? 'bg-white shadow-md' : 'bg-slate-900/40 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    {cls.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    LOCKED
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold">{cls.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{cls.subtitle}</p>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {cls.description}
                </p>

                <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono text-slate-400 ${
                  isLight ? 'border-slate-200' : 'border-slate-800/60'
                }`}>
                  <span>{cls.conceptsCount}</span>
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
