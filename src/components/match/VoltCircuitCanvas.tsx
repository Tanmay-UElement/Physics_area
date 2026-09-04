'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltCircuitRoundData, evaluateVoltCircuitSubmission } from '@/lib/physics/voltCircuitBuilder';
import { RoundResult } from '@/lib/physics/types';

interface VoltCircuitCanvasProps {
  round: VoltCircuitRoundData;
  userResistance: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltCircuitCanvas: React.FC<VoltCircuitCanvasProps> = ({
  round,
  userResistance,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const breakerLeverRef = useRef<PIXI.Graphics | null>(null);
  const ledGfxRef = useRef<PIXI.Graphics | null>(null);
  const ledGlowRef = useRef<PIXI.Graphics | null>(null);
  const sparkContainerRef = useRef<PIXI.Container | null>(null);
  const electronParticlesRef = useRef<{ gfx: PIXI.Graphics; progress: number; speed: number }[]>([]);

  const isLight = theme === 'light';

  // Circuit Loop Path Waypoints (Rectangular Loop: 180, 120 -> 620, 120 -> 620, 380 -> 180, 380 -> 180, 120)
  const LOOP_POINTS = [
    { x: 180, y: 120 },
    { x: 620, y: 120 },
    { x: 620, y: 380 },
    { x: 180, y: 380 },
  ];

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
        backgroundColor: isLight ? 0x0f172a : 0x030712, // PCB Board dark background
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

      // 1. Tech PCB Grid Background
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawPCBGrid(gridGfx, width, height, isLight);

      // 2. Copper Traces & Bus Lines
      const pcbGfx = new PIXI.Graphics();
      drawPCBTraces(pcbGfx, isLight);
      app.stage.addChild(pcbGfx);

      // 3. DC Power Battery Pack (Left)
      drawBatteryPack(app.stage, isLight, round.voltage);

      // 4. Resistor Component Slot (Top)
      drawResistorSlot(app.stage, isLight, userResistance);

      // 5. Mechanical Circuit Breaker Box (Bottom)
      const breakerLever = drawCircuitBreakerBox(app.stage, isLight, round.maxSafeCurrent);
      breakerLeverRef.current = breakerLever;

      // 6. Realistic LED Diode Bulb with Bloom Glow (Right)
      const { bulb, glow } = drawLEDBulb(app.stage, isLight);
      ledGfxRef.current = bulb;
      ledGlowRef.current = glow;

      // 7. Spark Particles Container for Fuse Trips
      const sparkContainer = new PIXI.Container();
      app.stage.addChild(sparkContainer);
      sparkContainerRef.current = sparkContainer;

      // 8. Continuous Electron Current Stream Particles
      electronParticlesRef.current = [];
      const calculatedCurrent = round.voltage / (userResistance || 1);
      const baseSpeed = Math.min(0.008, Math.max(0.001, calculatedCurrent * 0.0015));

      for (let i = 0; i < 20; i++) {
        const pGfx = new PIXI.Graphics();
        pGfx.circle(0, 0, 5).fill({ color: 0x38bdf8 });
        pGfx.circle(0, 0, 8).fill({ color: 0x0284c7, alpha: 0.4 });
        app.stage.addChild(pGfx);
        electronParticlesRef.current.push({
          gfx: pGfx,
          progress: i / 20,
          speed: baseSpeed,
        });
      }

      // Ticker for smooth 60fps electron flow along loop
      app.ticker.add(() => {
        electronParticlesRef.current.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const pos = getLoopPoint(p.progress);
          p.gfx.x = pos.x;
          p.gfx.y = pos.y;
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
  }, [round.id, isLight]);

  // Helper to interpolate along rectangular loop
  const getLoopPoint = (progress: number) => {
    // Total perimeter = 440 + 260 + 440 + 260 = 1400 px
    const dist = progress * 1400;
    if (dist <= 440) {
      return { x: 180 + dist, y: 120 };
    } else if (dist <= 700) {
      return { x: 620, y: 120 + (dist - 440) };
    } else if (dist <= 1140) {
      return { x: 620 - (dist - 700), y: 380 };
    } else {
      return { x: 180, y: 380 - (dist - 1140) };
    }
  };

  const drawPCBGrid = (gfx: PIXI.Graphics, width: number, height: number, lightMode: boolean) => {
    gfx.clear();
    const gridColor = lightMode ? 0x334155 : 0x1e293b;
    gfx.setStrokeStyle({ width: 1, color: gridColor, alpha: 0.3 });
    for (let x = 0; x < width; x += 30) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 30) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  const drawPCBTraces = (gfx: PIXI.Graphics, lightMode: boolean) => {
    gfx.clear();

    // Metallic Copper Traces
    gfx.setStrokeStyle({ width: 8, color: 0xb45309, alpha: 0.6 }); // Outer copper shadow
    gfx.moveTo(180, 120).lineTo(620, 120).lineTo(620, 380).lineTo(180, 380).lineTo(180, 120).stroke();

    gfx.setStrokeStyle({ width: 4, color: 0x38bdf8 }); // Inner neon cyan active line
    gfx.moveTo(180, 120).lineTo(620, 120).lineTo(620, 380).lineTo(180, 380).lineTo(180, 120).stroke();

    // Solder Joint Pads at corners
    const corners = [
      { x: 180, y: 120 },
      { x: 620, y: 120 },
      { x: 620, y: 380 },
      { x: 180, y: 380 },
    ];
    corners.forEach((c) => {
      gfx.circle(c.x, c.y, 10).fill({ color: 0xf59e0b });
      gfx.circle(c.x, c.y, 5).fill({ color: 0xffffff });
    });
  };

  const drawBatteryPack = (stage: PIXI.Container, lightMode: boolean, voltage: number) => {
    const container = new PIXI.Container();
    container.x = 180;
    container.y = 250;

    const gfx = new PIXI.Graphics();
    // Metal Casing
    gfx.rect(-40, -40, 80, 80).fill({ color: 0x0f172a });
    gfx.rect(-40, -40, 80, 80).stroke({ width: 3, color: 0x38bdf8 });
    gfx.rect(-32, -32, 64, 64).fill({ color: 0x1e293b });

    // Battery Terminal Indicators
    gfx.rect(-10, -50, 20, 10).fill({ color: 0xef4444 }); // Positive + terminal

    const txt = new PIXI.Text({
      text: `${voltage}V DC`,
      style: { fontSize: 12, fill: 0x38bdf8, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);
  };

  const drawResistorSlot = (stage: PIXI.Container, lightMode: boolean, userR: number) => {
    const container = new PIXI.Container();
    container.x = 400;
    container.y = 120;

    const gfx = new PIXI.Graphics();
    // Ceramic Resistor Body (Zig-zag / Stripe pattern)
    gfx.rect(-60, -20, 120, 40).fill({ color: 0xd97706 });
    gfx.rect(-60, -20, 120, 40).stroke({ width: 3, color: 0xfef08a });

    // Color Bands (Standard Resistor Stripes: Gold, Red, Violet)
    gfx.rect(-40, -20, 10, 40).fill({ color: 0xef4444 });
    gfx.rect(-15, -20, 10, 40).fill({ color: 0x3b82f6 });
    gfx.rect(10, -20, 10, 40).fill({ color: 0x10b981 });
    gfx.rect(35, -20, 10, 40).fill({ color: 0xeab308 });

    const txt = new PIXI.Text({
      text: `R = ${userR} Ω`,
      style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5, 2.2);

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);
  };

  const drawCircuitBreakerBox = (stage: PIXI.Container, lightMode: boolean, maxCurrent: number) => {
    const container = new PIXI.Container();
    container.x = 400;
    container.y = 380;

    const gfx = new PIXI.Graphics();
    // Industrial Circuit Breaker Housing
    gfx.rect(-70, -25, 140, 50).fill({ color: 0x1e293b });
    gfx.rect(-70, -25, 140, 50).stroke({ width: 3, color: 0xef4444 });

    // Label
    const txt = new PIXI.Text({
      text: `BREAKER (MAX ${maxCurrent}A)`,
      style: { fontSize: 9, fill: 0xfca5a5, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5, -2.4);
    container.addChild(txt);

    // Mechanical Toggle Lever
    const lever = new PIXI.Graphics();
    lever.rect(-10, -18, 20, 36).fill({ color: 0xef4444 });
    lever.rect(-10, -18, 20, 36).stroke({ width: 2, color: 0xffffff });
    container.addChild(gfx);
    container.addChild(lever);

    stage.addChild(container);
    return lever;
  };

  const drawLEDBulb = (stage: PIXI.Container, lightMode: boolean) => {
    const container = new PIXI.Container();
    container.x = 620;
    container.y = 250;

    // Glowing Radial Halo Layer
    const glow = new PIXI.Graphics();
    glow.circle(0, 0, 50).fill({ color: 0x10b981, alpha: 0.0 });
    container.addChild(glow);

    // Glass Bulb Diode
    const bulb = new PIXI.Graphics();
    bulb.circle(0, 0, 24).fill({ color: 0x059669, alpha: 0.4 });
    bulb.circle(0, 0, 24).stroke({ width: 3, color: 0x6ee7b7 });

    // Filament Coils
    bulb.moveTo(-10, 10).lineTo(0, -10).lineTo(10, 10).stroke({ width: 2, color: 0xfef08a });

    const txt = new PIXI.Text({
      text: `LED LOAD`,
      style: { fontSize: 10, fill: 0x6ee7b7, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5, -1.8);

    container.addChild(bulb);
    container.addChild(txt);
    stage.addChild(container);

    return { bulb, glow };
  };

  // Spark burst animation for breaker trip or live power-on
  const triggerElectricSparks = (x: number, y: number) => {
    if (!sparkContainerRef.current) return;
    sparkContainerRef.current.removeChildren();

    for (let i = 0; i < 25; i++) {
      const spark = new PIXI.Graphics();
      const isBlue = Math.random() > 0.5;
      spark.circle(0, 0, 3 + Math.random() * 3).fill({ color: isBlue ? 0x38bdf8 : 0xfacc15 });
      spark.x = x;
      spark.y = y;
      sparkContainerRef.current.addChild(spark);

      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;

      gsap.to(spark, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 0.6 + Math.random() * 0.4,
        ease: 'power2.out',
      });
    }
  };

  // Simulation Trigger: Breaker flip, current pulse, sparks & LED bloom!
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltCircuitSubmission(round.correctResistance, userResistance);
      const calculatedCurrent = round.voltage / (userResistance || 1);
      const isOverloaded = calculatedCurrent > round.maxSafeCurrent;

      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userResistance,
        correctVelocity: round.correctResistance,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userResistance,
        targetX: round.correctResistance,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      // Increase electron flow speed proportionally to current
      const flowSpeed = Math.min(0.025, Math.max(0.002, calculatedCurrent * 0.003));
      electronParticlesRef.current.forEach((p) => {
        p.speed = flowSpeed;
      });

      // 1. Animate Breaker Lever Flip
      if (breakerLeverRef.current) {
        gsap.to(breakerLeverRef.current, {
          rotation: isOverloaded ? Math.PI / 4 : 0,
          duration: 0.3,
          ease: 'bounce.out',
          onComplete: () => {
            // Trigger sparks at breaker box
            triggerElectricSparks(400, 380);

            if (isOverloaded) {
              // Breaker tripped! Cut flow speed
              electronParticlesRef.current.forEach((p) => (p.speed = 0));
            }
          },
        });
      }

      // 2. Animate LED Bulb Glow & Radial Bloom
      if (ledGlowRef.current && ledGfxRef.current) {
        if (evalRes.tier === 'hit') {
          // Bullseye Glow! Bright Emerald/Cyan Radial Halo
          gsap.to(ledGlowRef.current, {
            alpha: 0.8,
            scale: 1.6,
            duration: 0.8,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
              confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
              onSimulationComplete(roundResult);
            },
          });
        } else {
          // Dim or popped fuse state
          gsap.to(ledGlowRef.current, {
            alpha: isOverloaded ? 0.0 : 0.2,
            duration: 0.8,
            onComplete: () => {
              onSimulationComplete(roundResult);
            },
          });
        }
      }
    }
  }, [isSimulating]);

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Circuit Telemetry Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>Source Voltage: <span className="font-mono font-bold text-sky-400">{round.voltage} V</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Target Current: <span className="font-mono font-bold text-emerald-400">{round.targetCurrent} A</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Max Fuse Breaker: <span className="font-mono font-bold text-red-400">{round.maxSafeCurrent} A</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
          PCB CIRCUIT BREAKER ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Live PCB: Calculate R = V / I to stream electron current without tripping fuse breaker!
        </div>
      </div>
    </div>
  );
};
