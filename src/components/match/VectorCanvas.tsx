'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import confetti from 'canvas-confetti';
import { VectorTugState, Vector2D, cartesianToPolar } from '@/lib/physics/vectorTug';

interface VectorCanvasProps {
  vectorState: VectorTugState;
  theme: 'dark' | 'light';
  onForceChange: (id: string, newVector: Vector2D) => void;
  onSimulationComplete: () => void;
  onToggleResultant?: () => void;
  onToggleComponents?: () => void;
  onToggleHeadToTail?: () => void;
  onToggleFreeBody?: () => void;
}

export const VectorCanvas: React.FC<VectorCanvasProps> = ({
  vectorState,
  theme,
  onForceChange,
  onSimulationComplete,
  onToggleResultant,
  onToggleComponents,
  onToggleHeadToTail,
  onToggleFreeBody,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // State Ref to read latest values inside PIXI 60 FPS Ticker
  const stateRef = useRef<VectorTugState>(vectorState);
  useEffect(() => {
    stateRef.current = vectorState;
  }, [vectorState]);

  // Simulation physics state refs
  const robotPosRef = useRef<{ x: number; y: number }>({ x: 400, y: 250 });
  const robotVelRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const trajectoryTrailRef = useRef<{ x: number; y: number }[]>([]);

  const isSimulatingRef = useRef<boolean>(false);
  const isFinishedRef = useRef<boolean>(false);
  const isDraggingIdRef = useRef<string | null>(null);

  const isLight = theme === 'light';

  // Origin Center Point (Lab Arena)
  const ORIGIN_X = 400;
  const ORIGIN_Y = 250;
  // Scale: 1 Newton = 2.2 pixels
  const N2P = 2.2;

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

      // 1. Grid Background
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);

      // 2. Trajectory Trail Layer
      const trailGfx = new PIXI.Graphics();
      app.stage.addChild(trailGfx);

      // 3. Head-to-Tail / Component Projections Layer
      const auxGfx = new PIXI.Graphics();
      app.stage.addChild(auxGfx);

      // 4. Force Vectors Layer (Input Forces + Resultant + Target)
      const vectorsGfx = new PIXI.Graphics();
      app.stage.addChild(vectorsGfx);

      // 5. Target Zone Marker Container
      const targetContainer = new PIXI.Container();
      app.stage.addChild(targetContainer);

      // 6. Central Robotic Platform Container
      const robotContainer = new PIXI.Container();
      robotContainer.x = ORIGIN_X;
      robotContainer.y = ORIGIN_Y;

      const robotGfx = new PIXI.Graphics();
      robotGfx.rect(-20, -20, 40, 40).fill({ color: 0x020617 });
      robotGfx.rect(-20, -20, 40, 40).stroke({ width: 3, color: 0x38bdf8 });
      robotGfx.circle(0, 0, 8).fill({ color: 0x38bdf8 });

      const robotTxt = new PIXI.Text({
        text: 'ROBOT (10kg)',
        style: { fontSize: 9, fill: 0x38bdf8, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      robotTxt.anchor.set(0.5, -1.8);

      robotContainer.addChild(robotGfx);
      robotContainer.addChild(robotTxt);
      app.stage.addChild(robotContainer);

      // Pointer event listeners on canvas stage for dragging vector handles
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      app.stage.on('pointermove', (e) => {
        const draggingId = isDraggingIdRef.current;
        if (!draggingId) return;

        const state = stateRef.current;
        const forceObj = state.forces.find((f) => f.id === draggingId);
        if (!forceObj || !forceObj.isDraggable) return;

        // Calculate vector from current robot position to mouse pointer
        let dx = (e.global.x - robotPosRef.current.x) / N2P;
        let dy = -(e.global.y - robotPosRef.current.y) / N2P; // Inverted Y for Cartesian coordinates

        if (state.angleSnap15Deg) {
          const polar = cartesianToPolar(dx, dy);
          const snappedAngle = Math.round(polar.angleDeg / 15) * 15;
          const rad = (snappedAngle * Math.PI) / 180;
          dx = polar.magnitude * Math.cos(rad);
          dy = polar.magnitude * Math.sin(rad);
        }

        const boundedX = Number(Math.max(-120, Math.min(120, dx)).toFixed(1));
        const boundedY = Number(Math.max(-120, Math.min(120, dy)).toFixed(1));

        onForceChange(draggingId, { x: boundedX, y: boundedY });
      });

      const stopDragging = () => {
        isDraggingIdRef.current = null;
      };

      app.stage.on('pointerup', stopDragging);
      app.stage.on('pointerupoutside', stopDragging);

      // 60 FPS Physics Simulation Ticker
      app.ticker.add((ticker) => {
        const state = stateRef.current;
        const dt = ticker.deltaTime / 60; // seconds

        // Draw grid backdrop
        drawGridBackdrop(gridGfx, width, height, isLight, state);

        // Update target marker position
        drawTargetZone(targetContainer, state, ORIGIN_X, ORIGIN_Y, N2P);

        // Physics motion update when simulation is running
        if (state.isSimulating && !isFinishedRef.current) {
          if (!isSimulatingRef.current) {
            isSimulatingRef.current = true;
            robotVelRef.current = { x: state.initialVelocity.x, y: state.initialVelocity.y };
            trajectoryTrailRef.current = [{ x: robotPosRef.current.x, y: robotPosRef.current.y }];
          }

          // Acceleration a = F_net / m
          const ax = state.netFx / Math.max(1, state.objectMassKg);
          const ay = state.netFy / Math.max(1, state.objectMassKg);

          // Update velocity & position
          robotVelRef.current.x += ax * dt * 8; // speed multiplier for visual engagement
          robotVelRef.current.y += ay * dt * 8;

          robotPosRef.current.x += robotVelRef.current.x * dt * 15;
          robotPosRef.current.y -= robotVelRef.current.y * dt * 15; // Inverted screen Y

          robotContainer.x = robotPosRef.current.x;
          robotContainer.y = robotPosRef.current.y;

          // Record trajectory trail
          trajectoryTrailRef.current.push({ x: robotPosRef.current.x, y: robotPosRef.current.y });
          if (trajectoryTrailRef.current.length > 200) trajectoryTrailRef.current.shift();

          // Check target boundary or arena bounds completion
          const targetPxX = ORIGIN_X + state.targetVector.x * N2P;
          const targetPxY = ORIGIN_Y - state.targetVector.y * N2P;
          const distToTarget = Math.hypot(robotPosRef.current.x - targetPxX, robotPosRef.current.y - targetPxY);

          if (distToTarget < 30 || trajectoryTrailRef.current.length > 160) {
            isFinishedRef.current = true;
            if (state.targetMet) {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
            onSimulationComplete();
          }
        } else if (!state.isSimulating) {
          // Reset position when not simulating
          robotPosRef.current = { x: ORIGIN_X, y: ORIGIN_Y };
          robotVelRef.current = { x: 0, y: 0 };
          robotContainer.x = ORIGIN_X;
          robotContainer.y = ORIGIN_Y;
          trajectoryTrailRef.current = [];
          isSimulatingRef.current = false;
          isFinishedRef.current = false;
        }

        // Draw Trajectory Trail
        drawTrajectoryTrail(trailGfx, trajectoryTrailRef.current);

        // Draw Head-to-Tail Chain / Component Projections
        drawAuxiliaryOverlays(auxGfx, state, robotPosRef.current.x, robotPosRef.current.y, N2P);

        // Draw Force Vectors (Input Forces, Resultant, Handles)
        drawForceVectors(vectorsGfx, state, robotPosRef.current.x, robotPosRef.current.y, N2P, (id) => {
          isDraggingIdRef.current = id;
        });
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
  }, [isLight]);

  const drawGridBackdrop = (
    gfx: PIXI.Graphics,
    width: number,
    height: number,
    lightMode: boolean,
    state: VectorTugState
  ) => {
    gfx.clear();
    const bgColor = state.showFreeBodyDiagram ? 0x020617 : lightMode ? 0x0f172a : 0x030712;
    gfx.rect(0, 0, width, height).fill({ color: bgColor });

    if (state.showFreeBodyDiagram) return; // Simplified FBD background

    const gridColor = lightMode ? 0x1e293b : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.4 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();

    // Axes
    gfx.moveTo(0, ORIGIN_Y).lineTo(width, ORIGIN_Y).stroke({ width: 2, color: 0x334155 });
    gfx.moveTo(ORIGIN_X, 0).lineTo(ORIGIN_X, height).stroke({ width: 2, color: 0x334155 });
  };

  const drawTargetZone = (
    container: PIXI.Container,
    state: VectorTugState,
    originX: number,
    originY: number,
    scale: number
  ) => {
    container.removeChildren();
    if (state.scenarioMode === 'ZERO_RESULTANT' || state.scenarioMode === 'MOVING_EQUILIBRIUM') return;

    const targetPxX = originX + state.targetVector.x * scale;
    const targetPxY = originY - state.targetVector.y * scale;

    const gfx = new PIXI.Graphics();
    gfx.circle(targetPxX, targetPxY, 28).fill({ color: 0x06b6d4, alpha: 0.2 });
    gfx.circle(targetPxX, targetPxY, 28).stroke({ width: 2, color: 0x06b6d4 });
    gfx.circle(targetPxX, targetPxY, 8).fill({ color: 0x06b6d4 });

    const txt = new PIXI.Text({
      text: `TARGET VECTOR (${state.targetMagnitudeN}N @ ${state.targetAngleDeg}°)`,
      style: { fontSize: 9, fill: 0x06b6d4, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.x = targetPxX;
    txt.y = targetPxY - 38;
    txt.anchor.set(0.5);

    container.addChild(gfx);
    container.addChild(txt);
  };

  const drawTrajectoryTrail = (gfx: PIXI.Graphics, trail: { x: number; y: number }[]) => {
    gfx.clear();
    if (trail.length < 2) return;

    gfx.setStrokeStyle({ width: 3, color: 0x38bdf8, alpha: 0.6 });
    gfx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      gfx.lineTo(trail[i].x, trail[i].y);
    }
    gfx.stroke();
  };

  const drawAuxiliaryOverlays = (
    gfx: PIXI.Graphics,
    state: VectorTugState,
    robotX: number,
    robotY: number,
    scale: number
  ) => {
    gfx.clear();

    // 1. Head-to-Tail Vector Addition Chain Mode
    if (state.showHeadToTail && state.forces.length > 0) {
      let currentX = robotX;
      let currentY = robotY;

      state.forces.forEach((f) => {
        const nextX = currentX + f.vector.x * scale;
        const nextY = currentY - f.vector.y * scale;

        gfx.setStrokeStyle({ width: 2, color: f.colorHex, alpha: 0.7 });
        gfx.moveTo(currentX, currentY).lineTo(nextX, nextY).stroke();
        gfx.circle(nextX, nextY, 4).fill({ color: f.colorHex });

        currentX = nextX;
        currentY = nextY;
      });
    }

    // 2. Component Decomposition Mode (Right Triangles)
    if (state.showComponents) {
      state.forces.forEach((f) => {
        const tipX = robotX + f.vector.x * scale;
        const tipY = robotY - f.vector.y * scale;

        // Fx horizontal component
        gfx.setStrokeStyle({ width: 1.5, color: 0x38bdf8, alpha: 0.8 });
        gfx.moveTo(robotX, robotY).lineTo(tipX, robotY).stroke();

        // Fy vertical component
        gfx.setStrokeStyle({ width: 1.5, color: 0xa855f7, alpha: 0.8 });
        gfx.moveTo(tipX, robotY).lineTo(tipX, tipY).stroke();
      });
    }
  };

  const drawForceVectors = (
    gfx: PIXI.Graphics,
    state: VectorTugState,
    robotX: number,
    robotY: number,
    scale: number,
    onStartDrag: (id: string) => void
  ) => {
    gfx.clear();

    // 1. Draw Active Input Force Vectors & Handles
    state.forces.forEach((f) => {
      const tipX = robotX + f.vector.x * scale;
      const tipY = robotY - f.vector.y * scale;

      // Solid Force Vector Shaft
      gfx.setStrokeStyle({ width: 4, color: f.colorHex });
      gfx.moveTo(robotX, robotY).lineTo(tipX, tipY).stroke();

      // Draggable Handle Tip Circle
      gfx.circle(tipX, tipY, 10).fill({ color: 0x020617 });
      gfx.circle(tipX, tipY, 10).stroke({ width: 2.5, color: f.colorHex });

      // Live Force Telemetry Label (Magnitude & Angle)
      const polar = cartesianToPolar(f.vector.x, f.vector.y);
      const labelText = `${f.name}: ${polar.magnitude}N @ ${polar.angleDeg}°`;
    });

    // 2. Draw Resultant Net Force Vector (Highlight Golden / Amber)
    if (state.showResultant && (state.netFx !== 0 || state.netFy !== 0)) {
      const resTipX = robotX + state.netFx * scale;
      const resTipY = robotY - state.netFy * scale;

      gfx.setStrokeStyle({ width: 5, color: 0xf59e0b });
      gfx.moveTo(robotX, robotY).lineTo(resTipX, resTipY).stroke();
      gfx.circle(resTipX, resTipY, 7).fill({ color: 0xf59e0b });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Top Telemetry Header */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>Net Force: <span className="font-mono font-bold text-amber-400">{vectorState.netMagnitudeN} N @ {vectorState.netAngleDeg}°</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Components: <span className="font-mono font-bold text-sky-400">Fx={vectorState.netFx}N, Fy={vectorState.netFy}N</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Accel: <span className="font-mono font-bold text-emerald-400">{vectorState.accelMagnitudeMps2} m/s²</span></div>
        </div>

        {/* Overlay Mode Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleResultant}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              vectorState.showResultant
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            RESULTANT (ΣF)
          </button>
          <button
            type="button"
            onClick={onToggleComponents}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              vectorState.showComponents
                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            COMPONENTS (Fx,Fy)
          </button>
          <button
            type="button"
            onClick={onToggleHeadToTail}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              vectorState.showHeadToTail
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            HEAD-TO-TAIL
          </button>
          <button
            type="button"
            onClick={onToggleFreeBody}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              vectorState.showFreeBodyDiagram
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            FREE-BODY (FBD)
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab" />

      {/* Footer Status Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          vectorState.isComplete
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : vectorState.predictionLocked
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          {vectorState.statusText}
        </div>
      </div>
    </div>
  );
};
