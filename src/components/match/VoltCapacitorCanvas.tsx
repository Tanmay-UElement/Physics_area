'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltCapacitorRoundData, evaluateVoltCapacitorSubmission } from '@/lib/physics/voltCapacitorRace';
import { RoundResult } from '@/lib/physics/types';

interface VoltCapacitorCanvasProps {
  round: VoltCapacitorRoundData;
  userTime: number;
  isSimulating: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
}

export const VoltCapacitorCanvas: React.FC<VoltCapacitorCanvasProps> = ({
  round,
  userTime,
  isSimulating,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // References to dynamic graphics elements for 60fps ticker animation
  const positiveChargesRef = useRef<PIXI.Graphics[]>([]);
  const negativeChargesRef = useRef<PIXI.Graphics[]>([]);
  const eFieldLinesRef = useRef<PIXI.Graphics | null>(null);
  const crtSweepDotRef = useRef<PIXI.Graphics | null>(null);
  const crtWaveGfxRef = useRef<PIXI.Graphics | null>(null);
  const sparkContainerRef = useRef<PIXI.Container | null>(null);
  const digitalVoltmeterTextRef = useRef<PIXI.Text | null>(null);

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

      // 1. Tech Grid
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      drawGrid(gridGfx, width, height);

      // 2. Spark Container
      const sparkContainer = new PIXI.Container();
      app.stage.addChild(sparkContainer);
      sparkContainerRef.current = sparkContainer;

      // 3. Real Electrolytic Capacitor Hardware Component (Left Side, x = 220)
      drawRealCapacitorHardware(app.stage, round);

      // 4. Bench Oscilloscope CRT Display Screen (Right Side, x = 540)
      drawOscilloscopeBench(app.stage, round);

      // 5. Digital Voltmeter Headup Display
      const vmText = new PIXI.Text({
        text: '0.00 V',
        style: { fontSize: 24, fill: 0x34d399, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      vmText.x = 220;
      vmText.y = 425;
      vmText.anchor.set(0.5);
      app.stage.addChild(vmText);
      digitalVoltmeterTextRef.current = vmText;
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

  const drawGrid = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.4 });
    for (let x = 0; x < width; x += 30) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 30) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  /**
   * Renders realistic 3D Electrolytic Can Capacitor with Internal Cutaway Plate Window
   */
  const drawRealCapacitorHardware = (stage: PIXI.Container, data: VoltCapacitorRoundData) => {
    const container = new PIXI.Container();
    container.x = 220;
    container.y = 230;

    const gfx = new PIXI.Graphics();

    // 1. Metal Connecting Wire Leads (Top + / Bottom -)
    gfx.setStrokeStyle({ width: 6, color: 0x94a3b8 }); // Silver lead wire
    gfx.moveTo(0, -180).lineTo(0, -110).stroke(); // Top anode lead (+)
    gfx.moveTo(0, 110).lineTo(0, 180).stroke(); // Bottom cathode lead (-)

    // Lead Terminals
    gfx.circle(0, -180, 8).fill({ color: 0x38bdf8 });
    gfx.circle(0, 180, 8).fill({ color: 0xef4444 });

    // 2. Cylindrical Can Body (Blue Vinyl Sleeve Aesthetic)
    gfx.rect(-85, -110, 170, 220).fill({ color: 0x1e3a8a }); // Dark blue electrolytic sleeve
    gfx.rect(-85, -110, 170, 220).stroke({ width: 4, color: 0x3b82f6 });

    // Silver Aluminum Top Cap
    gfx.rect(-85, -110, 170, 20).fill({ color: 0xcbd5e1 });
    gfx.moveTo(-30, -100).lineTo(30, -100).stroke({ width: 2, color: 0x64748b }); // Safety Vent Slit

    // Polarity Negative Stripe (Standard capacitor black stripe on right)
    gfx.rect(55, -110, 30, 220).fill({ color: 0x0f172a });
    const minusText = new PIXI.Text({
      text: '- - -',
      style: { fontSize: 16, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    minusText.rotation = Math.PI / 2;
    minusText.x = 72;
    minusText.y = -60;
    container.addChild(minusText);

    // Stamped Rating Label
    const stampText = new PIXI.Text({
      text: `${data.capacitance}μF\n${data.sourceVoltage}V MAX`,
      style: { fontSize: 12, fill: 0xfacc15, fontWeight: 'bold', fontFamily: 'monospace', align: 'center' },
    });
    stampText.anchor.set(0.5);
    stampText.x = -25;
    stampText.y = -65;
    container.addChild(stampText);

    // 3. INTERNAL CUTAWAY WINDOW (Revealing Dielectric Parallel Plates)
    gfx.rect(-70, -10, 140, 100).fill({ color: 0x030712 }); // Dark inspection window
    gfx.rect(-70, -10, 140, 100).stroke({ width: 2, color: 0x38bdf8 });

    // Top Anode Plate (+ Cyan)
    gfx.rect(-60, 5, 120, 10).fill({ color: 0x0284c7 });
    gfx.rect(-60, 5, 120, 10).stroke({ width: 1.5, color: 0x38bdf8 });

    // Bottom Cathode Plate (- Pink)
    gfx.rect(-60, 75, 120, 10).fill({ color: 0xbe185d });
    gfx.rect(-60, 75, 120, 10).stroke({ width: 1.5, color: 0xf43f5e });

    container.addChild(gfx);

    // Dynamic Electric Field Lines Layer inside inspection window
    const eFieldGfx = new PIXI.Graphics();
    container.addChild(eFieldGfx);
    eFieldLinesRef.current = eFieldGfx;

    // Build Charge Particles Arrays (+ on top plate, - on bottom plate)
    positiveChargesRef.current = [];
    negativeChargesRef.current = [];

    for (let i = 0; i < 8; i++) {
      const pGfx = new PIXI.Graphics();
      pGfx.circle(0, 0, 4).fill({ color: 0x38bdf8 });
      pGfx.x = -50 + i * 14;
      pGfx.y = 10;
      pGfx.alpha = 0; // Starts invisible, fades in during charging
      container.addChild(pGfx);
      positiveChargesRef.current.push(pGfx);

      const nGfx = new PIXI.Graphics();
      nGfx.circle(0, 0, 4).fill({ color: 0xf43f5e });
      nGfx.x = -50 + i * 14;
      nGfx.y = 80;
      nGfx.alpha = 0;
      container.addChild(nGfx);
      negativeChargesRef.current.push(nGfx);
    }

    stage.addChild(container);
  };

  /**
   * Renders Retro Bench CRT Oscilloscope Screen
   */
  const drawOscilloscopeBench = (stage: PIXI.Container, data: VoltCapacitorRoundData) => {
    const container = new PIXI.Container();
    container.x = 560;
    container.y = 230;

    const gfx = new PIXI.Graphics();

    // Metallic Bench Instrument Chassis
    gfx.rect(-170, -150, 340, 300).fill({ color: 0x0f172a });
    gfx.rect(-170, -150, 340, 300).stroke({ width: 4, color: 0x334155 });

    // Phosphor CRT Screen
    gfx.rect(-150, -130, 300, 240).fill({ color: 0x022c22 }); // Dark green phosphor
    gfx.rect(-150, -130, 300, 240).stroke({ width: 3, color: 0x10b981 });

    // CRT Phosphor Grid Lines
    gfx.setStrokeStyle({ width: 1, color: 0x059669, alpha: 0.35 });
    for (let x = -150; x <= 150; x += 30) gfx.moveTo(x, -130).lineTo(x, 110);
    for (let y = -130; y <= 110; y += 24) gfx.moveTo(-150, y).lineTo(150, y);
    gfx.stroke();

    // Target Voltage Threshold Dotted Line (Yellow)
    const targetY = 110 - ((data.targetVoltage / data.sourceVoltage) * 220);
    gfx.moveTo(-150, targetY).lineTo(150, targetY).stroke({ width: 2, color: 0xfacc15 });

    // Target Line Label
    const txt = new PIXI.Text({
      text: `TARGET: ${data.targetVoltage}V`,
      style: { fontSize: 10, fill: 0xfacc15, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.x = 50;
    txt.y = targetY - 14;
    container.addChild(txt);

    container.addChild(gfx);

    // Live Curve Plot Waveform Graphics Layer
    const waveGfx = new PIXI.Graphics();
    container.addChild(waveGfx);
    crtWaveGfxRef.current = waveGfx;

    // Glowing CRT Sweep Beam Electron Dot
    const sweepDot = new PIXI.Graphics();
    sweepDot.circle(0, 0, 6).fill({ color: 0x34d399 });
    sweepDot.circle(0, 0, 10).fill({ color: 0x6ee7b7, alpha: 0.5 });
    sweepDot.x = -150;
    sweepDot.y = 110;
    container.addChild(sweepDot);
    crtSweepDotRef.current = sweepDot;

    stage.addChild(container);
  };

  /**
   * Triggers realistic electrical spark discharge arcs
   */
  const triggerCapacitorSparks = (x: number, y: number) => {
    if (!sparkContainerRef.current) return;
    sparkContainerRef.current.removeChildren();

    for (let i = 0; i < 30; i++) {
      const spark = new PIXI.Graphics();
      const isCyan = Math.random() > 0.5;
      spark.circle(0, 0, 3 + Math.random() * 4).fill({ color: isCyan ? 0x38bdf8 : 0xfacc15 });
      spark.x = x;
      spark.y = y;
      sparkContainerRef.current.addChild(spark);

      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90;

      gsap.to(spark, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 0.7 + Math.random() * 0.5,
        ease: 'power2.out',
      });
    }
  };

  // REAL-TIME CHARGING SIMULATION ENGINE (60 FPS REALTIME SWEEP & CHARGE BUILDUP)
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltCapacitorSubmission(round.correctTime, userTime);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userTime,
        correctVelocity: round.correctTime,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userTime,
        targetX: round.correctTime,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      const totalSimDuration = Math.max(1.0, Math.min(4.0, userTime));
      const stateObj = { progress: 0 };

      gsap.to(stateObj, {
        progress: 1,
        duration: totalSimDuration,
        ease: 'none',
        onUpdate: () => {
          const currentSimTime = stateObj.progress * userTime;
          const currentVolts = round.sourceVoltage * (1 - Math.exp(-currentSimTime / (round.timeConstant || 1.0)));

          // 1. Update Digital Voltmeter Text
          if (digitalVoltmeterTextRef.current) {
            digitalVoltmeterTextRef.current.text = `${currentVolts.toFixed(2)} V`;
          }

          // 2. Accumulate Positive & Negative Charges on Internal Capacitor Plates
          const chargeRatio = Math.min(1.0, currentVolts / round.sourceVoltage);
          const activeCount = Math.floor(chargeRatio * positiveChargesRef.current.length);

          positiveChargesRef.current.forEach((p, idx) => {
            p.alpha = idx <= activeCount ? 1 : 0;
          });
          negativeChargesRef.current.forEach((n, idx) => {
            n.alpha = idx <= activeCount ? 1 : 0;
          });

          // 3. Draw Strengthening Electrostatic E-field lines
          if (eFieldLinesRef.current) {
            eFieldLinesRef.current.clear();
            eFieldLinesRef.current.setStrokeStyle({ width: 2, color: 0xec4899, alpha: chargeRatio * 0.8 });
            for (let x = -50; x <= 50; x += 14) {
              eFieldLinesRef.current.moveTo(x, 15).lineTo(x, 75);
            }
            eFieldLinesRef.current.stroke();
          }

          // 4. Sweep CRT Oscilloscope Beam & Plot Live Exponential Waveform
          if (crtSweepDotRef.current && crtWaveGfxRef.current) {
            const sweepX = -150 + stateObj.progress * 300;
            const sweepY = 110 - (currentVolts / round.sourceVoltage) * 220;

            crtSweepDotRef.current.x = sweepX;
            crtSweepDotRef.current.y = sweepY;

            crtWaveGfxRef.current.clear();
            crtWaveGfxRef.current.setStrokeStyle({ width: 3, color: 0x34d399 });
            crtWaveGfxRef.current.moveTo(-150, 110);

            for (let px = -150; px <= sweepX; px += 5) {
              const pRatio = (px + 150) / 300;
              const pTime = pRatio * userTime;
              const pVolts = round.sourceVoltage * (1 - Math.exp(-pTime / (round.timeConstant || 1.0)));
              const py = 110 - (pVolts / round.sourceVoltage) * 220;
              crtWaveGfxRef.current.lineTo(px, py);
            }
            crtWaveGfxRef.current.stroke();
          }
        },
        onComplete: () => {
          // Trigger Terminal Discharge Arc Spark Flash
          triggerCapacitorSparks(220, 50);

          if (evalRes.tier === 'hit') {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          }
          onSimulationComplete(roundResult);
        },
      });
    }
  }, [isSimulating]);

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Telemetry Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>Capacitor C: <span className="font-mono font-bold text-pink-400">{round.capacitance} μF</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Resistor R: <span className="font-mono font-bold text-sky-400">{round.resistance} kΩ</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Target Voltage: <span className="font-mono font-bold text-amber-400">{round.targetVoltage} V</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>Charge Time t: <span className="font-mono font-bold text-emerald-400">{userTime} s</span></div>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-pink-500/30 text-pink-400 text-xs font-mono font-bold">
          3D ELECTROLYTIC CAPACITOR ENGINE
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Live Electrolytic Can: Watch charges accumulate on internal plates & CRT beam sweep in real time!
        </div>
      </div>
    </div>
  );
};
