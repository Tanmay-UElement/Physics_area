'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import confetti from 'canvas-confetti';
import { FreeFallState, FreeFallRoundData } from '@/lib/physics/freeFall';

interface FreeFallCanvasProps {
  round: FreeFallRoundData;
  freeFallState: FreeFallState;
  theme: 'dark' | 'light';
  onDropComplete: () => void;
  onToggleVectors?: () => void;
  onToggleForceInspector?: () => void;
}

export const FreeFallCanvas: React.FC<FreeFallCanvasProps> = ({
  round,
  freeFallState,
  theme,
  onDropComplete,
  onToggleVectors,
  onToggleForceInspector,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // State Ref to read latest values inside PIXI 60 FPS Ticker
  const stateRef = useRef<FreeFallState>(freeFallState);
  useEffect(() => {
    stateRef.current = freeFallState;
  }, [freeFallState]);

  // Simulation physics state refs
  const simTimeRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  const objAGfxRef = useRef<PIXI.Container | null>(null);
  const objBGfxRef = useRef<PIXI.Container | null>(null);
  const vectorsGfxRef = useRef<PIXI.Graphics | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    let isMounted = true;

    const initCanvas = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 480;

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

      const topY = 70;
      const bottomY = height - 60;
      const towerAX = width * 0.35;
      const towerBX = width * 0.65;
      const dropHeightPx = bottomY - topY;

      // Drop Tower Chamber Backdrop & Measurement Grid
      const bgGfx = new PIXI.Graphics();
      app.stage.addChild(bgGfx);

      const towerGfx = new PIXI.Graphics();
      app.stage.addChild(towerGfx);

      const vectorsGfx = new PIXI.Graphics();
      app.stage.addChild(vectorsGfx);
      vectorsGfxRef.current = vectorsGfx;

      // Object A (Heavy Steel Sphere)
      const objA = createObjectContainer('OBJECT A', 0xef4444, 22);
      objA.x = towerAX;
      objA.y = topY;
      app.stage.addChild(objA);
      objAGfxRef.current = objA;

      // Object B (Lighter Sphere / Feather)
      const objB = createObjectContainer('OBJECT B', 0x38bdf8, 14);
      objB.x = towerBX;
      objB.y = topY;
      app.stage.addChild(objB);
      objBGfxRef.current = objB;

      // 60 FPS Physics Simulation Ticker Loop
      app.ticker.add((ticker) => {
        const state = stateRef.current;
        const dt = ticker.deltaTime / 60; // seconds

        drawDropTowerChamber(towerGfx, bgGfx, width, height, topY, bottomY, towerAX, towerBX, state);

        if (objAGfxRef.current && objBGfxRef.current) {
          const oA = objAGfxRef.current;
          const oB = objBGfxRef.current;

          if (!state.isDropReleased) {
            // Reset to top height when paused
            oA.y = topY;
            oB.y = topY;
            simTimeRef.current = 0;
            isFinishedRef.current = false;
          } else if (!isFinishedRef.current) {
            simTimeRef.current += dt;
            const t = simTimeRef.current;

            // Kinematic displacement: y(t) = y0 - v0*t + 0.5*g*t^2 (in pixels)
            // Scale: dropHeightPx represents dropHeightM
            const pxPerMeter = dropHeightPx / Math.max(5, state.dropHeightM);
            const displacementM = state.initialVelocityMps * t - 0.5 * state.planetGravityMps2 * Math.pow(t, 2);

            const newY = topY - displacementM * pxPerMeter;

            if (newY >= bottomY) {
              oA.y = bottomY;
              oB.y = bottomY;
              isFinishedRef.current = true;

              if (state.targetMet) {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              }
              onDropComplete();
            } else {
              oA.y = newY;
              oB.y = newY;
            }
          }

          drawVectorsAndForces(vectorsGfx, oA, oB, state);
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

  const drawDropTowerChamber = (
    towerGfx: PIXI.Graphics,
    bgGfx: PIXI.Graphics,
    width: number,
    height: number,
    topY: number,
    bottomY: number,
    towerAX: number,
    towerBX: number,
    state: FreeFallState
  ) => {
    bgGfx.clear();
    towerGfx.clear();

    bgGfx.rect(0, 0, width, height).fill({ color: 0x030712 });

    // Glass Drop Chamber Shafts
    const shaftWidth = 90;
    towerGfx.rect(towerAX - shaftWidth / 2, topY - 10, shaftWidth, bottomY - topY + 20).fill({ color: 0x0f172a, alpha: 0.6 });
    towerGfx.rect(towerAX - shaftWidth / 2, topY - 10, shaftWidth, bottomY - topY + 20).stroke({ width: 2, color: 0x38bdf8 });

    towerGfx.rect(towerBX - shaftWidth / 2, topY - 10, shaftWidth, bottomY - topY + 20).fill({ color: 0x0f172a, alpha: 0.6 });
    towerGfx.rect(towerBX - shaftWidth / 2, topY - 10, shaftWidth, bottomY - topY + 20).stroke({ width: 2, color: 0x38bdf8 });

    // Height Metric Grid Ticks
    const numTicks = 8;
    towerGfx.setStrokeStyle({ width: 1, color: 0x334155 });
    for (let i = 0; i <= numTicks; i++) {
      const y = topY + (i / numTicks) * (bottomY - topY);
      towerGfx.moveTo(towerAX - shaftWidth / 2 - 10, y).lineTo(towerBX + shaftWidth / 2 + 10, y).stroke();
    }

    // Impact Pad
    towerGfx.rect(40, bottomY, width - 80, 10).fill({ color: 0x10b981 });
  };

  const drawVectorsAndForces = (
    gfx: PIXI.Graphics,
    oA: PIXI.Container,
    oB: PIXI.Container,
    state: FreeFallState
  ) => {
    gfx.clear();
    if (!state.showVectors) return;

    // Gravitational Acceleration Vector Arrow (g = 9.81 m/s² ↓) for both objects
    const gLen = Math.min(60, state.planetGravityMps2 * 4);
    gfx.setStrokeStyle({ width: 3, color: 0xf59e0b });
    gfx.moveTo(oA.x + 35, oA.y).lineTo(oA.x + 35, oA.y + gLen).stroke();
    gfx.moveTo(oB.x + 35, oB.y).lineTo(oB.x + 35, oB.y + gLen).stroke();
  };

  const createObjectContainer = (title: string, colorHex: number, radius: number) => {
    const container = new PIXI.Container();

    const gfx = new PIXI.Graphics();
    gfx.circle(0, 0, radius).fill({ color: 0x020617 });
    gfx.circle(0, 0, radius).stroke({ width: 2.5, color: colorHex });

    const txt = new PIXI.Text({
      text: title,
      style: { fontSize: 9, fill: colorHex, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -radius - 12;

    container.addChild(gfx);
    container.addChild(txt);
    return container;
  };

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Top Header Diagnostics Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>Height: <span className="font-mono font-bold text-sky-400">{freeFallState.dropHeightM} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Gravity: <span className="font-mono font-bold text-amber-400">{freeFallState.planetGravityMps2} m/s² ({freeFallState.planetName})</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Calculated Time: <span className="font-mono font-bold text-emerald-400">{freeFallState.calculatedFallTimeSec} s</span></div>
        </div>

        {/* Overlay Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleVectors}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              freeFallState.showVectors
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            VECTORS (g ↓)
          </button>
          <button
            type="button"
            onClick={onToggleForceInspector}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              freeFallState.showForceInspector
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            FORCE INSPECTOR (F=mg)
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Status Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          freeFallState.isComplete
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : freeFallState.predictionLocked
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          {freeFallState.statusText}
        </div>
      </div>
    </div>
  );
};
