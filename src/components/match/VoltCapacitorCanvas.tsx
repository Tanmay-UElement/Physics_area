'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltCapacitorRoundData, evaluateVoltCapacitorSubmission } from '@/lib/physics/voltCapacitorRace';
import { RoundResult } from '@/lib/physics/types';

interface VoltCapacitorCanvasProps {
  round: VoltCapacitorRoundData;
  userTime: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltCapacitorCanvas: React.FC<VoltCapacitorCanvasProps> = ({
  round,
  userTime,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    let isMounted = true;

    const initCanvas = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 500;

      const app = new PIXI.Application();
      await app.init({
        width,
        height,
        backgroundColor: isLight ? 0x0f172a : 0x030712,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (!isMounted) {
        app.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      pixiAppRef.current = app;

      // 1. Digital Oscilloscope Screen (Left)
      drawOscilloscopeScreen(app.stage, isLight, round);

      // 2. Parallel Plate Capacitor Hardware (Right)
      drawParallelPlateCapacitor(app.stage, isLight, round);
    };

    initCanvas();

    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true });
        pixiAppRef.current = null;
      }
    };
  }, [round.id, isLight]);

  const drawOscilloscopeScreen = (stage: PIXI.Container, lightMode: boolean, data: VoltCapacitorRoundData) => {
    const container = new PIXI.Container();

    // Scope Frame
    const gfx = new PIXI.Graphics();
    gfx.rect(60, 80, 420, 320).fill({ color: 0x022c22 }); // Phosphor green retro scope CRT
    gfx.rect(60, 80, 420, 320).stroke({ width: 4, color: 0x10b981 });

    // CRT Grid Lines
    gfx.setStrokeStyle({ width: 1, color: 0x059669, alpha: 0.4 });
    for (let x = 60; x <= 480; x += 35) gfx.moveTo(x, 80).lineTo(x, 400);
    for (let y = 80; y <= 400; y += 32) gfx.moveTo(60, y).lineTo(480, y);
    gfx.stroke();

    // Target Voltage Cutoff Line (Emerald green dotted)
    const targetY = 400 - ((data.targetVoltage / data.sourceVoltage) * 280);
    gfx.moveTo(60, targetY).lineTo(480, targetY).stroke({ width: 2, color: 0xfacc15 });

    // Exponential Charge Trace Wave (Neon Green)
    gfx.setStrokeStyle({ width: 3.5, color: 0x34d399 });
    gfx.moveTo(60, 400);
    for (let px = 0; px <= 420; px += 10) {
      const tNorm = (px / 420) * 5.0; // 0 to 5s
      const vNorm = 1 - Math.exp(-tNorm / (data.timeConstant || 1.0));
      const py = 400 - (vNorm * 280);
      gfx.lineTo(60 + px, py);
    }
    gfx.stroke();

    container.addChild(gfx);
    stage.addChild(container);
  };

  const drawParallelPlateCapacitor = (stage: PIXI.Container, lightMode: boolean, data: VoltCapacitorRoundData) => {
    const container = new PIXI.Container();
    container.x = 600;
    container.y = 240;

    const gfx = new PIXI.Graphics();
    // Top Aluminum Plate (+ Pole)
    gfx.rect(-80, -90, 160, 16).fill({ color: 0x38bdf8 });
    gfx.rect(-80, -90, 160, 16).stroke({ width: 2, color: 0xbae6fd });

    // Bottom Aluminum Plate (- Pole)
    gfx.rect(-80, 90, 160, 16).fill({ color: 0xef4444 });
    gfx.rect(-80, 90, 160, 16).stroke({ width: 2, color: 0xfca5a5 });

    // Dielectric Layer / E-Field Lines
    gfx.setStrokeStyle({ width: 2, color: 0xec4899, alpha: 0.5 });
    for (let x = -60; x <= 60; x += 30) {
      gfx.moveTo(x, -74).lineTo(x, 90);
    }
    gfx.stroke();

    const txt = new PIXI.Text({
      text: `C = ${data.capacitance}μF`,
      style: { fontSize: 11, fill: 0xec4899, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5, 3.2);

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);
  };

  // Simulation Trigger
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltCapacitorSubmission(round.correctTime, userTime);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userTime,
        correctVelocity: round.correctTime,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userTime,
        targetX: round.correctTime,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      const animDuration = Math.max(0.5, Math.min(4.0, round.correctTime));
      gsap.to({}, {
        duration: animDuration,
        onComplete: () => {
          if (evalRes.tier === 'hit') {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          }
          onSimulationComplete(roundResult);
        },
      });
    }
  }, [isSimulating]);

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Telemetry Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>RC Circuit: <span className="font-mono font-bold text-pink-400">R={round.resistance}kΩ</span>, <span className="font-mono font-bold text-purple-400">C={round.capacitance}μF</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Target Voltage: <span className="font-mono font-bold text-amber-400">{round.targetVoltage} V</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Charge Time t: <span className="font-mono font-bold text-emerald-400">{userTime} s</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-pink-500/30 text-pink-400 text-xs font-mono font-bold">
          RC OSCILLOSCOPE ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Oscilloscope: Calculate charge time t = -RC · ln(1 - V/V₀) to hit target voltage!
        </div>
      </div>
    </div>
  );
};
