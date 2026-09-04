'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { FreeFallRoundData, evaluateFreeFallTimeSubmission } from '@/lib/physics/freeFall';
import { RoundResult } from '@/lib/physics/types';

interface FreeFallCanvasProps {
  round: FreeFallRoundData;
  userTime: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const FreeFallCanvas: React.FC<FreeFallCanvasProps> = ({
  round,
  userTime,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const heavySphereRef = useRef<PIXI.Container | null>(null);
  const lightSphereRef = useRef<PIXI.Container | null>(null);

  const isLight = theme === 'light';

  const TOP_Y = 80;
  const BOTTOM_Y = 400;
  const TOWER_A_X = 260; // Heavy tower
  const TOWER_B_X = 540; // Light tower

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

      // Grid Background
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawGrid(gridGfx, width, height, isLight);

      // Towers & Drop Platforms
      drawTowers(app.stage, isLight);

      // Heavy Sphere (Tower A)
      const heavyContainer = new PIXI.Container();
      heavyContainer.x = TOWER_A_X;
      heavyContainer.y = TOP_Y;

      const heavyGfx = new PIXI.Graphics();
      heavyGfx.circle(0, 0, 24).fill({ color: 0xef4444 });
      heavyGfx.circle(0, 0, 24).stroke({ width: 3, color: 0xfca5a5 });

      const heavyTxt = new PIXI.Text({
        text: `HEAVY (${round.heavyMass}kg)`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      heavyTxt.anchor.set(0.5, -1.8);

      heavyContainer.addChild(heavyGfx);
      heavyContainer.addChild(heavyTxt);
      app.stage.addChild(heavyContainer);
      heavySphereRef.current = heavyContainer;

      // Light Sphere (Tower B)
      const lightContainer = new PIXI.Container();
      lightContainer.x = TOWER_B_X;
      lightContainer.y = TOP_Y;

      const lightGfx = new PIXI.Graphics();
      lightGfx.circle(0, 0, 14).fill({ color: 0x38bdf8 });
      lightGfx.circle(0, 0, 14).stroke({ width: 2, color: 0xbae6fd });

      const lightTxt = new PIXI.Text({
        text: `LIGHT (${round.lightMass}kg)`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      lightTxt.anchor.set(0.5, -1.8);

      lightContainer.addChild(lightGfx);
      lightContainer.addChild(lightTxt);
      app.stage.addChild(lightContainer);
      lightSphereRef.current = lightContainer;
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

  const drawGrid = (gfx: PIXI.Graphics, width: number, height: number, lightMode: boolean) => {
    gfx.clear();
    const gridColor = lightMode ? 0xe2e8f0 : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.6 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  const drawTowers = (stage: PIXI.Container, lightMode: boolean) => {
    const gfx = new PIXI.Graphics();

    // Tower A Structure
    gfx.rect(TOWER_A_X - 35, TOP_Y, 70, BOTTOM_Y - TOP_Y).fill({ color: lightMode ? 0xe2e8f0 : 0x1e293b, alpha: 0.5 });
    gfx.rect(TOWER_A_X - 35, TOP_Y, 70, BOTTOM_Y - TOP_Y).stroke({ width: 2, color: 0xef4444 });

    // Tower B Structure
    gfx.rect(TOWER_B_X - 35, TOP_Y, 70, BOTTOM_Y - TOP_Y).fill({ color: lightMode ? 0xe2e8f0 : 0x1e293b, alpha: 0.5 });
    gfx.rect(TOWER_B_X - 35, TOP_Y, 70, BOTTOM_Y - TOP_Y).stroke({ width: 2, color: 0x38bdf8 });

    // Ground Sensor
    gfx.moveTo(100, BOTTOM_Y + 24).lineTo(700, BOTTOM_Y + 24).stroke({ width: 4, color: 0x10b981 });

    stage.addChild(gfx);
  };

  // Simulation Trigger
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateFreeFallTimeSubmission(round.correctFallTime, userTime);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userTime,
        correctVelocity: round.correctFallTime,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userTime,
        targetX: round.correctFallTime,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (heavySphereRef.current && lightSphereRef.current) {
        heavySphereRef.current.y = TOP_Y;
        lightSphereRef.current.y = TOP_Y;

        // Fall animation duration driven by user's calculated fall time vs exact fall time
        const animDuration = Math.max(0.5, Math.min(6.0, round.correctFallTime));

        gsap.to([heavySphereRef.current, lightSphereRef.current], {
          y: BOTTOM_Y,
          duration: animDuration,
          ease: 'power2.in',
          onComplete: () => {
            if (evalRes.tier === 'hit') {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
            onSimulationComplete(roundResult);
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
          <div>Height: <span className="font-mono font-bold text-cyan-500">{round.dropHeight} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Gravity: <span className="font-mono font-bold text-amber-500">9.8 m/s²</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Calculated Time: <span className="font-mono font-bold text-emerald-500">{userTime} s</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-mono font-bold">
          FREE FALL ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          💡 Calculate fall time t = √((2h)/g) and test the drop simulation!
        </div>
      </div>
    </div>
  );
};
