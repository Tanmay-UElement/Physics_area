'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { MomentumRoundData, evaluateMomentumSubmission } from '@/lib/physics/momentumConservation';
import { RoundResult } from '@/lib/physics/types';

interface MomentumCanvasProps {
  round: MomentumRoundData;
  userVelocity: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const MomentumCanvas: React.FC<MomentumCanvasProps> = ({
  round,
  userVelocity,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const cartARef = useRef<PIXI.Container | null>(null);
  const cartBRef = useRef<PIXI.Container | null>(null);

  const isLight = theme === 'light';

  const TRACK_Y = 250;
  const START_A_X = 140;
  const IMPACT_X = 380;
  const END_COUPLED_X = 660;

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
        backgroundColor: isLight ? 0xf8fafc : 0x0b0f19,
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

      // Grid & Air Track
      const gfx = new PIXI.Graphics();
      drawTrack(gfx, width, height, isLight);
      app.stage.addChild(gfx);

      // Heavy Cart A
      const containerA = new PIXI.Container();
      containerA.x = START_A_X;
      containerA.y = TRACK_Y;

      const gfxA = new PIXI.Graphics();
      gfxA.rect(-30, -20, 60, 40).fill({ color: 0x3b82f6 });
      gfxA.rect(-30, -20, 60, 40).stroke({ width: 3, color: 0x93c5fd });

      const txtA = new PIXI.Text({
        text: `CART A (${round.mass1}kg)`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      txtA.anchor.set(0.5, -1.8);

      containerA.addChild(gfxA);
      containerA.addChild(txtA);
      app.stage.addChild(containerA);
      cartARef.current = containerA;

      // Light Cart B
      const containerB = new PIXI.Container();
      containerB.x = IMPACT_X;
      containerB.y = TRACK_Y;

      const gfxB = new PIXI.Graphics();
      gfxB.rect(-20, -15, 40, 30).fill({ color: 0xa855f7 });
      gfxB.rect(-20, -15, 40, 30).stroke({ width: 2, color: 0xe9d5ff });

      const txtB = new PIXI.Text({
        text: `CART B (${round.mass2}kg)`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      txtB.anchor.set(0.5, -1.8);

      containerB.addChild(gfxB);
      containerB.addChild(txtB);
      app.stage.addChild(containerB);
      cartBRef.current = containerB;
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

  const drawTrack = (gfx: PIXI.Graphics, width: number, height: number, lightMode: boolean) => {
    gfx.clear();
    const gridColor = lightMode ? 0xe2e8f0 : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.6 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();

    // Track
    gfx.moveTo(80, TRACK_Y + 20).lineTo(720, TRACK_Y + 20).stroke({ width: 4, color: 0x3b82f6 });
  };

  // Simulation Trigger: Inelastic Collision coupling & joint movement
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateMomentumSubmission(round.correctFinalVelocity, userVelocity);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity,
        correctVelocity: round.correctFinalVelocity,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userVelocity,
        targetX: round.correctFinalVelocity,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (cartARef.current && cartBRef.current) {
        cartARef.current.x = START_A_X;
        cartBRef.current.x = IMPACT_X;

        // Phase 1: Cart A moves to impact point (x = IMPACT_X - 50)
        gsap.to(cartARef.current, {
          x: IMPACT_X - 50,
          duration: 0.8,
          ease: 'none',
          onComplete: () => {
            // Phase 2: Inelastic coupling — both carts move together as a single combined mass (m1 + m2)
            gsap.to([cartARef.current, cartBRef.current], {
              x: `+=${END_COUPLED_X - IMPACT_X}`,
              duration: 1.2,
              ease: 'power1.out',
              onComplete: () => {
                if (evalRes.tier === 'hit') {
                  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                }
                onSimulationComplete(roundResult);
              },
            });
          },
        });
      }
    }
  }, [isSimulating]);

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
    }`}>
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>Total Initial Momentum: <span className="font-mono font-bold text-blue-500">P = {round.totalMomentum} kg·m/s</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Combined Mass: <span className="font-mono font-bold text-purple-400">m₁ + m₂ = {round.mass1 + round.mass2} kg</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
          MOMENTUM CONSERVATION
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          💡 Calculate or adjust final combined velocity v_f after inelastic coupling!
        </div>
      </div>
    </div>
  );
};
