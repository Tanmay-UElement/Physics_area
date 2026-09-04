'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { LeverRoundData } from '@/lib/physics/leverBalance';
import { RoundResult } from '@/lib/physics/types';
import { evaluateLeverSubmission } from '@/lib/physics/leverBalance';

interface LeverCanvasProps {
  round: LeverRoundData;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onDistanceChange: (d: number) => void;
  onSimulationComplete: (result: RoundResult) => void;
}

export const LeverCanvas: React.FC<LeverCanvasProps> = ({
  round,
  isSimulating,
  theme,
  onDistanceChange,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const beamContainerRef = useRef<PIXI.Container | null>(null);
  const rightWeightRef = useRef<PIXI.Container | null>(null);

  const [currentRightDist, setCurrentRightDist] = useState<number>(2.0); // start at 2m
  const isDraggingRef = useRef<boolean>(false);

  const isLight = theme === 'light';

  // Scale constants: 1 meter = 45 pixels
  const M2P = 45;
  const FULCRUM_X = 400; // Center pivot X
  const FULCRUM_Y = 320; // Center pivot Y
  const BEAM_LENGTH = 10 * M2P; // 10m total beam (5m left, 5m right)

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

      // 1. Background Grid & Fulcrum Base
      const bgGraphics = new PIXI.Graphics();
      app.stage.addChild(bgGraphics);
      drawBackground(bgGraphics, width, height, isLight);

      // 2. Beam Container (Pivoted at central fulcrum)
      const beamContainer = new PIXI.Container();
      beamContainer.x = FULCRUM_X;
      beamContainer.y = FULCRUM_Y;
      app.stage.addChild(beamContainer);
      beamContainerRef.current = beamContainer;

      // Draw Seesaw Beam
      const beamGfx = new PIXI.Graphics();
      beamGfx.rect(-BEAM_LENGTH / 2, -10, BEAM_LENGTH, 20).fill({ color: isLight ? 0x334155 : 0x1e293b });
      beamGfx.rect(-BEAM_LENGTH / 2, -10, BEAM_LENGTH, 20).stroke({ width: 2, color: 0x06b6d4 });

      // Meter markers along the beam
      for (let m = -5; m <= 5; m += 1) {
        if (m === 0) continue;
        const markX = m * M2P;
        beamGfx.moveTo(markX, -10).lineTo(markX, 10).stroke({ width: 1.5, color: 0x38bdf8 });
      }
      beamContainer.addChild(beamGfx);

      // 3. Static Left Weight Box
      const leftWeightContainer = new PIXI.Container();
      const leftX = -round.leftDistance * M2P;
      leftWeightContainer.x = leftX;
      leftWeightContainer.y = -35;

      const leftGfx = new PIXI.Graphics();
      leftGfx.rect(-24, -24, 48, 48).fill({ color: 0xef4444 });
      leftGfx.rect(-24, -24, 48, 48).stroke({ width: 2, color: 0xfca5a5 });

      const leftText = new PIXI.Text({
        text: `${round.leftMass}kg`,
        style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' },
      });
      leftText.anchor.set(0.5);

      leftWeightContainer.addChild(leftGfx);
      leftWeightContainer.addChild(leftText);
      beamContainer.addChild(leftWeightContainer);

      // 4. Draggable Right Weight Box
      const rightWeightContainer = new PIXI.Container();
      rightWeightContainer.x = currentRightDist * M2P;
      rightWeightContainer.y = -35;
      rightWeightContainer.eventMode = 'static';
      rightWeightContainer.cursor = 'grab';

      const rightGfx = new PIXI.Graphics();
      rightGfx.rect(-24, -24, 48, 48).fill({ color: 0x10b981 });
      rightGfx.rect(-24, -24, 48, 48).stroke({ width: 2, color: 0x6ee7b7 });

      const rightText = new PIXI.Text({
        text: `${round.rightMass}kg`,
        style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' },
      });
      rightText.anchor.set(0.5);

      rightWeightContainer.addChild(rightGfx);
      rightWeightContainer.addChild(rightText);
      beamContainer.addChild(rightWeightContainer);
      rightWeightRef.current = rightWeightContainer;

      // Pointer drag interaction setup
      let startPointerX = 0;
      let startDist = 2.0;

      rightWeightContainer.on('pointerdown', (e) => {
        isDraggingRef.current = true;
        rightWeightContainer.cursor = 'grabbing';
        startPointerX = e.global.x;
        startDist = rightWeightContainer.x / M2P;
      });

      app.stage.eventMode = 'static';
      app.stage.on('pointermove', (e) => {
        if (!isDraggingRef.current) return;
        const dx = e.global.x - startPointerX;
        let newDist = startDist + dx / M2P;
        newDist = Math.max(0.5, Math.min(4.8, newDist)); // bounded within beam arm
        
        rightWeightContainer.x = newDist * M2P;
        setCurrentRightDist(Number(newDist.toFixed(2)));
        onDistanceChange(Number(newDist.toFixed(2)));

        // Real-time Seesaw tilt calculation
        updateBeamTilt(beamContainer, round.leftMass, round.leftDistance, round.rightMass, newDist);
      });

      const stopDrag = () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          if (rightWeightContainer) rightWeightContainer.cursor = 'grab';
        }
      };

      app.stage.on('pointerup', stopDrag);
      app.stage.on('pointerupoutside', stopDrag);

      // Initial tilt set
      updateBeamTilt(beamContainer, round.leftMass, round.leftDistance, round.rightMass, currentRightDist);
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

  // Update tilt angle live based on torque difference
  const updateBeamTilt = (
    beam: PIXI.Container,
    lMass: number,
    lDist: number,
    rMass: number,
    rDist: number
  ) => {
    const leftTorque = lMass * lDist;
    const rightTorque = rMass * rDist;
    const netTorque = leftTorque - rightTorque; // positive = tilts left (ccw)

    // Bounded tilt angle in radians (max tilt +- 0.35 rad ~ 20 deg)
    const maxTilt = 0.35;
    const maxTorqueRef = Math.max(leftTorque, rightTorque) || 100;
    const targetAngle = -(netTorque / maxTorqueRef) * maxTilt;

    gsap.to(beam, {
      rotation: targetAngle,
      duration: 0.15,
      ease: 'power1.out',
    });
  };

  // Background Fulcrum drawing
  const drawBackground = (gfx: PIXI.Graphics, width: number, height: number, lightMode: boolean) => {
    gfx.clear();
    const gridColor = lightMode ? 0xe2e8f0 : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.6 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();

    // Fulcrum Stand Triangle
    gfx.poly([
      { x: FULCRUM_X - 30, y: FULCRUM_Y + 50 },
      { x: FULCRUM_X + 30, y: FULCRUM_Y + 50 },
      { x: FULCRUM_X, y: FULCRUM_Y },
    ]).fill({ color: lightMode ? 0x64748b : 0x334155 });
    gfx.poly([
      { x: FULCRUM_X - 30, y: FULCRUM_Y + 50 },
      { x: FULCRUM_X + 30, y: FULCRUM_Y + 50 },
      { x: FULCRUM_X, y: FULCRUM_Y },
    ]).stroke({ width: 3, color: 0x06b6d4 });

    // Base Floor Line
    gfx.moveTo(100, FULCRUM_Y + 50).lineTo(width - 100, FULCRUM_Y + 50).stroke({ width: 4, color: lightMode ? 0x94a3b8 : 0x475569 });
  };

  // Trigger Check Balance simulation evaluation
  useEffect(() => {
    if (isSimulating) {
      const resultData = evaluateLeverSubmission(round.targetRightDistance, currentRightDist);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: currentRightDist,
        correctVelocity: round.targetRightDistance,
        errorPercentage: resultData.errorPercentage,
        tier: resultData.tier,
        xpEarned: resultData.xpEarned,
        actualLandingX: currentRightDist,
        targetX: round.targetRightDistance,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      if (resultData.tier === 'hit') {
        if (beamContainerRef.current) {
          gsap.to(beamContainerRef.current, { rotation: 0, duration: 0.4, ease: 'back.out(1.7)' });
        }
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      setTimeout(() => {
        onSimulationComplete(roundResult);
      }, 500);
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
          <div>Left Torque: <span className="font-mono font-bold text-red-500">{round.leftMass * round.leftDistance} N·m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Right Distance: <span className="font-mono font-bold text-emerald-500">{currentRightDist} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Right Torque: <span className="font-mono font-bold text-cyan-500">{(round.rightMass * currentRightDist).toFixed(1)} N·m</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-500 text-xs font-mono font-bold">
          LEVER BALANCE ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          💡 Drag green weight right or left to feel live torque balance!
        </div>
      </div>
    </div>
  );
};
