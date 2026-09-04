'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import confetti from 'canvas-confetti';
import { MomentumState, MomentumRoundData } from '@/lib/physics/momentumConservation';

interface MomentumCanvasProps {
  round: MomentumRoundData;
  momentumState: MomentumState;
  theme: 'dark' | 'light';
  onCollisionComplete: () => void;
  onToggleVectors?: () => void;
  onToggleSystemBoundary?: () => void;
}

export const MomentumCanvas: React.FC<MomentumCanvasProps> = ({
  round,
  momentumState,
  theme,
  onCollisionComplete,
  onToggleVectors,
  onToggleSystemBoundary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // State Ref to read latest values inside PIXI 60 FPS Ticker
  const stateRef = useRef<MomentumState>(momentumState);
  useEffect(() => {
    stateRef.current = momentumState;
  }, [momentumState]);

  // Simulation physics state refs
  const hasCollidedRef = useRef<boolean>(false);
  const isFinishedRef = useRef<boolean>(false);
  const postCollisionTimerRef = useRef<number>(0);

  const cartAGfxRef = useRef<PIXI.Container | null>(null);
  const cartBGfxRef = useRef<PIXI.Container | null>(null);

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

      const centerY = height / 2 + 10;
      const startAX = 140;
      const startBX = width - 180;

      // Backdrop & Rail
      const bgGfx = new PIXI.Graphics();
      app.stage.addChild(bgGfx);

      const trackGfx = new PIXI.Graphics();
      app.stage.addChild(trackGfx);

      const boundaryGfx = new PIXI.Graphics();
      app.stage.addChild(boundaryGfx);

      const vectorsGfx = new PIXI.Graphics();
      app.stage.addChild(vectorsGfx);

      // Cart A (Heavy)
      const cartA = createCartContainer('CART A', 0x38bdf8, true);
      cartA.x = startAX;
      cartA.y = centerY;
      app.stage.addChild(cartA);
      cartAGfxRef.current = cartA;

      // Cart B (Lighter)
      const cartB = createCartContainer('CART B', 0xc084fc, false);
      cartB.x = startBX;
      cartB.y = centerY;
      app.stage.addChild(cartB);
      cartBGfxRef.current = cartB;

      // Continuous 60 FPS Ticker for Physics Motion & Collision
      app.ticker.add((ticker) => {
        const state = stateRef.current;
        const dt = ticker.deltaTime / 60; // Delta time in seconds

        drawLaboratoryTrack(trackGfx, bgGfx, width, height, centerY, state);
        drawIsolatedSystemBoundary(boundaryGfx, width, height, state);

        if (cartAGfxRef.current && cartBGfxRef.current) {
          const cA = cartAGfxRef.current;
          const cB = cartBGfxRef.current;

          if (!state.isCollisionReleased) {
            // Reset to starting positions when paused/stopped
            cA.x = 140;
            cB.x = width - 180;
            hasCollidedRef.current = false;
            isFinishedRef.current = false;
            postCollisionTimerRef.current = 0;
          } else if (!isFinishedRef.current) {
            if (!hasCollidedRef.current) {
              // Pre-collision physical motion: x(t) = x0 + v * dt
              const speedScale = 85;
              cA.x += state.velA * speedScale * dt;
              cB.x += state.velB * speedScale * dt;

              // Check impact condition (distance between cart centers <= sum of radii)
              const minDist = 56;
              if (cB.x - cA.x <= minDist) {
                hasCollidedRef.current = true;

                // Snap carts to contact boundary
                const midX = (cA.x + cB.x) / 2;
                cA.x = midX - minDist / 2;
                cB.x = midX + minDist / 2;

                if (state.targetMet) {
                  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                }
              }
            } else {
              // Post-collision physical motion: Carts couple together at actualVf
              const speedScale = 85;
              cA.x += state.actualVf * speedScale * dt;
              cB.x = cA.x + 56;

              postCollisionTimerRef.current += dt;

              // Complete after 1.4 seconds of combined motion or reaching track edges
              if (postCollisionTimerRef.current >= 1.4 || cA.x > width - 100 || cA.x < 80) {
                isFinishedRef.current = true;
                onCollisionComplete();
              }
            }
          }
        }

        drawMomentumVectorArrows(vectorsGfx, cartAGfxRef.current, cartBGfxRef.current, state);
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

  const drawLaboratoryTrack = (
    trackGfx: PIXI.Graphics,
    bgGfx: PIXI.Graphics,
    width: number,
    height: number,
    centerY: number,
    state: MomentumState
  ) => {
    bgGfx.clear();
    trackGfx.clear();

    bgGfx.rect(0, 0, width, height).fill({ color: state.scenarioMode === 'SPACECRAFT_DOCKING' ? 0x020617 : 0x030712 });

    if (state.scenarioMode === 'SPACECRAFT_DOCKING') {
      bgGfx.circle(120, 80, 1.5).fill({ color: 0xffffff });
      bgGfx.circle(450, 60, 2).fill({ color: 0x38bdf8 });
      bgGfx.circle(680, 140, 1.5).fill({ color: 0xffffff });
      return;
    }

    const railY = centerY + 30;
    trackGfx.rect(40, railY, width - 80, 12).fill({ color: 0x1e293b });
    trackGfx.rect(40, railY, width - 80, 12).stroke({ width: 2, color: 0x38bdf8 });

    trackGfx.setStrokeStyle({ width: 1, color: 0x475569 });
    for (let x = 60; x <= width - 60; x += 30) {
      trackGfx.moveTo(x, railY + 12).lineTo(x, railY + 22).stroke();
    }

    trackGfx.rect(210, centerY - 50, 12, 80).fill({ color: 0x0f172a });
    trackGfx.rect(210, centerY - 50, 12, 80).stroke({ width: 1.5, color: 0x34d399 });
    trackGfx.rect(width - 222, centerY - 50, 12, 80).fill({ color: 0x0f172a });
    trackGfx.rect(width - 222, centerY - 50, 12, 80).stroke({ width: 1.5, color: 0x34d399 });
  };

  const drawIsolatedSystemBoundary = (
    gfx: PIXI.Graphics,
    width: number,
    height: number,
    state: MomentumState
  ) => {
    gfx.clear();
    if (!state.showSystemBoundary) return;

    gfx.setStrokeStyle({ width: 1.5, color: 0x38bdf8, alpha: 0.4 });
    gfx.rect(60, height / 2 - 80, width - 120, 140).stroke();

    const txt = new PIXI.Text({
      text: 'ISOLATED SYSTEM (F_ext ≈ 0)',
      style: { fontSize: 9, fill: 0x38bdf8, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    txt.x = 70;
    txt.y = height / 2 - 76;
    gfx.addChild(txt);
  };

  const drawMomentumVectorArrows = (
    gfx: PIXI.Graphics,
    cartA: PIXI.Container | null,
    cartB: PIXI.Container | null,
    state: MomentumState
  ) => {
    gfx.clear();
    if (!state.showMomentumVectors || !cartA || !cartB) return;

    const lenA = Math.min(100, Math.max(20, Math.abs(state.pA) * 6));
    const dirA = Math.sign(state.velA || 1);
    gfx.setStrokeStyle({ width: 3, color: 0x38bdf8 });
    gfx.moveTo(cartA.x, cartA.y - 45).lineTo(cartA.x + dirA * lenA, cartA.y - 45).stroke();

    const lenB = Math.min(100, Math.max(20, Math.abs(state.pB) * 6));
    const dirB = Math.sign(state.velB || -1);
    gfx.setStrokeStyle({ width: 3, color: 0xc084fc });
    gfx.moveTo(cartB.x, cartB.y - 45).lineTo(cartB.x + dirB * lenB, cartB.y - 45).stroke();
  };

  const createCartContainer = (title: string, colorHex: number, isHeavy: boolean) => {
    const container = new PIXI.Container();

    const gfx = new PIXI.Graphics();
    const widthPx = isHeavy ? 68 : 44;
    const heightPx = isHeavy ? 44 : 32;

    gfx.rect(-widthPx / 2, -heightPx / 2, widthPx, heightPx).fill({ color: 0x020617 });
    gfx.rect(-widthPx / 2, -heightPx / 2, widthPx, heightPx).stroke({ width: 2.5, color: colorHex });

    gfx.circle(-widthPx / 3, heightPx / 2, 6).fill({ color: 0x475569 });
    gfx.circle(widthPx / 3, heightPx / 2, 6).fill({ color: 0x475569 });

    const txt = new PIXI.Text({
      text: title,
      style: { fontSize: 9, fill: colorHex, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -heightPx / 2 - 14;

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
          <div>Cart A: <span className="font-mono font-bold text-sky-400">{momentumState.massA}kg @ {momentumState.velA}m/s</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Cart B: <span className="font-mono font-bold text-purple-400">{momentumState.massB}kg @ {momentumState.velB}m/s</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>p_total: <span className="font-mono font-bold text-amber-400">{momentumState.pTotal} kg·m/s</span></div>
        </div>

        {/* Overlay Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleVectors}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              momentumState.showMomentumVectors
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            MOMENTUM VECTORS
          </button>
          <button
            type="button"
            onClick={onToggleSystemBoundary}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              momentumState.showSystemBoundary
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            ISOLATED SYSTEM
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Status Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          momentumState.isComplete
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : momentumState.predictionLocked
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          {momentumState.statusText}
        </div>
      </div>
    </div>
  );
};
