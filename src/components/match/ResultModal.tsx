'use client';

import React, { useEffect, useRef } from 'react';
import { RoundResult } from '@/lib/physics/types';
import { Trophy, ArrowRight, RotateCcw, Target, Zap } from 'lucide-react';

interface ResultModalProps {
  result: RoundResult | null;
  isLastRound: boolean;
  onNext: () => void;
  onPlayAgain?: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  isLastRound,
  onNext,
  onPlayAgain,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Confetti burst on bullseye
  useEffect(() => {
    if (!result || result.tier !== 'hit') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number; y: number;
      vx: number; vy: number;
      color: string;
      size: number;
      life: number;
      decay: number;
    }> = [];

    const colors = ['#22d3ee', '#a855f7', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.3;

    for (let i = 0; i < 80; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 3 + Math.random() * 5;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
      });
    }

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.life -= p.decay;
        if (p.life <= 0) continue;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (particles.some((p) => p.life > 0)) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [result]);

  if (!result) return null;

  const isHit = result.tier === 'hit';
  const isClose = result.tier === 'close';

  const tierTheme = isHit
    ? {
        bg: 'bg-[#020f0a]',
        border: 'border-emerald-500/50',
        ring: 'ring-emerald-500/20',
        headerGlow: 'from-emerald-950/80 to-emerald-900/40',
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-500/40',
        icon: <Target className="w-12 h-12 text-emerald-400" />,
        iconBg: 'bg-emerald-500/20 border-emerald-500/40 shadow-emerald-500/30',
        title: '🎯 BULLSEYE! DIRECT HIT!',
        desc: `Unstoppable precision! You calculated the exact physics result within ${result.errorPercentage}% tolerance.`,
        errorColor: 'text-emerald-400',
        shadow: 'shadow-emerald-500/20',
      }
    : isClose
    ? {
        bg: 'bg-[#0e0a00]',
        border: 'border-amber-500/50',
        ring: 'ring-amber-500/20',
        headerGlow: 'from-amber-950/80 to-amber-900/30',
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-amber-300',
        badgeBorder: 'border-amber-500/40',
        icon: <Zap className="w-12 h-12 text-amber-400" />,
        iconBg: 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/30',
        title: '🤏 SO CLOSE! NEAR MISS!',
        desc: `You were off by just ${result.errorPercentage}%. Adjust your parameters next time!`,
        errorColor: 'text-amber-400',
        shadow: 'shadow-amber-500/20',
      }
    : {
        bg: 'bg-slate-950',
        border: 'border-slate-700/60',
        ring: 'ring-slate-700/20',
        headerGlow: 'from-slate-900/80 to-slate-900/40',
        badgeBg: 'bg-slate-800',
        badgeText: 'text-cyan-300',
        badgeBorder: 'border-slate-700',
        icon: <RotateCcw className="w-12 h-12 text-cyan-400" />,
        iconBg: 'bg-cyan-500/10 border-cyan-500/30 shadow-cyan-500/20',
        title: '🚀 NICE TRY! PHYSICS CAUGHT YOU',
        desc: `Your calculation was off by ${result.errorPercentage}%. Inspect the HUD vectors and try again!`,
        errorColor: 'text-cyan-400',
        shadow: 'shadow-cyan-500/10',
      };

  const handlePlayAgainClick = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md ${tierTheme.bg} border-2 ${tierTheme.border} ring-4 ${tierTheme.ring} rounded-3xl overflow-hidden shadow-2xl ${tierTheme.shadow}`}>

        {/* Confetti canvas (bullseye only) */}
        {isHit && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          />
        )}

        {/* Gradient header glow */}
        <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${tierTheme.headerGlow} pointer-events-none z-0`} />

        <div className="relative z-10 p-6 space-y-6 text-slate-100">
          {/* Tier Header */}
          <div className="text-center space-y-4">
            {/* XP Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-mono font-black border ${tierTheme.badgeBg} ${tierTheme.badgeText} ${tierTheme.badgeBorder}`}>
                <Trophy className="w-4 h-4" />
                <span>+{result.xpEarned} XP AWARDED</span>
              </div>
            </div>

            {/* Icon */}
            <div className={`w-20 h-20 rounded-3xl border mx-auto flex items-center justify-center shadow-xl ${tierTheme.iconBg}`}>
              {tierTheme.icon}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
              {tierTheme.title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed px-2">
              {tierTheme.desc}
            </p>
          </div>

          {/* Telemetry Breakdown */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs font-mono">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">TELEMETRY READOUT</div>
            {[
              { label: 'Your Calculated Input', value: result.userVelocity, valueClass: 'text-white font-bold text-sm' },
              { label: 'Exact Ideal Physics Result', value: result.correctVelocity, valueClass: 'text-emerald-400 font-bold text-sm' },
              { label: 'Precision Error', value: `${result.errorPercentage}%`, valueClass: `${tierTheme.errorColor} font-bold text-sm` },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-2 ${i < 2 ? 'border-b border-slate-800/80' : ''}`}>
                <span className="text-slate-400">{row.label}:</span>
                <span className={row.valueClass}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePlayAgainClick}
              className="py-3.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 hover:border-slate-600"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="py-3.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 hover:shadow-cyan-500/50"
            >
              <span>{isLastRound ? 'CONTINUE' : 'NEXT ROUND'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
