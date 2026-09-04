'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { GridState, PowerLoadFacility, VoltPowerGridRoundData } from '@/lib/physics/voltPowerGrid';
import { RoundResult } from '@/lib/physics/types';

interface VoltPowerGridCanvasProps {
  round: VoltPowerGridRoundData;
  gridState: GridState;
  facilities: PowerLoadFacility[];
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltPowerGridCanvas: React.FC<VoltPowerGridCanvasProps> = ({
  round,
  gridState,
  facilities,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // References for live 60fps animations
  const transformerCoreRef = useRef<PIXI.Graphics | null>(null);
  const overloadFlashRef = useRef<PIXI.Graphics | null>(null);
  const facilityGlowsRef = useRef<{ [id: string]: PIXI.Graphics }>({});
  const currentParticlesRef = useRef<{ gfx: PIXI.Graphics; facilityId: string; progress: number }[]>([]);

  const isLight = theme === 'light';

  const facilityCoords: { [id: string]: { x: number; y: number } } = {
    hospital: { x: 540, y: 80 },
    house: { x: 540, y: 170 },
    factory: { x: 540, y: 260 },
    ev: { x: 540, y: 350 },
    lights: { x: 540, y: 430 },
  };

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

      // 1. Grid Background & HUD Lines
      const bgGfx = new PIXI.Graphics();
      app.stage.addChild(bgGfx);
      drawGridBackground(bgGfx, width, height);

      // 2. High-Voltage Transmission Line Cables Layer
      const cableGfx = new PIXI.Graphics();
      app.stage.addChild(cableGfx);
      drawTransmissionCables(cableGfx);

      // 3. Central Power Substation (x = 160, y = 250)
      const transformerCore = drawPowerSubstation(app.stage, round.gridCapacityWatts);
      transformerCoreRef.current = transformerCore;

      // 4. Overload Warning Flash Layer
      const overloadFlash = new PIXI.Graphics();
      overloadFlash.rect(0, 0, width, height).fill({ color: 0xef4444, alpha: 0.0 });
      app.stage.addChild(overloadFlash);
      overloadFlashRef.current = overloadFlash;

      // 5. Facilities Nodes Layer
      facilityGlowsRef.current = {};
      facilities.forEach((f) => {
        const coords = facilityCoords[f.id] || { x: 540, y: 250 };
        const glow = drawFacilityNode(app.stage, coords.x, coords.y, f);
        facilityGlowsRef.current[f.id] = glow;
      });

      // 6. Current Flow Particles Stream
      currentParticlesRef.current = [];
      initCurrentParticles(app.stage);

      // 7. CONTINUOUS 60 FPS ANIMATION TICKER
      app.ticker.add(() => {
        // Rotate Substation Transformer Core
        if (transformerCoreRef.current) {
          const spinSpeed = (gridState.totalCurrentAmps / 20.0) * 0.05;
          transformerCoreRef.current.rotation += Math.max(0.01, spinSpeed);
        }

        // Overload Screen Flash
        if (overloadFlashRef.current) {
          if (gridState.isOverloaded) {
            overloadFlashRef.current.alpha = 0.15 + Math.sin(Date.now() * 0.01) * 0.1;
          } else {
            overloadFlashRef.current.alpha = 0;
          }
        }

        // Animate Facility Glows
        facilities.forEach((f) => {
          const glow = facilityGlowsRef.current[f.id];
          if (glow) {
            glow.alpha = f.isOn ? (gridState.isOverloaded ? 0.9 : 0.6) : 0;
          }
        });

        // Animate Current Particles Along Active Transmission Lines
        const baseSpeed = (gridState.totalCurrentAmps / 20.0) * 0.008;
        currentParticlesRef.current.forEach((p) => {
          const fac = facilities.find((item) => item.id === p.facilityId);
          if (fac && fac.isOn) {
            p.progress = (p.progress + Math.max(0.003, baseSpeed)) % 1;
            const target = facilityCoords[p.facilityId] || { x: 540, y: 250 };

            // Substation (160, 250) -> Trunk (320, 250) -> Facility (540, target.y)
            const pos = getParticlePosition(160, 250, 320, 250, target.x, target.y, p.progress);
            p.gfx.x = pos.x;
            p.gfx.y = pos.y;
            p.gfx.alpha = 0.95;
          } else {
            p.gfx.alpha = 0;
          }
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
  }, [round.id, isLight, gridState, facilities]);

  const drawGridBackground = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.3 });
    for (let x = 0; x < width; x += 30) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 30) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  const drawTransmissionCables = (gfx: PIXI.Graphics) => {
    gfx.clear();

    // High Voltage Cable Shadows
    gfx.setStrokeStyle({ width: 6, color: 0x0f172a, alpha: 0.8 });

    facilities.forEach((f) => {
      const coords = facilityCoords[f.id];
      if (coords) {
        // Substation (160, 250) -> Trunk Junction (320, 250) -> Facility (540, coords.y)
        gfx.moveTo(160, 250).lineTo(320, 250).lineTo(coords.x, coords.y).stroke();
      }
    });

    // Copper Active Core Cable Traces
    facilities.forEach((f) => {
      const coords = facilityCoords[f.id];
      if (coords) {
        gfx.setStrokeStyle({ width: 3, color: f.isOn ? (gridState.isOverloaded ? 0xef4444 : 0x38bdf8) : 0x334155 });
        gfx.moveTo(160, 250).lineTo(320, 250).lineTo(coords.x, coords.y).stroke();
      }
    });

    // Main Trunk Junction Node
    gfx.circle(320, 250, 10).fill({ color: 0x0284c7 });
    gfx.circle(320, 250, 10).stroke({ width: 2, color: 0x38bdf8 });
  };

  const drawPowerSubstation = (stage: PIXI.Container, capacityWatts: number) => {
    const container = new PIXI.Container();
    container.x = 160;
    container.y = 250;

    const gfx = new PIXI.Graphics();
    // Heavy Steel Enclosure
    gfx.rect(-65, -75, 130, 150).fill({ color: 0x0f172a });
    gfx.rect(-65, -75, 130, 150).stroke({ width: 3, color: 0x0284c7 });

    // Transformer Coils
    gfx.circle(-20, -15, 25).stroke({ width: 3, color: 0x38bdf8 });
    gfx.circle(20, 15, 25).stroke({ width: 3, color: 0x38bdf8 });

    // Rotating Core
    const core = new PIXI.Graphics();
    core.circle(0, 0, 14).fill({ color: 0x0284c7 });
    core.rect(-18, -4, 36, 8).fill({ color: 0xf59e0b });
    container.addChild(core);

    const txt = new PIXI.Text({
      text: `GRID SUBSTATION\nMAX: ${capacityWatts}W`,
      style: { fontSize: 10, fill: 0x38bdf8, fontWeight: 'bold', fontFamily: 'monospace', align: 'center' },
    });
    txt.anchor.set(0.5);
    txt.y = 52;

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);

    return core;
  };

