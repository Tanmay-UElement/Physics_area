'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { RefractionState, WaveRefractionRoundData } from '@/lib/physics/waveRefraction';
import { RoundResult } from '@/lib/physics/types';

interface WaveRefractionCanvasProps {
  round: WaveRefractionRoundData;
  refractionState: RefractionState;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const WaveRefractionCanvas: React.FC<WaveRefractionCanvasProps> = ({
  round,
  refractionState,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // Animation references
  const laserMountRef = useRef<PIXI.Container | null>(null);
  const rayGfxRef = useRef<PIXI.Graphics | null>(null);
  const targetGfxRef = useRef<PIXI.Graphics | null>(null);
  const laserGlowRef = useRef<PIXI.Graphics | null>(null);

  const isLight = theme === 'light';

  // Ref to always hold the latest refraction state without triggering useEffect re-init
  const refractionStateRef = useRef<RefractionState>(refractionState);
  useEffect(() => {
    refractionStateRef.current = refractionState;
  }, [refractionState]);

  // Optical bench geometry
  const JUNCTION_X = 400;
  const JUNCTION_Y = 220;
  const DETECTOR_X = 720;
  const TANK_WIDTH = 260;
  const TANK_HEIGHT = 180;

  useEffect(() => {
    let isMounted = true;

    const initCanvas = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 460;

      const app = new PIXI.Application();
      await app.init({
        width,
        height,
        backgroundColor: isLight ? 0x0f172a : 0x070d19,
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

      // 1. Lab Background & Optical Table Scale
      const tableGfx = new PIXI.Graphics();
      app.stage.addChild(tableGfx);
      drawOpticalTable(tableGfx, width, height);

      // 2. Optical Medium Tank (Water/Glass/Acrylic Container)
      const tankGfx = new PIXI.Graphics();
      app.stage.addChild(tankGfx);
      drawMediumTank(tankGfx, height, refractionStateRef.current);

      // 3. Dashed Normal Line & Angle Guide
      const normalGfx = new PIXI.Graphics();
      app.stage.addChild(normalGfx);
      drawNormalLine(normalGfx);

      // 4. Laser Emitter Mount & Charging Glow
      const laserContainer = drawLaserMount(app.stage);
      laserMountRef.current = laserContainer;

      // 5. Laser Ray Graphics (Incident, Refracted, Reflected, Beam Head Spark)
      const rayGfx = new PIXI.Graphics();
      app.stage.addChild(rayGfx);
      rayGfxRef.current = rayGfx;

      // 6. Target Detector Sensor Target Board 🎯
      const targetContainer = new PIXI.Container();
      app.stage.addChild(targetContainer);

      const targetGfx = new PIXI.Graphics();
      targetContainer.addChild(targetGfx);
      targetGfxRef.current = targetGfx;

      // 7. CONTINUOUS 60 FPS ANIMATION TICKER
      app.ticker.add(() => {
        const state = refractionStateRef.current;
        const theta1Rad = (state.incidentAngleDeg * Math.PI) / 180;
        const theta2Rad = (state.refractedAngleDeg * Math.PI) / 180;

        // Position & Rotate Laser Emitter Mount
        if (laserMountRef.current) {
          const laserDist = 240;
          const lx = JUNCTION_X - Math.sin(theta1Rad) * laserDist;
          const ly = JUNCTION_Y - Math.cos(theta1Rad) * laserDist;
          laserMountRef.current.x = lx;
          laserMountRef.current.y = ly;
          laserMountRef.current.rotation = theta1Rad;

          // Recoil jitter effect when shooting
          if (state.isShooting && state.beamProgress < 0.2) {
            laserMountRef.current.x += (Math.random() - 0.5) * 4;
            laserMountRef.current.y += (Math.random() - 0.5) * 4;
          }
        }

        // Draw Laser Rays & Firing Beam Travel Animation
        if (rayGfxRef.current) {
          drawLaserRays(rayGfxRef.current, theta1Rad, theta2Rad, state);
        }

        // Draw Physical Target Detector Screen on the right
        if (targetGfxRef.current) {
          drawDetectorScreen(targetGfxRef.current, theta2Rad, state);
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

  const drawOpticalTable = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();

    // Metallic Table Surface Line
    const tableY = JUNCTION_Y + 140;
    gfx.rect(0, tableY, width, height - tableY).fill({ color: 0x1e293b, alpha: 0.8 });
    gfx.setStrokeStyle({ width: 3, color: 0x334155 });
    gfx.moveTo(0, tableY).lineTo(width, tableY).stroke();

    // Measurement Scale (0m ... 0.5m ... 1.0m ... 1.5m ... 2.0m)
    gfx.setStrokeStyle({ width: 1.5, color: 0x64748b, alpha: 0.6 });
    for (let x = 80; x <= 720; x += 40) {
      const isMajor = (x - 80) % 160 === 0;
      const tickH = isMajor ? 12 : 6;
      gfx.moveTo(x, tableY).lineTo(x, tableY - tickH).stroke();
    }
  };

  const drawMediumTank = (gfx: PIXI.Graphics, height: number, state: RefractionState) => {
    gfx.clear();

    const m2Color = PIXI.Color.shared.setValue(state.medium2.color).toNumber();

    // Transparent Glass Container Body
    const tankX = JUNCTION_X - 10;
    const tankY = JUNCTION_Y;
    gfx.rect(tankX, tankY, TANK_WIDTH, TANK_HEIGHT).fill({ color: m2Color, alpha: 0.22 });
    gfx.rect(tankX, tankY, TANK_WIDTH, TANK_HEIGHT).stroke({ width: 3, color: 0x38bdf8, alpha: 0.7 });

    // Glass Refraction Boundary Interface Line
    gfx.setStrokeStyle({ width: 4, color: 0x38bdf8, alpha: 0.9 });
    gfx.moveTo(JUNCTION_X, JUNCTION_Y).lineTo(JUNCTION_X, JUNCTION_Y + TANK_HEIGHT).stroke();
  };

  const drawNormalLine = (gfx: PIXI.Graphics) => {
    gfx.clear();

    // Dashed Perpendicular Normal Line
    gfx.setStrokeStyle({ width: 2, color: 0x94a3b8, alpha: 0.7 });
    for (let y = 60; y < JUNCTION_Y + 180; y += 12) {
      gfx.moveTo(JUNCTION_X, y).lineTo(JUNCTION_X, y + 6).stroke();
    }

    // Normal Text Label
    const txt = new PIXI.Text({
      text: 'Normal',
      style: { fontSize: 11, fill: 0x94a3b8, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    txt.x = JUNCTION_X + 6;
    txt.y = 70;
    gfx.addChild(txt);
  };

  const drawLaserMount = (stage: PIXI.Container) => {
    const container = new PIXI.Container();

    const gfx = new PIXI.Graphics();
    // Heavy Metallic Laser Barrel
    gfx.rect(-20, -50, 40, 100).fill({ color: 0x334155 });
    gfx.rect(-20, -50, 40, 100).stroke({ width: 2.5, color: 0x64748b });

    // Ruby Laser Emitter Tip
    gfx.rect(-10, 48, 20, 14).fill({ color: 0xef4444 });
    gfx.rect(-10, 48, 20, 14).stroke({ width: 2, color: 0xf87171 });

    // Charging indicator glow
    const glow = new PIXI.Graphics();
    glow.circle(0, 55, 18).fill({ color: 0xef4444, alpha: 0.4 });
    container.addChild(glow);
    laserGlowRef.current = glow;

    const txt = new PIXI.Text({
      text: 'LASER (650nm)',
      style: { fontSize: 9, fill: 0xf87171, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -15;

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);

    return container;
  };

  const drawLaserRays = (gfx: PIXI.Graphics, theta1Rad: number, theta2Rad: number, state: RefractionState) => {
    gfx.clear();

    // Pulse Charging Glow on Emitter Tip
    if (laserGlowRef.current) {
      if (state.isCharging) {
        laserGlowRef.current.alpha = 0.6 + Math.sin(Date.now() * 0.02) * 0.4;
      } else {
        laserGlowRef.current.alpha = 0.2;
      }
    }

    // Only draw beam if active or after shooting
    const showBeam = state.isShooting || state.shotHistory.length > 0;
    if (!showBeam) return;

    const laserDist = 240;
    const incX = JUNCTION_X - Math.sin(theta1Rad) * laserDist;
    const incY = JUNCTION_Y - Math.cos(theta1Rad) * laserDist;

    // 1. Incident Ray (Laser -> Boundary)
    const prog = state.isShooting ? Math.min(1.0, state.beamProgress * 2.0) : 1.0;
    const curIncX = incX + (JUNCTION_X - incX) * prog;
    const curIncY = incY + (JUNCTION_Y - incY) * prog;

    // Glowing Red Beam Core
    gfx.setStrokeStyle({ width: 8, color: 0xef4444, alpha: 0.3 });
    gfx.moveTo(incX, incY).lineTo(curIncX, curIncY).stroke();

    gfx.setStrokeStyle({ width: 3.5, color: 0xf87171, alpha: 0.95 });
    gfx.moveTo(incX, incY).lineTo(curIncX, curIncY).stroke();

    // 2. Interface Spark at Boundary (If beam reached junction)
    if (prog >= 0.95) {
      gfx.circle(JUNCTION_X, JUNCTION_Y, 8).fill({ color: 0xfef08a, alpha: 0.9 });

      // 3. Refracted Ray (Boundary -> Medium 2 Tank / Target)
      const prog2 = state.isShooting ? Math.max(0.0, (state.beamProgress - 0.5) * 2.0) : 1.0;
      if (prog2 > 0) {
        if (state.isTotalInternalReflection) {
          // Total Internal Reflection Ray (Reflects upward into Medium 1)
          const refX = JUNCTION_X + Math.sin(theta1Rad) * (laserDist * prog2);
          const refY = JUNCTION_Y - Math.cos(theta1Rad) * (laserDist * prog2);

          gfx.setStrokeStyle({ width: 6, color: 0xef4444, alpha: 0.9 });
          gfx.moveTo(JUNCTION_X, JUNCTION_Y).lineTo(refX, refY).stroke();
        } else {
          // Refracted Ray into Medium 2
          const refrLen = DETECTOR_X - JUNCTION_X;
          const targetY = JUNCTION_Y + Math.tan(theta2Rad) * refrLen;

          const curRefrX = JUNCTION_X + (DETECTOR_X - JUNCTION_X) * prog2;
          const curRefrY = JUNCTION_Y + (targetY - JUNCTION_Y) * prog2;

          gfx.setStrokeStyle({ width: 8, color: 0xef4444, alpha: 0.3 });
          gfx.moveTo(JUNCTION_X, JUNCTION_Y).lineTo(curRefrX, curRefrY).stroke();

          gfx.setStrokeStyle({ width: 3.5, color: 0xf87171, alpha: 0.95 });
          gfx.moveTo(JUNCTION_X, JUNCTION_Y).lineTo(curRefrX, curRefrY).stroke();

          // Reflected Ray Faint Component
          const refX = JUNCTION_X + Math.sin(theta1Rad) * (120 * prog2);
          const refY = JUNCTION_Y - Math.cos(theta1Rad) * (120 * prog2);
          gfx.setStrokeStyle({ width: 1.5, color: 0xef4444, alpha: 0.3 });
          gfx.moveTo(JUNCTION_X, JUNCTION_Y).lineTo(refX, refY).stroke();
        }
      }
    }
  };

  const drawDetectorScreen = (gfx: PIXI.Graphics, theta2Rad: number, state: RefractionState) => {
    gfx.clear();

    const detectorY = JUNCTION_Y + 70; // Fixed Target Board Center Y

    // Target Detector Board Frame
    gfx.rect(DETECTOR_X - 15, detectorY - 70, 30, 140).fill({ color: 0x1e293b });
    gfx.rect(DETECTOR_X - 15, detectorY - 70, 30, 140).stroke({ width: 3, color: 0x475569 });

    // Target Concentric Rings (Center 🎯)
    const isHit = state.targetHit;
    const ringColor = isHit ? 0x34d399 : state.lastHitTier === 'PARTIAL' ? 0xf59e0b : 0xef4444;

    gfx.circle(DETECTOR_X, detectorY, 35).stroke({ width: 2, color: ringColor, alpha: 0.4 });
    gfx.circle(DETECTOR_X, detectorY, 20).stroke({ width: 2, color: ringColor, alpha: 0.7 });
    gfx.circle(DETECTOR_X, detectorY, 8).fill({ color: ringColor });

    // Actual Beam Impact Point Location on Detector Plane
    if (state.shotHistory.length > 0 && !state.isTotalInternalReflection) {
      const refrLen = DETECTOR_X - JUNCTION_X;
      const actualLandingY = JUNCTION_Y + Math.tan(theta2Rad) * refrLen;

      // Laser Impact Red Spark
      gfx.circle(DETECTOR_X, actualLandingY, 6).fill({ color: 0xfef08a });
      gfx.circle(DETECTOR_X, actualLandingY, 10).stroke({ width: 2, color: 0xef4444 });

      // Impact Offset Marker Label
      const offset = state.lastImpactOffsetCm || 0;
      const offsetTxt = new PIXI.Text({
        text: `${offset > 0 ? '+' : ''}${offset} cm`,
        style: { fontSize: 10, fill: isHit ? 0x34d399 : 0xf87171, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      offsetTxt.x = DETECTOR_X + 22;
      offsetTxt.y = actualLandingY - 6;
      gfx.addChild(offsetTxt);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Top Telemetry Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>LASER WAVELENGTH: <span className="font-mono font-bold text-red-400">650 nm (Red)</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>TARGET DISTANCE: <span className="font-mono font-bold text-sky-400">{refractionState.targetDetectorDistanceM} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>TIME SCALE: <span className="font-mono font-bold text-amber-400">VISUALIZED</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
          OPTICS BENCH (SNELL'S LAW)
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Diagnostic Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          refractionState.targetHit
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : refractionState.isTotalInternalReflection
            ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          {refractionState.statusText}
        </div>
      </div>
    </div>
  );
};
