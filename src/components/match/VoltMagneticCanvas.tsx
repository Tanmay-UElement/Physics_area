'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltMagneticRoundData, evaluateVoltMagneticSubmission } from '@/lib/physics/voltMagneticMaze';
import { RoundResult } from '@/lib/physics/types';

interface VoltMagneticCanvasProps {
  round: VoltMagneticRoundData;
  userRadius: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltMagneticCanvas: React.FC<VoltMagneticCanvasProps> = ({
  round,
  userRadius,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const particleRef = useRef<PIXI.Container | null>(null);
  const trailContainerRef = useRef<PIXI.Container | null>(null);

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

      // 1. Grid
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawGrid(gridGfx, width, height);

      // 2. Electromagnetic Solenoid Coils (Top & Bottom)
      drawSolenoids(app.stage, width, height);

      // 3. Magnetic Field Zone (Purple B-field with glowing vector crosses)
      drawMagneticFieldRegion(app.stage, isLight, round.magneticField);

      // 4. Target Gate Obstacle at right exit
      drawTargetGate(app.stage);

      // 5. Particle Trail Container
      const trailContainer = new PIXI.Container();
      app.stage.addChild(trailContainer);
      trailContainerRef.current = trailContainer;

      // 6. Charged Particle Avatar (+q)
      const particleContainer = new PIXI.Container();
      particleContainer.x = 120;
      particleContainer.y = 250;

      const gfxP = new PIXI.Graphics();
      gfxP.circle(0, 0, 20).fill({ color: 0xec4899 });
      gfxP.circle(0, 0, 20).stroke({ width: 3, color: 0xfbcfe8 });
      gfxP.circle(0, 0, 32).stroke({ width: 2, color: 0xec4899, alpha: 0.4 }); // Glowing halo

      const txtP = new PIXI.Text({
        text: `+q (${round.charge}C)`,
        style: { fontSize: 11, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      txtP.anchor.set(0.5, -2.0);

      particleContainer.addChild(gfxP);
      particleContainer.addChild(txtP);
      app.stage.addChild(particleContainer);
      particleRef.current = particleContainer;
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

  const drawSolenoids = (stage: PIXI.Container, width: number, height: number) => {
    const gfx = new PIXI.Graphics();
    // Top Electro-Magnet Bar
    gfx.rect(180, 20, 480, 40).fill({ color: 0x1e293b });
    gfx.rect(180, 20, 480, 40).stroke({ width: 3, color: 0xa855f7 });
    for (let x = 200; x <= 640; x += 20) {
      gfx.circle(x, 40, 6).fill({ color: 0xeab308 }); // Copper coil turns
    }

    // Bottom Electro-Magnet Bar
    gfx.rect(180, 440, 480, 40).fill({ color: 0x1e293b });
    gfx.rect(180, 440, 480, 40).stroke({ width: 3, color: 0xa855f7 });
    for (let x = 200; x <= 640; x += 20) {
      gfx.circle(x, 460, 6).fill({ color: 0xeab308 });
    }

    stage.addChild(gfx);
  };

  const drawMagneticFieldRegion = (stage: PIXI.Container, lightMode: boolean, bField: number) => {
    const container = new PIXI.Container();

    const gfx = new PIXI.Graphics();
    gfx.rect(200, 70, 440, 360).fill({ color: 0xa855f7, alpha: 0.12 });
    gfx.rect(200, 70, 440, 360).stroke({ width: 3, color: 0xc084fc });
    container.addChild(gfx);

    // Vector field cross symbols (⊗ Into Page)
    for (let x = 240; x <= 600; x += 60) {
      for (let y = 110; y <= 390; y += 60) {
        const symbolGfx = new PIXI.Graphics();
        symbolGfx.circle(x, y, 12).stroke({ width: 1.5, color: 0xa855f7, alpha: 0.6 });
        symbolGfx.moveTo(x - 6, y - 6).lineTo(x + 6, y + 6).stroke({ width: 1.5, color: 0xa855f7, alpha: 0.6 });
        symbolGfx.moveTo(x + 6, y - 6).lineTo(x - 6, y + 6).stroke({ width: 1.5, color: 0xa855f7, alpha: 0.6 });
        container.addChild(symbolGfx);
      }
    }

    stage.addChild(container);
  };

  const drawTargetGate = (stage: PIXI.Container) => {
    const gfx = new PIXI.Graphics();
    // Green Sensor Laser Gate
    gfx.rect(640, 170, 16, 160).fill({ color: 0x10b981, alpha: 0.3 });
    gfx.rect(640, 170, 16, 160).stroke({ width: 3, color: 0x34d399 });
    stage.addChild(gfx);
  };

  // Simulation Trigger: Cyclotron arc trajectory under Lorentz force F = qv x B
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltMagneticSubmission(round.correctRadius, userRadius);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userRadius,
        correctVelocity: round.correctRadius,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userRadius,
        targetX: round.correctRadius,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (particleRef.current) {
        particleRef.current.x = 120;
        particleRef.current.y = 250;

        // Animate plasma particle curved trajectory into magnetic maze
        gsap.to(particleRef.current, {
          x: 640,
          y: 250 - (userRadius * 4.5),
          duration: 1.2,
          ease: 'power1.out',
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
          <div>Particle Speed: <span className="font-mono font-bold text-pink-400">{round.particleSpeed} m/s</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Magnetic Field: <span className="font-mono font-bold text-purple-400">{round.magneticField} T</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Cyclotron Radius: <span className="font-mono font-bold text-emerald-400">{userRadius} m</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-pink-500/30 text-pink-400 text-xs font-mono font-bold">
          LORENTZ MAZE ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Magnetic Deflection: Calculate cyclotron radius r = (m·v)/(q·B) to steer particle through laser gate!
        </div>
      </div>
    </div>
  );
};
