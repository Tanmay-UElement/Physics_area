'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltCoulombRoundData, evaluateVoltCoulombSubmission } from '@/lib/physics/voltCoulombTug';
import { RoundResult } from '@/lib/physics/types';

interface VoltCoulombCanvasProps {
  round: VoltCoulombRoundData;
  userDistance: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltCoulombCanvas: React.FC<VoltCoulombCanvasProps> = ({
  round,
  userDistance,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const chargeARef = useRef<PIXI.Container | null>(null);
  const chargeBRef = useRef<PIXI.Container | null>(null);
  const lightningGfxRef = useRef<PIXI.Graphics | null>(null);
  const sparkContainerRef = useRef<PIXI.Container | null>(null);

  const isLight = theme === 'light';

  const Y_CENTER = 250;
  const FIXED_A_X = 200;

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

      // 1. Tech Field Grid
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawGrid(gridGfx, width, height);

      // 2. Electrostatic Equipotential Field Lines
      const fieldLinesGfx = new PIXI.Graphics();
      app.stage.addChild(fieldLinesGfx);
      drawElectrostaticFieldLines(fieldLinesGfx, width, height, FIXED_A_X, Math.min(680, FIXED_A_X + userDistance * 25), Y_CENTER);

      // 3. Lightning Arc Crackle Graphic Layer
      const lightningGfx = new PIXI.Graphics();
      app.stage.addChild(lightningGfx);
      lightningGfxRef.current = lightningGfx;

      // 4. Spark Particles Container
      const sparkContainer = new PIXI.Container();
      app.stage.addChild(sparkContainer);
      sparkContainerRef.current = sparkContainer;

      // 5. Positive Charge Avatar (+q1)
      const containerA = new PIXI.Container();
      containerA.x = FIXED_A_X;
      containerA.y = Y_CENTER;

      const gfxA = new PIXI.Graphics();
      gfxA.circle(0, 0, 30).fill({ color: 0x06b6d4 });
      gfxA.circle(0, 0, 30).stroke({ width: 4, color: 0x67e8f9 });
      gfxA.circle(0, 0, 42).stroke({ width: 2, color: 0x06b6d4, alpha: 0.3 }); // Outer field halo

      const txtA = new PIXI.Text({
        text: `+q₁ (${round.charge1}μC)`,
        style: { fontSize: 11, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      txtA.anchor.set(0.5, -2.0);

      containerA.addChild(gfxA);
      containerA.addChild(txtA);
      app.stage.addChild(containerA);
      chargeARef.current = containerA;

      // 6. Negative Charge Avatar (-q2)
      const targetX = Math.min(680, FIXED_A_X + userDistance * 25);
      const containerB = new PIXI.Container();
      containerB.x = targetX;
      containerB.y = Y_CENTER;

      const gfxB = new PIXI.Graphics();
      gfxB.circle(0, 0, 30).fill({ color: 0xa855f7 });
      gfxB.circle(0, 0, 30).stroke({ width: 4, color: 0xe9d5ff });
      gfxB.circle(0, 0, 42).stroke({ width: 2, color: 0xa855f7, alpha: 0.3 }); // Outer field halo

      const txtB = new PIXI.Text({
        text: `-q₂ (${round.charge2}μC)`,
        style: { fontSize: 11, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      txtB.anchor.set(0.5, -2.0);

      containerB.addChild(gfxB);
      containerB.addChild(txtB);
      app.stage.addChild(containerB);
      chargeBRef.current = containerB;

      // 7. Continuous Lightning Crackle Ticker Animation
      let frameCount = 0;
      app.ticker.add(() => {
        frameCount++;
        if (lightningGfxRef.current && chargeBRef.current) {
          drawLightningArc(
            lightningGfxRef.current,
            FIXED_A_X + 30,
            Y_CENTER,
            chargeBRef.current.x - 30,
            Y_CENTER,
            frameCount
          );
        }
      });
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

  const drawGrid = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.4 });
    for (let x = 0; x < width; x += 30) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 30) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  const drawElectrostaticFieldLines = (gfx: PIXI.Graphics, width: number, height: number, x1: number, x2: number, y: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1.5, color: 0x38bdf8, alpha: 0.25 });

    // Curved dipole field lines
    for (let offset = -80; offset <= 80; offset += 40) {
      if (offset === 0) continue;
      gfx.moveTo(x1, y);
      gfx.quadraticCurveTo((x1 + x2) / 2, y + offset * 2, x2, y);
    }
    gfx.stroke();
  };

  // Realistic Electric Lightning Arc Crackle Generator
  const drawLightningArc = (gfx: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number, frame: number) => {
    gfx.clear();
    if (x2 <= x1 + 10) return;

    // Glowing outer blue bolt
    gfx.setStrokeStyle({ width: 4, color: 0x38bdf8, alpha: 0.8 });
    gfx.moveTo(x1, y1);

    const segments = 12;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    for (let i = 1; i < segments; i++) {
      // Randomized high-frequency jitter perturbation
      const jitterY = (Math.random() - 0.5) * 22;
      const jitterX = (Math.random() - 0.5) * 8;
      gfx.lineTo(x1 + dx * i + jitterX, y1 + dy * i + jitterY);
    }
    gfx.lineTo(x2, y2);
    gfx.stroke();

    // Inner hot-white plasma core bolt
    gfx.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.95 });
    gfx.moveTo(x1, y1);
    for (let i = 1; i < segments; i++) {
      const jitterY = (Math.random() - 0.5) * 14;
      gfx.lineTo(x1 + dx * i, y1 + dy * i + jitterY);
    }
    gfx.lineTo(x2, y2);
    gfx.stroke();
  };

  // Simulation Trigger: Electrostatic tug animation & plasma spark burst
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltCoulombSubmission(round.correctDistance, userDistance);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userDistance,
        correctVelocity: round.correctDistance,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userDistance,
        targetX: round.correctDistance,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (chargeBRef.current) {
        const destX = Math.min(680, FIXED_A_X + userDistance * 25);
        gsap.to(chargeBRef.current, {
          x: destX,
          duration: 1.2,
          ease: 'elastic.out(1, 0.5)',
          onComplete: () => {
            if (evalRes.tier === 'hit') {
              confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
            }
            onSimulationComplete(roundResult);
          },
        });
      }
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
          <div>Charges: <span className="font-mono font-bold text-cyan-400">q₁={round.charge1}μC</span>, <span className="font-mono font-bold text-purple-400">q₂={round.charge2}μC</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Target Force: <span className="font-mono font-bold text-emerald-400">{round.targetForce} N</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Distance r: <span className="font-mono font-bold text-amber-400">{userDistance} m</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
          LIGHTNING ARC COULOMB ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Electrostatic Arc: Calculate separation r = √((k·q₁·q₂)/F) to balance plasma attraction!
        </div>
      </div>
    </div>
  );
};
