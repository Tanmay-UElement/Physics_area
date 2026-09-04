'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltKirchhoffRoundData, evaluateVoltKirchhoffSubmission } from '@/lib/physics/voltKirchhoff';
import { RoundResult } from '@/lib/physics/types';

interface VoltKirchhoffCanvasProps {
  round: VoltKirchhoffRoundData;
  userCurrent: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltKirchhoffCanvas: React.FC<VoltKirchhoffCanvasProps> = ({
  round,
  userCurrent,
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

      // 1. Tech Grid
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawGrid(gridGfx, width, height);

      // 2. Heavy Industrial Copper Busbar Junction Node
      drawJunctionBusbar(app.stage, isLight, round, userCurrent);
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

  const drawJunctionBusbar = (stage: PIXI.Container, lightMode: boolean, data: VoltKirchhoffRoundData, userI: number) => {
    const CX = 400;
    const CY = 250;

    const container = new PIXI.Container();
    const gfx = new PIXI.Graphics();

    // Heavy Copper Busbar Arms
    gfx.setStrokeStyle({ width: 16, color: 0xb45309, alpha: 0.6 }); // Copper base shadow
    gfx.moveTo(160, 100).lineTo(CX, CY).stroke(); // Branch 1 IN
    gfx.moveTo(160, 400).lineTo(CX, CY).stroke(); // Branch 2 IN
    gfx.moveTo(640, 100).lineTo(CX, CY).stroke(); // Branch 3 OUT
    gfx.moveTo(640, 400).lineTo(CX, CY).stroke(); // Branch 4 OUT

    // Active Neon Flow Traces inside busbars
    gfx.setStrokeStyle({ width: 6, color: 0x38bdf8 });
    gfx.moveTo(160, 100).lineTo(CX, CY).stroke();
    gfx.moveTo(160, 400).lineTo(CX, CY).stroke();

    gfx.setStrokeStyle({ width: 6, color: 0x10b981 });
    gfx.moveTo(640, 100).lineTo(CX, CY).stroke();

    gfx.setStrokeStyle({ width: 6, color: 0xeab308 });
    gfx.moveTo(640, 400).lineTo(CX, CY).stroke();

    // Central Junction Hub Node Block
    gfx.circle(CX, CY, 38).fill({ color: 0x0f172a });
    gfx.circle(CX, CY, 38).stroke({ width: 4, color: 0xc084fc });
    gfx.circle(CX, CY, 24).fill({ color: 0xa855f7 });

    // Arm Labels & Digital Current Meters
    drawAmmeterLabel(container, 160, 100, `I₁ = ${data.branch1In}A (IN)`, 0x38bdf8);
    drawAmmeterLabel(container, 160, 400, `I₂ = ${data.branch2In}A (IN)`, 0x38bdf8);
    drawAmmeterLabel(container, 640, 100, `I₃ = ${data.branch3Out}A (OUT)`, 0x10b981);
    drawAmmeterLabel(container, 640, 400, `I₄ = ${userI}A (OUT)`, 0xeab308);

    container.addChild(gfx);
    stage.addChild(container);
  };

  const drawAmmeterLabel = (container: PIXI.Container, x: number, y: number, text: string, colorHex: number) => {
    const box = new PIXI.Graphics();
    box.rect(x - 65, y - 18, 130, 36).fill({ color: 0x0f172a });
    box.rect(x - 65, y - 18, 130, 36).stroke({ width: 2, color: colorHex });

    const txt = new PIXI.Text({
      text,
      style: { fontSize: 10, fill: colorHex, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.x = x;
    txt.y = y;

    container.addChild(box);
    container.addChild(txt);
  };

  // Simulation Trigger
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltKirchhoffSubmission(round.correctMissingCurrent, userCurrent);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userCurrent,
        correctVelocity: round.correctMissingCurrent,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userCurrent,
        targetX: round.correctMissingCurrent,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      gsap.to({}, {
        duration: 1.0,
        onComplete: () => {
          if (evalRes.tier === 'hit') {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
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
          <div>Inputs: <span className="font-mono font-bold text-sky-400">I₁={round.branch1In}A</span>, <span className="font-mono font-bold text-sky-400">I₂={round.branch2In}A</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Known Output: <span className="font-mono font-bold text-emerald-400">I₃={round.branch3Out}A</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Entered Output I₄: <span className="font-mono font-bold text-yellow-400">{userCurrent} A</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
          KIRCHHOFF BUSBAR ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Industrial Busbar: Balance current streams ΣI_in = ΣI_out across junction node!
        </div>
      </div>
    </div>
  );
};
