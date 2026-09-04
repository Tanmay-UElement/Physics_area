'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { ElasticRoundData, evaluateElasticVelocitySubmission } from '@/lib/physics/elasticCollision';
import { RoundResult } from '@/lib/physics/types';

interface ElasticCanvasProps {
  round: ElasticRoundData;
  userVelocity: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const ElasticCanvas: React.FC<ElasticCanvasProps> = ({
  round,
  userVelocity,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const sphereARef = useRef<PIXI.Container | null>(null);
  const sphereBRef = useRef<PIXI.Container | null>(null);

  const isLight = theme === 'light';

  const TRACK_Y = 250;
  const START_A_X = 150;
  const IMPACT_X = 400;
  const END_B_X = 650;

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

      // Grid & Track
      const gfx = new PIXI.Graphics();
      drawGridAndTrack(gfx, width, height, isLight);
      app.stage.addChild(gfx);

      // Sphere A
      const containerA = new PIXI.Container();
      containerA.x = START_A_X;
      containerA.y = TRACK_Y;

      const gfxA = new PIXI.Graphics();
      gfxA.circle(0, 0, 22).fill({ color: 0x06b6d4 });
      gfxA.circle(0, 0, 22).stroke({ width: 3, color: 0x67e8f9 });

      const txtA = new PIXI.Text({
        text: `A (${round.mass}kg)`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      txtA.anchor.set(0.5, -1.8);

      containerA.addChild(gfxA);
      containerA.addChild(txtA);
      app.stage.addChild(containerA);
      sphereARef.current = containerA;

      // Sphere B
      const containerB = new PIXI.Container();
      containerB.x = IMPACT_X;
      containerB.y = TRACK_Y;

      const gfxB = new PIXI.Graphics();
      gfxB.circle(0, 0, 22).fill({ color: 0x10b981 });
      gfxB.circle(0, 0, 22).stroke({ width: 3, color: 0x6ee7b7 });

      const txtB = new PIXI.Text({
        text: `B (${round.mass}kg)`,
        style: { fontSize: 10, fill: 0xffffff, fontWeight: 'bold' },
      });
      txtB.anchor.set(0.5, -1.8);

      containerB.addChild(gfxB);
      containerB.addChild(txtB);
      app.stage.addChild(containerB);
      sphereBRef.current = containerB;
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

  const drawGridAndTrack = (gfx: PIXI.Graphics, width: number, height: number, lightMode: boolean) => {
    gfx.clear();
    const gridColor = lightMode ? 0xe2e8f0 : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.6 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();

    // Track Base
    gfx.moveTo(80, TRACK_Y + 22).lineTo(720, TRACK_Y + 22).stroke({ width: 4, color: 0x06b6d4 });
  };

  // Simulation Trigger
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateElasticVelocitySubmission(round.correctVelocityB, userVelocity);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity,
        correctVelocity: round.correctVelocityB,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userVelocity,
        targetX: round.correctVelocityB,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (sphereARef.current && sphereBRef.current) {
        sphereARef.current.x = START_A_X;
        sphereBRef.current.x = IMPACT_X;

        // Phase 1: Sphere A moves to impact point
        gsap.to(sphereARef.current, {
          x: IMPACT_X - 44,
          duration: 0.8,
          ease: 'none',
          onComplete: () => {
            // Phase 2: Sphere B moves at speed determined by user's typed velocity vs target
            const animDuration = Math.max(0.4, Math.min(3.0, (round.correctVelocityB / (userVelocity || 1)) * 0.8));

            gsap.to(sphereBRef.current, {
              x: END_B_X,
              duration: animDuration,
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
          <div>Mass: <span className="font-mono font-bold text-cyan-500">m₁ = m₂ = {round.mass} kg</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Initial Velocity A: <span className="font-mono font-bold text-emerald-500">{round.initialVelocityA} m/s</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Typed Velocity B: <span className="font-mono font-bold text-cyan-400">{userVelocity} m/s</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
          EQUAL MASS ELASTIC
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          💡 Calculate post-collision velocity v_B' = ((2m_A)/(m_A+m_B)) v_A and test collision!
        </div>
      </div>
    </div>
  );
};
