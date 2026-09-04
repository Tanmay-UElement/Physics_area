'use client';

import React from 'react';
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
  Scale,
  Compass,
} from 'lucide-react';

export default function ClassSelectPage() {
  const { theme } = useGameStore();
  const isLight = theme === 'light';

  const kineticConcepts = [
    {
      num: 1,
      name: 'Horizontal Projectile Motion',
      type: 'Scalar Kinematics',
      status: 'PLAYABLE NOW',
      playable: true,
      route: '/match/trick-shot',
    },
    {
      num: 2,
      name: 'Lever & Torque Balance',
      type: 'Intuitive Drag & Feel',
      status: 'PLAYABLE NOW',
      playable: true,
      route: '/match/lever-balance',
    },
    {
      num: 3,
      name: 'Vector Tug-of-War',
      type: '2D Vector Drag Mechanics',
      status: 'PLAYABLE NOW',
      playable: true,
      route: '/match/vector-tug',
    },
    {
      num: 4,
      name: 'Free Fall / Gravity Misconception',
      type: 'Predict & Reveal',
      status: 'PLAYABLE NOW',
      playable: true,
      route: '/match/free-fall',
    },
    {
      num: 5,
      name: 'Elastic Collision (Equal Mass)',
      type: 'Predict & Reveal',
      status: 'PLAYABLE NOW',
      playable: true,
      route: '/match/elastic-collision',
    },
    {
      num: 6,
      name: 'Momentum Conservation (Unequal)',
      type: 'Predict & Reveal',
      status: 'PLAYABLE NOW',
      playable: true,
      route: '/match/momentum-conservation',
    },
    { num: 7, name: 'Ramp / Inclined Plane', type: 'Trick Shot', status: 'PLANNED', playable: false },
    { num: 8, name: 'Two-Stage "Boss Round"', type: 'Boss Challenge', status: 'PLANNED', playable: false },
  ];

  const futureClasses = [
    {
      id: 'volt',
      name: 'Volt Class',
      subtitle: 'Electricity & Magnetism',
      conceptsCount: '5 Concepts Planned',
      description: 'Lorentz magnetic deflection, charged particle fields, and electric circuit loops.',
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500/10 to-indigo-600/10 border-purple-500/20',
    },
    {
      id: 'thermo',
      name: 'Thermo Class',
      subtitle: 'Heat & Thermodynamics',
      conceptsCount: '4 Concepts Planned',
      description: 'Ideal gas expansion work, heat exchange engines, kinetic particle motion, and entropy.',
      icon: <Flame className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/10 to-red-600/10 border-amber-500/20',
    },
    {
      id: 'wave',
      name: 'Wave Class',
      subtitle: 'Sound & Optics',
      conceptsCount: '4 Concepts Planned',
      description: 'Snell\'s law refraction, Doppler shift frequency, wave interference, and harmonics.',
      icon: <Radio className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/10 to-teal-600/10 border-emerald-500/20',
    },
    {
      id: 'orbit',
      name: 'Orbit Class',
      subtitle: 'Gravity & Astrophysics',
      conceptsCount: '3 Concepts Planned',
      description: 'Escape velocities, planetary gravity wells, Keplerian orbits, and Lagrange points.',
      icon: <Globe2 className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500/10 to-sky-600/10 border-blue-500/20',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Page Title Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-xs font-mono font-bold">
            <Zap className="w-4 h-4" />
            <span>5 PHYSICS CLASSES • 6 GAMES ACTIVE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Select Physics Class
          </h1>
          <p className={`text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Master Kinetic mechanics first to build foundational intuition and unlock future physics realms.
          </p>
        </div>

        {/* 1. KINETIC CLASS (UNLOCKED & ACTIVE - HOUSES ALL 6 PLAYABLE GAMES) */}
        <div className={`p-8 rounded-3xl border-2 shadow-2xl space-y-8 relative overflow-hidden transition-all ${
          isLight
            ? 'bg-gradient-to-br from-cyan-500/10 via-white to-slate-50 border-cyan-500/50 shadow-cyan-500/10'
            : 'bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 border-cyan-500/50 shadow-cyan-500/20'
        }`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Zap className="w-64 h-64 text-cyan-400" />
          </div>

          {/* Class Header */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b pb-6 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-500 shadow-lg shadow-cyan-500/20">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-500 font-bold uppercase tracking-wider">CLASS 1 OF 5</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                    UNLOCKED • 6 GAMES ACTIVE
                  </span>
                </div>
                <h2 className="text-3xl font-black">Kinetic Class</h2>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Mechanics, Kinematics, Torque Balance, 2D Vectors & Predict-and-Reveal Collisions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/match/trick-shot"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START KINETIC MATCH</span>
              </Link>
            </div>
          </div>

          {/* Kinetic Curriculum & Games List */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-cyan-500 uppercase tracking-wider">
                Kinetic Concepts & Playable Games (8 Concepts Total)
              </h3>
              <span className="text-xs font-mono text-slate-400">6 Playable Now</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kineticConcepts.map((concept) => (
                <div
                  key={concept.num}
                  className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono transition-all ${
                    concept.playable
                      ? isLight
                        ? 'bg-white border-cyan-500/40 shadow-md shadow-cyan-500/5'
                        : 'bg-slate-950/80 border-cyan-500/40 shadow-md shadow-cyan-500/10'
                      : isLight
                      ? 'bg-slate-100/60 border-slate-200 text-slate-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        concept.playable
                          ? 'bg-cyan-500 text-slate-950'
                          : isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {concept.num}
                    </span>
                    <div>
                      <div className={`font-bold ${concept.playable ? (isLight ? 'text-slate-900' : 'text-slate-100') : (isLight ? 'text-slate-500' : 'text-slate-500')}`}>
                        {concept.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{concept.type}</div>
                    </div>
                  </div>

                  <div>
                    {concept.playable && concept.route ? (
                      <Link
                        href={concept.route}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
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

        {/* 2-5. RECOVERED FUTURE CLASSES GRID (VOLT, THERMO, WAVE, ORBIT) */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              <span>Other Physics Classes (Classes 2 - 5)</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Post-MVP Expansion</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {futureClasses.map((cls) => (
              <div
                key={cls.id}
                className={`p-6 rounded-3xl border space-y-5 transition-all opacity-85 hover:opacity-100 ${
                  isLight ? 'bg-white border-slate-200 shadow-md' : `bg-gradient-to-br ${cls.color} bg-slate-900/60 border-slate-800 shadow-xl`
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
                  <p className="text-xs font-mono text-slate-400">{cls.subtitle}</p>
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {cls.description}
                </p>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
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
