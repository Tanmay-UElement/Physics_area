'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { CircuitState, CircuitType, VoltSeriesParallelRoundData, evaluateSeriesParallelSubmission } from '@/lib/physics/voltSeriesParallel';
import { RoundResult } from '@/lib/physics/types';

interface VoltSeriesParallelCanvasProps {
  round: VoltSeriesParallelRoundData;
  circuitState: CircuitState;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltSeriesParallelCanvas: React.FC<VoltSeriesParallelCanvasProps> = ({
  round,
  circuitState,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // References for live 60fps animations
  const bulb1GlowRef = useRef<PIXI.Graphics | null>(null);
  const bulb2GlowRef = useRef<PIXI.Graphics | null>(null);
  const switchLeverRef = useRef<PIXI.Graphics | null>(null);
  const sparkContainerRef = useRef<PIXI.Container | null>(null);
  const currentParticlesRef = useRef<{ gfx: PIXI.Graphics; pathId: 'series' | 'branch1' | 'branch2'; progress: number }[]>([]);

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

      // 1. Tech Workbench Grid
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawWorkbenchGrid(gridGfx, width, height);

      // 2. Spark Container for Switch Toggles & Short Circuits
      const sparkContainer = new PIXI.Container();
      app.stage.addChild(sparkContainer);
      sparkContainerRef.current = sparkContainer;

      // 3. Dynamic Circuit Copper Wires Layer
      const wireGfx = new PIXI.Graphics();
      app.stage.addChild(wireGfx);
      drawCircuitWires(wireGfx, circuitState.circuitType);

      // 4. Physical Battery Pack Component (Left Side, x = 140, y = 250)
      drawBatteryPack(app.stage, round.sourceVoltage);

      // 5. Master Toggle Switch (Bottom Center, x = 320, y = 390)
      const switchLever = drawMasterSwitch(app.stage);
      switchLeverRef.current = switchLever;

      // 6. Room A Bulb 1 Component (Center/Top, x = 500, y = 150)
      const bulb1Glow = drawLightBulbFixture(app.stage, 500, 150, 'ROOM A (BULB 1)', circuitState.isBulb1Installed);
      bulb1GlowRef.current = bulb1Glow;

      // 7. Room B Bulb 2 Component (Center/Bottom, x = 500, y = 350)
      const bulb2Glow = drawLightBulbFixture(app.stage, 500, 350, 'ROOM B (BULB 2)', circuitState.isBulb2Installed);
      bulb2GlowRef.current = bulb2Glow;

      // 8. Bench Digital Multimeter (Right Side, x = 700, y = 250)
      drawDigitalMultimeter(app.stage, circuitState);

      // 9. Conventional Current Particle Stream (Animated 60 FPS loop)
      currentParticlesRef.current = [];
      initCurrentParticles(app.stage);

      // 10. CONTINUOUS 60 FPS TICKER
      app.ticker.add(() => {
        const isActive = circuitState.diagnostic === 'ACTIVE';

        // Animate Switch Lever
        if (switchLeverRef.current) {
          switchLeverRef.current.rotation = circuitState.isSwitchClosed ? 0 : -Math.PI / 4;
        }

        // Animate Bulb 1 Glow
        if (bulb1GlowRef.current) {
          const b1Ratio = circuitState.bulb1Lit ? (circuitState.circuitType === 'parallel' ? 1.0 : 0.45) : 0.0;
          bulb1GlowRef.current.alpha = b1Ratio * 0.9;
          bulb1GlowRef.current.scale.set(0.6 + b1Ratio * 0.7);
        }

        // Animate Bulb 2 Glow
        if (bulb2GlowRef.current) {
          const b2Ratio = circuitState.bulb2Lit ? (circuitState.circuitType === 'parallel' ? 1.0 : 0.45) : 0.0;
          bulb2GlowRef.current.alpha = b2Ratio * 0.9;
          bulb2GlowRef.current.scale.set(0.6 + b2Ratio * 0.7);
        }

        // Animate Current Particles
        if (isActive) {
          const speed = (circuitState.current / 0.90) * 0.008;
          currentParticlesRef.current.forEach((p) => {
            p.progress = (p.progress + speed) % 1;
            const pos = getParticlePosition(p.pathId, p.progress, circuitState.circuitType);
            p.gfx.x = pos.x;
            p.gfx.y = pos.y;
            p.gfx.alpha = pos.visible ? 0.9 : 0.0;
          });
        } else {
          currentParticlesRef.current.forEach((p) => (p.gfx.alpha = 0));
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
  }, [round.id, isLight, circuitState]);

  const drawWorkbenchGrid = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.35 });
    for (let x = 0; x < width; x += 30) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 30) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  const drawCircuitWires = (gfx: PIXI.Graphics, type: CircuitType) => {
    gfx.clear();
    if (type === 'none') return;

    // Copper Trace Shadows
    gfx.setStrokeStyle({ width: 8, color: 0xb45309, alpha: 0.5 });

    if (type === 'series') {
      // Single rectangular series loop: (140, 250) -> (140, 150) -> (500, 150) -> (500, 350) -> (320, 390) -> (140, 250)
      gfx.moveTo(140, 250).lineTo(140, 150).lineTo(500, 150).lineTo(500, 350).lineTo(140, 390).lineTo(140, 250).stroke();

      // Active Neon Blue Core
      gfx.setStrokeStyle({ width: 4, color: 0x38bdf8 });
      gfx.moveTo(140, 250).lineTo(140, 150).lineTo(500, 150).lineTo(500, 350).lineTo(140, 390).lineTo(140, 250).stroke();
    } else if (type === 'parallel') {
      // Parallel Dual-Branch Wiring:
      // Main trunk: Battery (140, 250) -> Junction 1 (340, 250)
      // Branch A (Top): Junction 1 (340, 250) -> (340, 150) -> Bulb 1 (500, 150) -> Junction 2 (620, 150) -> (620, 250)
      // Branch B (Bottom): Junction 1 (340, 250) -> (340, 350) -> Bulb 2 (500, 350) -> Junction 2 (620, 350) -> (620, 250)
      // Return trunk: Junction 2 (620, 250) -> Switch (320, 390) -> Battery (140, 250)

      gfx.moveTo(140, 250).lineTo(340, 250);
      gfx.moveTo(340, 150).lineTo(500, 150).lineTo(620, 150).lineTo(620, 250);
      gfx.moveTo(340, 350).lineTo(500, 350).lineTo(620, 350).lineTo(620, 250);
      gfx.moveTo(340, 150).lineTo(340, 350);
      gfx.moveTo(620, 250).lineTo(140, 390).lineTo(140, 250);
      gfx.stroke();

      gfx.setStrokeStyle({ width: 4, color: 0x38bdf8 });
      gfx.moveTo(140, 250).lineTo(340, 250);
      gfx.moveTo(340, 150).lineTo(500, 150).lineTo(620, 150).lineTo(620, 250);
      gfx.moveTo(340, 350).lineTo(500, 350).lineTo(620, 350).lineTo(620, 250);
      gfx.moveTo(340, 150).lineTo(340, 350);
      gfx.moveTo(620, 250).lineTo(140, 390).lineTo(140, 250);
      gfx.stroke();

      // Glowing Junction Nodes (SPLIT & REJOIN)
      gfx.circle(340, 250, 8).fill({ color: 0xf59e0b }); // Split Node
      gfx.circle(620, 250, 8).fill({ color: 0xf59e0b }); // Rejoin Node
    }
  };

