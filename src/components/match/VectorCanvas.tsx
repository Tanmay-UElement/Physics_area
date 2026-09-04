'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VectorRoundData, Vector2D, evaluateVectorSubmission } from '@/lib/physics/vectorTug';
import { RoundResult } from '@/lib/physics/types';

interface VectorCanvasProps {
  round: VectorRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onVectorChange: (userVec: Vector2D) => void;
  onSimulationComplete: (result: RoundResult) => void;
}

export const VectorCanvas: React.FC<VectorCanvasProps> = ({
  round,
  isSimulating,
  theme,
  onVectorChange,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const userArrowRef = useRef<PIXI.Graphics | null>(null);
  const userArrowTipRef = useRef<PIXI.Graphics | null>(null);
  const netArrowRef = useRef<PIXI.Graphics | null>(null);
  const podRef = useRef<PIXI.Container | null>(null);

  const [userVector, setUserVector] = useState<Vector2D>({ x: 20, y: 20 });
  const isDraggingRef = useRef<boolean>(false);

  const isLight = theme === 'light';

  // Origin Center Point
  const ORIGIN_X = 400;
  const ORIGIN_Y = 250;
  // Vector Scale: 1 N = 2.5 pixels
  const V2P = 2.5;

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

      // 1. Grid Background
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawGrid(gridGfx, width, height, isLight);

      // 2. Goal Zone Target Ring
      const goalContainer = new PIXI.Container();
      const goalX = ORIGIN_X + round.targetGoal.x * V2P;
      const goalY = ORIGIN_Y - round.targetGoal.y * V2P; // inverted Y for screen coords
      goalContainer.x = goalX;
      goalContainer.y = goalY;

      const goalGfx = new PIXI.Graphics();
      goalGfx.circle(0, 0, 24).fill({ color: 0xf59e0b, alpha: 0.2 });
      goalGfx.circle(0, 0, 24).stroke({ width: 2, color: 0xf59e0b });
      goalGfx.circle(0, 0, 8).fill({ color: 0xf59e0b });

      const goalText = new PIXI.Text({
        text: 'GOAL RING',
        style: { fontSize: 10, fill: 0xf59e0b, fontWeight: 'bold' },
      });
      goalText.anchor.set(0.5, -1.8);

      goalContainer.addChild(goalGfx);
      goalContainer.addChild(goalText);
      app.stage.addChild(goalContainer);

      // 3. Static Force 1 Vector (Cyan)
      drawVectorArrow(app.stage, round.f1, 0x06b6d4, 'F1');

      // 4. Static Force 2 Vector (Purple)
      drawVectorArrow(app.stage, round.f2, 0xa855f7, 'F2');

      // 5. Net Force Preview Vector (Dashed Amber)
      const netGfx = new PIXI.Graphics();
      app.stage.addChild(netGfx);
      netArrowRef.current = netGfx;

      // 6. User Force Vector (Emerald Green - Draggable Arrowhead)
      const userGfx = new PIXI.Graphics();
      app.stage.addChild(userGfx);
      userArrowRef.current = userGfx;

      const userTip = new PIXI.Graphics();
      userTip.circle(0, 0, 12).fill({ color: 0x10b981 });
      userTip.circle(0, 0, 12).stroke({ width: 2, color: 0x6ee7b7 });
      userTip.eventMode = 'static';
      userTip.cursor = 'grab';
      app.stage.addChild(userTip);
      userArrowTipRef.current = userTip;

      // 7. Central Object Avatar Pod
      const podContainer = new PIXI.Container();
      podContainer.x = ORIGIN_X;
      podContainer.y = ORIGIN_Y;

      const podGfx = new PIXI.Graphics();
      podGfx.circle(0, 0, 16).fill({ color: 0x38bdf8 });
      podGfx.circle(0, 0, 16).stroke({ width: 3, color: 0xffffff });

      podContainer.addChild(podGfx);
      app.stage.addChild(podContainer);
      podRef.current = podContainer;

      // Pointer drag handler for User Vector Tip
      let isDragging = false;
      userTip.on('pointerdown', () => {
        isDragging = true;
        isDraggingRef.current = true;
        userTip.cursor = 'grabbing';
      });

      app.stage.eventMode = 'static';
      app.stage.on('pointermove', (e) => {
        if (!isDragging) return;
        const dx = (e.global.x - ORIGIN_X) / V2P;
        const dy = -(e.global.y - ORIGIN_Y) / V2P; // Inverted Y for Cartesian math

        const boundedX = Math.max(-100, Math.min(100, dx));
        const boundedY = Math.max(-100, Math.min(100, dy));
        const newVec = { x: Number(boundedX.toFixed(1)), y: Number(boundedY.toFixed(1)) };

        setUserVector(newVec);
        onVectorChange(newVec);

        updateUserVectorDrawing(userGfx, userTip, netGfx, round.f1, round.f2, newVec);
      });

      const stopDrag = () => {
        if (isDragging) {
          isDragging = false;
          isDraggingRef.current = false;
          userTip.cursor = 'grab';
        }
      };

      app.stage.on('pointerup', stopDrag);
      app.stage.on('pointerupoutside', stopDrag);

      // Initial Vector Drawing
      updateUserVectorDrawing(userGfx, userTip, netGfx, round.f1, round.f2, userVector);
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

  // Update vectors rendering
  const updateUserVectorDrawing = (
    userGfx: PIXI.Graphics,
    userTip: PIXI.Graphics,
    netGfx: PIXI.Graphics,
    f1: Vector2D,
    f2: Vector2D,
    userVec: Vector2D
  ) => {
    userGfx.clear();
    const tipX = ORIGIN_X + userVec.x * V2P;
    const tipY = ORIGIN_Y - userVec.y * V2P;

    userGfx.moveTo(ORIGIN_X, ORIGIN_Y).lineTo(tipX, tipY).stroke({ width: 4, color: 0x10b981 });
    userTip.x = tipX;
    userTip.y = tipY;

    // Draw Net Force Preview Vector (F_net = F1 + F2 + F_user)
    netGfx.clear();
    const netX = f1.x + f2.x + userVec.x;
    const netY = f1.y + f2.y + userVec.y;
    const netScreenX = ORIGIN_X + netX * V2P;
    const netScreenY = ORIGIN_Y - netY * V2P;

    netGfx.moveTo(ORIGIN_X, ORIGIN_Y).lineTo(netScreenX, netScreenY).stroke({ width: 2, color: 0xf59e0b, alpha: 0.8 });
  };

  // Helper to draw fixed force arrow
  const drawVectorArrow = (stage: PIXI.Container, vec: Vector2D, color: number, label: string) => {
    const endX = ORIGIN_X + vec.x * V2P;
    const endY = ORIGIN_Y - vec.y * V2P;

    const gfx = new PIXI.Graphics();
    gfx.moveTo(ORIGIN_X, ORIGIN_Y).lineTo(endX, endY).stroke({ width: 3, color });
    gfx.circle(endX, endY, 6).fill({ color });

    const txt = new PIXI.Text({
      text: `${label} (${vec.x}, ${vec.y})N`,
      style: { fontSize: 10, fill: color, fontWeight: 'bold' },
    });
    txt.x = endX + 8;
    txt.y = endY - 8;

    stage.addChild(gfx);
    stage.addChild(txt);
  };

  // Draw Grid background
  const drawGrid = (gfx: PIXI.Graphics, width: number, height: number, lightMode: boolean) => {
    gfx.clear();
    const gridColor = lightMode ? 0xe2e8f0 : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.6 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();

    // Cartesian Axes (X and Y)
    gfx.moveTo(0, ORIGIN_Y).lineTo(width, ORIGIN_Y).stroke({ width: 2, color: lightMode ? 0x94a3b8 : 0x475569 });
    gfx.moveTo(ORIGIN_X, 0).lineTo(ORIGIN_X, height).stroke({ width: 2, color: lightMode ? 0x94a3b8 : 0x475569 });
  };

  // Simulation Trigger: Accelerate object pod along net force vector into target ring
  useEffect(() => {
    if (isSimulating) {
      const resultData = evaluateVectorSubmission(round.idealUserForce, userVector);
      const userMag = Math.sqrt(userVector.x * userVector.x + userVector.y * userVector.y);
      const idealMag = Math.sqrt(round.idealUserForce.x * round.idealUserForce.x + round.idealUserForce.y * round.idealUserForce.y);

      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: Number(userMag.toFixed(1)),
        correctVelocity: Number(idealMag.toFixed(1)),
        errorPercentage: resultData.errorPercentage,
        tier: resultData.tier,
        xpEarned: resultData.xpEarned,
        actualLandingX: userMag,
        targetX: idealMag,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (podRef.current) {
        const netX = round.f1.x + round.f2.x + userVector.x;
        const netY = round.f1.y + round.f2.y + userVector.y;
        const targetScreenX = ORIGIN_X + netX * V2P;
        const targetScreenY = ORIGIN_Y - netY * V2P;

        gsap.to(podRef.current, {
          x: targetScreenX,
          y: targetScreenY,
          duration: 1.2,
          ease: 'power2.out',
          onComplete: () => {
            if (resultData.tier === 'hit') {
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
      {/* Telemetry HUD Top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>User Force: <span className="font-mono font-bold text-emerald-500">({userVector.x}, {userVector.y}) N</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Magnitude: <span className="font-mono font-bold text-cyan-500">{Math.sqrt(userVector.x**2 + userVector.y**2).toFixed(1)} N</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
          2D VECTOR MECHANICS
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          💡 Drag green arrowhead to adjust 2D force vector magnitude & direction angle!
        </div>
      </div>
    </div>
  );
};