  const drawFacilityNode = (stage: PIXI.Container, x: number, y: number, f: PowerLoadFacility) => {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    // Glowing Power Aura
    const glow = new PIXI.Graphics();
    glow.circle(0, 0, 36).fill({ color: f.priority === 'CRITICAL' ? 0xef4444 : 0x38bdf8, alpha: 0.0 });
    container.addChild(glow);

    const gfx = new PIXI.Graphics();
    // Building Card Box
    gfx.rect(-100, -22, 200, 44).fill({ color: f.isOn ? 0x1e293b : 0x0f172a });
    gfx.rect(-100, -22, 200, 44).stroke({ width: 2, color: f.isOn ? 0x38bdf8 : 0x334155 });

    // Priority Indicator Badge
    const priorityColor = f.priority === 'CRITICAL' ? 0xef4444 : f.priority === 'IMPORTANT' ? 0xf59e0b : 0x64748b;
    gfx.rect(-95, -18, 6, 36).fill({ color: priorityColor });

    const txt = new PIXI.Text({
      text: `${f.icon} ${f.name} (${f.powerWatts}W)`,
      style: { fontSize: 11, fill: f.isOn ? 0xf8fafc : 0x64748b, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.0, 0.5);
    txt.x = -80;

    const statusTxt = new PIXI.Text({
      text: f.isOn ? 'ONLINE' : 'OFFLINE',
      style: { fontSize: 10, fill: f.isOn ? 0x34d399 : 0xef4444, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    statusTxt.anchor.set(1.0, 0.5);
    statusTxt.x = 90;

    container.addChild(gfx);
    container.addChild(txt);
    container.addChild(statusTxt);
    stage.addChild(container);

    return glow;
  };

  const initCurrentParticles = (stage: PIXI.Container) => {
    facilities.forEach((f) => {
      for (let i = 0; i < 4; i++) {
        const pGfx = new PIXI.Graphics();
        pGfx.circle(0, 0, 3.5).fill({ color: 0x38bdf8 });
        pGfx.circle(0, 0, 6).fill({ color: 0x67e8f9, alpha: 0.5 });
        stage.addChild(pGfx);

        currentParticlesRef.current.push({
          gfx: pGfx,
          facilityId: f.id,
          progress: i / 4,
        });
      }
    });
  };

  const getParticlePosition = (x1: number, y1: number, xt: number, yt: number, x2: number, y2: number, progress: number) => {
    // Segment 1: Substation -> Trunk (x1, y1) to (xt, yt)
    // Segment 2: Trunk -> Facility (xt, yt) to (x2, y2)
    if (progress <= 0.4) {
      const p1 = progress / 0.4;
      return { x: x1 + (xt - x1) * p1, y: y1 + (yt - y1) * p1 };
    } else {
      const p2 = (progress - 0.4) / 0.6;
      return { x: xt + (x2 - xt) * p2, y: yt + (y2 - yt) * p2 };
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Telemetry Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>Voltage: <span className="font-mono font-bold text-sky-400">{gridState.voltage} V</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Current: <span className="font-mono font-bold text-emerald-400">{gridState.totalCurrentAmps} A</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Power: <span className="font-mono font-bold text-purple-400">{gridState.totalPowerWatts} W</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
          GRID CONTROL ROOM (P = V × I)
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Diagnostic Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          gridState.diagnostic === 'STABLE'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : gridState.diagnostic === 'WARNING'
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>
          {gridState.statusText}
        </div>
      </div>
    </div>
  );
};