  const drawBatteryPack = (stage: PIXI.Container, vSource: number) => {
    const container = new PIXI.Container();
    container.x = 140;
    container.y = 250;

    const gfx = new PIXI.Graphics();
    gfx.rect(-45, -50, 90, 100).fill({ color: 0x0f172a });
    gfx.rect(-45, -50, 90, 100).stroke({ width: 3, color: 0xeab308 });
    gfx.rect(-38, -42, 76, 84).fill({ color: 0x1e293b });

    // Battery Terminals
    gfx.rect(-30, -60, 20, 10).fill({ color: 0xef4444 }); // Positive +
    gfx.rect(10, -60, 20, 10).fill({ color: 0x3b82f6 }); // Negative -

    const txt = new PIXI.Text({
      text: `${vSource}V DC`,
      style: { fontSize: 13, fill: 0xfacc15, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);
  };

  const drawMasterSwitch = (stage: PIXI.Container) => {
    const container = new PIXI.Container();
    container.x = 320;
    container.y = 390;

    const gfx = new PIXI.Graphics();
    gfx.rect(-40, -18, 80, 36).fill({ color: 0x1e293b });
    gfx.rect(-40, -18, 80, 36).stroke({ width: 2, color: 0x64748b });

    // Terminal Contacts
    gfx.circle(-25, 0, 6).fill({ color: 0xf59e0b });
    gfx.circle(25, 0, 6).fill({ color: 0xf59e0b });

    // Mechanical Lever
    const lever = new PIXI.Graphics();
    lever.rect(0, -4, 50, 8).fill({ color: 0xef4444 });
    lever.rect(0, -4, 50, 8).stroke({ width: 1.5, color: 0xffffff });
    lever.x = -25;
    container.addChild(gfx);
    container.addChild(lever);

    const label = new PIXI.Text({
      text: 'MASTER SWITCH',
      style: { fontSize: 9, fill: 0x94a3b8, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5, -2.2);
    container.addChild(label);

    stage.addChild(container);
    return lever;
  };

  const drawLightBulbFixture = (stage: PIXI.Container, x: number, y: number, name: string, isInstalled: boolean) => {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    // Glowing Light Bloom
    const bulbGlow = new PIXI.Graphics();
    bulbGlow.circle(0, 0, 50).fill({ color: 0xfacc15, alpha: 0.0 });
    container.addChild(bulbGlow);

    const gfx = new PIXI.Graphics();
    // Socket Base
    gfx.rect(-24, 18, 48, 20).fill({ color: 0x334155 });
    gfx.rect(-24, 18, 48, 20).stroke({ width: 2, color: 0x64748b });

    if (isInstalled) {
      // Glass Bulb Dome
      gfx.circle(0, 0, 24).fill({ color: 0x0284c7, alpha: 0.3 });
      gfx.circle(0, 0, 24).stroke({ width: 2.5, color: 0x38bdf8 });
      // Tungsten Filament
      gfx.moveTo(-8, 10).lineTo(0, -8).lineTo(8, 10).stroke({ width: 2, color: 0xfef08a });
    } else {
      // Empty Socket Socket Outline
      gfx.circle(0, 0, 24).stroke({ width: 2, color: 0xef4444, alpha: 0.5 });
      const emptyTxt = new PIXI.Text({
        text: 'REMOVED',
        style: { fontSize: 9, fill: 0xef4444, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      emptyTxt.anchor.set(0.5);
      container.addChild(emptyTxt);
    }

    const label = new PIXI.Text({
      text: name,
      style: { fontSize: 10, fill: 0x38bdf8, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5, -2.4);

    container.addChild(gfx);
    container.addChild(label);
    stage.addChild(container);

    return bulbGlow;
  };

  const drawDigitalMultimeter = (stage: PIXI.Container, state: CircuitState) => {
    const container = new PIXI.Container();
    container.x = 700;
    container.y = 250;

    const gfx = new PIXI.Graphics();
    gfx.rect(-60, -80, 120, 160).fill({ color: 0x0f172a });
    gfx.rect(-60, -80, 120, 160).stroke({ width: 3, color: 0x3b82f6 });

    // LCD Screen
    gfx.rect(-50, -68, 100, 50).fill({ color: 0x022c22 });
    gfx.rect(-50, -68, 100, 50).stroke({ width: 2, color: 0x10b981 });

    const lcdTxt = new PIXI.Text({
      text: `${state.voltage.toFixed(1)}V\n${state.current.toFixed(2)}A`,
      style: { fontSize: 13, fill: 0x34d399, fontWeight: 'bold', fontFamily: 'monospace', align: 'center' },
    });
    lcdTxt.anchor.set(0.5);
    lcdTxt.x = 0;
    lcdTxt.y = -43;

    const label = new PIXI.Text({
      text: 'DIGITAL METER',
      style: { fontSize: 9, fill: 0x60a5fa, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5, -6.5);

    container.addChild(gfx);
    container.addChild(lcdTxt);
    container.addChild(label);
    stage.addChild(container);
  };

  const initCurrentParticles = (stage: PIXI.Container) => {
    for (let i = 0; i < 16; i++) {
      const pGfx = new PIXI.Graphics();
      pGfx.circle(0, 0, 4).fill({ color: 0x38bdf8 });
      pGfx.circle(0, 0, 7).fill({ color: 0x67e8f9, alpha: 0.5 });
      stage.addChild(pGfx);

      const pathId = i < 8 ? 'branch1' : 'branch2';
      currentParticlesRef.current.push({
        gfx: pGfx,
        pathId: i % 2 === 0 ? 'branch1' : 'branch2',
        progress: i / 16,
      });
    }
  };

  const getParticlePosition = (pathId: 'series' | 'branch1' | 'branch2', progress: number, type: CircuitType) => {
    if (type === 'series') {
      // Loop: 140,250 -> 140,150 -> 500,150 -> 500,350 -> 140,390 -> 140,250
      const d = progress * 1100;
      if (d <= 100) return { x: 140, y: 250 - d, visible: true };
      if (d <= 460) return { x: 140 + (d - 100), y: 150, visible: true };
      if (d <= 660) return { x: 500, y: 150 + (d - 460), visible: circuitState.isBulb1Installed && circuitState.isBulb2Installed };
      if (d <= 1020) return { x: 500 - (d - 660) * 0.8, y: 350 + (d - 660) * 0.1, visible: true };
      return { x: 140, y: 390 - (d - 1020), visible: true };
    }

    if (type === 'parallel') {
      if (pathId === 'branch1') {
        // Branch 1 (Room A): 140,250 -> 340,250 -> 340,150 -> 500,150 -> 620,150 -> 620,250 -> 140,250
        const d = progress * 1000;
        if (d <= 200) return { x: 140 + d, y: 250, visible: true };
        if (d <= 300) return { x: 340, y: 250 - (d - 200), visible: true };
        if (d <= 460) return { x: 340 + (d - 300), y: 150, visible: circuitState.isBulb1Installed };
        if (d <= 580) return { x: 500 + (d - 460), y: 150, visible: circuitState.isBulb1Installed };
        if (d <= 680) return { x: 620, y: 150 + (d - 580), visible: circuitState.isBulb1Installed };
        return { x: 620 - (d - 680) * 0.8, y: 250 + (d - 680) * 0.25, visible: true };
      } else {
        // Branch 2 (Room B): 140,250 -> 340,250 -> 340,350 -> 500,350 -> 620,350 -> 620,250 -> 140,250
        const d = progress * 1000;
        if (d <= 200) return { x: 140 + d, y: 250, visible: true };
        if (d <= 300) return { x: 340, y: 250 + (d - 200), visible: true };
        if (d <= 460) return { x: 340 + (d - 300), y: 350, visible: circuitState.isBulb2Installed };
        if (d <= 580) return { x: 500 + (d - 460), y: 350, visible: circuitState.isBulb2Installed };
        if (d <= 680) return { x: 620, y: 350 - (d - 580), visible: circuitState.isBulb2Installed };
        return { x: 620 - (d - 680) * 0.8, y: 250 + (d - 680) * 0.25, visible: true };
      }
    }

    return { x: 140, y: 250, visible: false };
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
          <div>Topology: <span className="font-mono font-bold uppercase text-amber-400">{circuitState.circuitType}</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Current: <span className="font-mono font-bold text-emerald-400">{circuitState.current} A</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Req: <span className="font-mono font-bold text-sky-400">{circuitState.totalResistance} Ω</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
          PHYSICAL ENGINEERING WORKBENCH
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Diagnostic Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          circuitState.diagnostic === 'ACTIVE'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : circuitState.diagnostic === 'FAULT'
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          {circuitState.statusText}
        </div>
      </div>
    </div>
  );
};
