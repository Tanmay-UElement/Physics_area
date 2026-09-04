'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import confetti from 'canvas-confetti';
import { LeverState, WeightItem } from '@/lib/physics/leverBalance';

interface LeverCanvasProps {
  leverState: LeverState;
  theme: 'dark' | 'light';
  onWeightDistanceChange: (id: string, newDistM: number) => void;
  onForceAngleChange: (id: string, newAngleDeg: number) => void;
  onSimulationComplete: () => void;
  onToggleRotationalAxis?: () => void;
  onToggleLeverArm?: () => void;
  onToggleLineOfAction?: () => void;
  onToggleCenterOfMass?: () => void;
  onToggleFreeBody?: () => void;
}

export const LeverCanvas: React.FC<LeverCanvasProps> = ({
  leverState,
  theme,
  onWeightDistanceChange,
  onForceAngleChange,
  onSimulationComplete,
  onToggleRotationalAxis,
  onToggleLeverArm,
  onToggleLineOfAction,
  onToggleCenterOfMass,
  onToggleFreeBody,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // State Ref for 60 FPS Ticker
  const stateRef = useRef<LeverState>(leverState);
  useEffect(() => {
    stateRef.current = leverState;
  }, [leverState]);

  // Rotational Physics State Refs
  const currentAngleRadRef = useRef<number>(0);
  const currentAngularVelRef = useRef<number>(0);
  const isDraggingIdRef = useRef<string | null>(null);
  const isFinishedRef = useRef<boolean>(false);

  const isLight = theme === 'light';

  // Lab Canvas Constants: 1 Meter = 48 Pixels
  const M2P = 48;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const BASE_FULCRUM_X = 400; // Center pivot X
  const BASE_FULCRUM_Y = 320; // Center pivot Y

  useEffect(() => {
    let isMounted = true;

    const initCanvas = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const width = containerRef.current.clientWidth || CANVAS_WIDTH;
      const height = containerRef.current.clientHeight || CANVAS_HEIGHT;

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

      // 1. Grid Background & Fulcrum Base Layer
      const bgGfx = new PIXI.Graphics();
      app.stage.addChild(bgGfx);

      // 2. Auxiliary Overlays Layer (Line of Action, Lever Arm, Center of Mass)
      const auxGfx = new PIXI.Graphics();
      app.stage.addChild(auxGfx);

      // 3. Rotating Beam Container (Pivoted at Fulcrum)
      const fulcrumX = BASE_FULCRUM_X + leverState.fulcrumOffsetM * M2P;
      const beamContainer = new PIXI.Container();
      beamContainer.x = fulcrumX;
      beamContainer.y = BASE_FULCRUM_Y;
      app.stage.addChild(beamContainer);

      // Beam Body Graphics
      const beamGfx = new PIXI.Graphics();
      beamContainer.addChild(beamGfx);

      // Weight Attachments Container
      const weightsContainer = new PIXI.Container();
      beamContainer.addChild(weightsContainer);

      // 4. Pivot Axle & Bearing Top Overlay
      const pivotGfx = new PIXI.Graphics();
      app.stage.addChild(pivotGfx);

      // Drag pointer listeners on canvas stage
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      app.stage.on('pointermove', (e) => {
        const draggingId = isDraggingIdRef.current;
        if (!draggingId) return;

        const state = stateRef.current;
        const weightObj = state.weights.find((w) => w.id === draggingId);
        if (!weightObj || !weightObj.isDraggable) return;

        // Calculate horizontal offset relative to fulcrum position
        const fulcrumXPos = BASE_FULCRUM_X + state.fulcrumOffsetM * M2P;
        const dxPx = e.global.x - fulcrumXPos;
        let newDistM = dxPx / M2P;

        // Bounded within beam arms (-4.5m to +4.5m) and snap to nearest 0.1m
        newDistM = Math.max(-4.5, Math.min(4.5, newDistM));
        newDistM = Number((Math.round(newDistM * 10) / 10).toFixed(1));

        onWeightDistanceChange(draggingId, newDistM);
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

        const currentFulcrumX = BASE_FULCRUM_X + state.fulcrumOffsetM * M2P;
        beamContainer.x = currentFulcrumX;

        // Draw Lab Background & Fulcrum Stand
        drawBackground(bgGfx, width, height, isLight, state, currentFulcrumX, BASE_FULCRUM_Y);

        // Rotational Motion Integration (α = netTorque / I)
        if (state.isSimulating) {
          const alpha = state.angularAccelRadps2; // rad/s²
          const damping = state.dampingLevel === 'HIGH' ? 0.85 : state.dampingLevel === 'LOW' ? 0.98 : 0.92;

          // Update angular velocity & angle
          currentAngularVelRef.current = (currentAngularVelRef.current + alpha * dt * 0.5) * damping;
          currentAngleRadRef.current += currentAngularVelRef.current * dt * 0.5;

          // Max tilt angle bounds (±0.35 rad ~ 20 deg)
          const maxAngle = 0.35;
          if (currentAngleRadRef.current > maxAngle) {
            currentAngleRadRef.current = maxAngle;
            currentAngularVelRef.current *= -0.3; // bounce off stop pad
          } else if (currentAngleRadRef.current < -maxAngle) {
            currentAngleRadRef.current = -maxAngle;
            currentAngularVelRef.current *= -0.3;
          }

          beamContainer.rotation = -currentAngleRadRef.current; // Negative screen Y inversion

          // Check equilibrium settlement
          if (Math.abs(currentAngularVelRef.current) < 0.005 && !isFinishedRef.current) {
            isFinishedRef.current = true;
            if (state.isBalanced) {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
            onSimulationComplete();
          }
        } else {
          // Instant static tilt based on net torque when preparing configuration
          const maxTiltRad = 0.30;
          const maxTorqueRef = Math.max(state.leftTorqueNm, state.rightTorqueNm, 50);
          const targetAngle = (state.netTorqueNm / maxTorqueRef) * maxTiltRad;
          
          currentAngleRadRef.current += (targetAngle - currentAngleRadRef.current) * 0.15;
          beamContainer.rotation = -currentAngleRadRef.current;
          isFinishedRef.current = false;
        }

        // Draw Metallic Lever Beam & Tick Markers
        drawLeverBeam(beamGfx, state.beamLengthM, M2P, isLight);

        // Draw Placed Weights & Force Handles
        drawWeightsAndForces(weightsContainer, state, M2P, (id) => {
          isDraggingIdRef.current = id;
        });

        // Draw Overlays (Rotational Axis, Lever Arm, Line of Action, Center of Mass)
        drawAuxiliaryOverlays(auxGfx, state, currentFulcrumX, BASE_FULCRUM_Y, M2P);

        // Draw Pivot Axle & Bearing Top Ring
        drawPivotAxle(pivotGfx, state, currentFulcrumX, BASE_FULCRUM_Y);
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

  const drawBackground = (
    gfx: PIXI.Graphics,
    width: number,
    height: number,
    lightMode: boolean,
    state: LeverState,
    fulcrumX: number,
    fulcrumY: number
  ) => {
    gfx.clear();
    const bgColor = state.showFreeBodyDiagram ? 0x020617 : lightMode ? 0x0f172a : 0x030712;
    gfx.rect(0, 0, width, height).fill({ color: bgColor });

    if (state.showFreeBodyDiagram) return;

    // Grid backdrop
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.4 });
    for (let x = 0; x < width; x += 40) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 40) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();

    // Fulcrum Mechanical Stand
    gfx.poly([
      { x: fulcrumX - 35, y: fulcrumY + 60 },
      { x: fulcrumX + 35, y: fulcrumY + 60 },
      { x: fulcrumX, y: fulcrumY },
    ]).fill({ color: 0x1e293b });
    gfx.poly([
      { x: fulcrumX - 35, y: fulcrumY + 60 },
      { x: fulcrumX + 35, y: fulcrumY + 60 },
      { x: fulcrumX, y: fulcrumY },
    ]).stroke({ width: 3, color: 0x38bdf8 });

    // Base Support Beam
    gfx.moveTo(80, fulcrumY + 60).lineTo(width - 80, fulcrumY + 60).stroke({ width: 4, color: 0x334155 });
  };

  const drawLeverBeam = (gfx: PIXI.Graphics, beamLengthM: number, scale: number, lightMode: boolean) => {
    gfx.clear();
    const halfLenPx = (beamLengthM / 2) * scale;

    // Metallic Lever Beam Body
    gfx.rect(-halfLenPx, -12, halfLenPx * 2, 24).fill({ color: 0x0f172a });
    gfx.rect(-halfLenPx, -12, halfLenPx * 2, 24).stroke({ width: 3, color: 0x38bdf8 });

    // Distance Metric Ticks (-5.0m to +5.0m)
    for (let m = -5; m <= 5; m += 0.5) {
      const tickX = m * scale;
      if (tickX < -halfLenPx || tickX > halfLenPx) continue;

      const isMajor = Math.abs(m % 1) < 0.05;
      const height = isMajor ? 12 : 6;
      gfx.moveTo(tickX, -12).lineTo(tickX, -12 + height).stroke({ width: isMajor ? 2 : 1, color: isMajor ? 0x38bdf8 : 0x64748b });
    }
  };

  const drawWeightsAndForces = (
    container: PIXI.Container,
    state: LeverState,
    scale: number,
    onStartDrag: (id: string) => void
  ) => {
    container.removeChildren();

    state.weights.forEach((w) => {
      const weightPxX = w.distanceM * scale;
      const wGroup = new PIXI.Container();
      wGroup.x = weightPxX;
      wGroup.y = -36;

      // Weight Box Graphics
      const boxGfx = new PIXI.Graphics();
      const boxSize = Math.min(48, Math.max(32, w.massKg * 0.8));
      boxGfx.rect(-boxSize / 2, -boxSize / 2, boxSize, boxSize).fill({ color: 0x020617 });
      boxGfx.rect(-boxSize / 2, -boxSize / 2, boxSize, boxSize).stroke({ width: 2.5, color: w.colorHex });

      const text = new PIXI.Text({
        text: `${w.massKg}kg`,
        style: { fontSize: 11, fill: w.colorHex, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      text.anchor.set(0.5);

      const distText = new PIXI.Text({
        text: `${w.distanceM > 0 ? '+' : ''}${w.distanceM}m`,
        style: { fontSize: 9, fill: 0x94a3b8, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      distText.anchor.set(0.5, -1.8);

      wGroup.addChild(boxGfx);
      wGroup.addChild(text);
      wGroup.addChild(distText);

      // Interactive drag setup
      if (w.isDraggable) {
        wGroup.eventMode = 'static';
        wGroup.cursor = 'grab';
        wGroup.on('pointerdown', () => onStartDrag(w.id));
      }

      container.addChild(wGroup);
    });
  };

  const drawAuxiliaryOverlays = (
    gfx: PIXI.Graphics,
    state: LeverState,
    fulcrumX: number,
    fulcrumY: number,
    scale: number
  ) => {
    gfx.clear();

    // 1. Center of Mass Indicator Ring
    if (state.showCenterOfMass) {
      const comPxX = fulcrumX + state.centerOfMassX * scale;
      gfx.circle(comPxX, fulcrumY, 14).stroke({ width: 2, color: 0xf59e0b });
      gfx.circle(comPxX, fulcrumY, 4).fill({ color: 0xf59e0b });

      const comTxt = new PIXI.Text({
        text: `COM (${state.centerOfMassX > 0 ? '+' : ''}${state.centerOfMassX}m)`,
        style: { fontSize: 9, fill: 0xf59e0b, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      comTxt.x = comPxX;
      comTxt.y = fulcrumY + 22;
      comTxt.anchor.set(0.5);
      gfx.addChild(comTxt);
    }
  };

  const drawPivotAxle = (gfx: PIXI.Graphics, state: LeverState, fulcrumX: number, fulcrumY: number) => {
    gfx.clear();

    // Pivot Bearing Outer Ring
    gfx.circle(fulcrumX, fulcrumY, 14).fill({ color: 0x020617 });
    gfx.circle(fulcrumX, fulcrumY, 14).stroke({ width: 3, color: 0x38bdf8 });
    gfx.circle(fulcrumX, fulcrumY, 5).fill({ color: 0x38bdf8 });

    // Pivot Label
    if (state.showRotationalAxis) {
      const pTxt = new PIXI.Text({
        text: 'PIVOT AXLE',
        style: { fontSize: 9, fill: 0x38bdf8, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      pTxt.x = fulcrumX;
      pTxt.y = fulcrumY + 28;
      pTxt.anchor.set(0.5);
      gfx.addChild(pTxt);
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
          <div>Left Torque: <span className="font-mono font-bold text-sky-400">↺ {leverState.leftTorqueNm} N·m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Right Torque: <span className="font-mono font-bold text-purple-400">↻ {leverState.rightTorqueNm} N·m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Net Torque: <span className="font-mono font-bold text-amber-400">Στ={leverState.netTorqueNm} N·m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>MA: <span className="font-mono font-bold text-emerald-400">{leverState.mechanicalAdvantageMA}x</span></div>
        </div>

        {/* Visual Overlay Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleRotationalAxis}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              leverState.showRotationalAxis
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            PIVOT AXIS
          </button>
          <button
            type="button"
            onClick={onToggleCenterOfMass}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              leverState.showCenterOfMass
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            CENTER OF MASS (COM)
          </button>
          <button
            type="button"
            onClick={onToggleFreeBody}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              leverState.showFreeBodyDiagram
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
          leverState.isComplete
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : leverState.predictionLocked
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          {leverState.statusText}
        </div>
      </div>
    </div>
  );
};
