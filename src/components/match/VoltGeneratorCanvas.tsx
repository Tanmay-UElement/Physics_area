'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { VoltGeneratorRoundData, evaluateVoltGeneratorSubmission, calculateInducedEMF } from '@/lib/physics/voltGeneratorCrank';
import { RoundResult } from '@/lib/physics/types';

interface VoltGeneratorCanvasProps {
  round: VoltGeneratorRoundData;
  userRPM: number;
  isSimulating: boolean;
  isCranking: boolean;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
  onRPMChange?: (rpm: number) => void;
}

export const VoltGeneratorCanvas: React.FC<VoltGeneratorCanvasProps> = ({
  round,
  userRPM,
  isSimulating,
  isCranking,
  theme,
  onSimulationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // References for live 60fps rotation & particle animation
  const magnetContainerRef = useRef<PIXI.Container | null>(null);
  const crankArmRef = useRef<PIXI.Graphics | null>(null);
  const bulbGlowRef = useRef<PIXI.Graphics | null>(null);
  const bulbFilamentRef = useRef<PIXI.Graphics | null>(null);
  const fluxLinesGfxRef = useRef<PIXI.Graphics | null>(null);
  const electronParticlesRef = useRef<{ gfx: PIXI.Graphics; progress: number }[]>([]);

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
        backgroundColor: isLight ? 0x0f172a : 0x070b14,
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
      drawGrid(gridGfx, width, height);

      // 2. Connecting Power Transmission Wires
      const wireGfx = new PIXI.Graphics();
      drawTransmissionWires(wireGfx);
      app.stage.addChild(wireGfx);

      // 3. Mechanical Crank Wheel (Left, x = 200, y = 260)
      const crankArm = drawMechanicalCrank(app.stage);
      crankArmRef.current = crankArm;

      // 4. Concentric Copper Coil Rings & Magnet Rotor (Center, x = 430, y = 260)
      const { magnetContainer, fluxGfx } = drawCoilsAndMagnetRotor(app.stage);
      magnetContainerRef.current = magnetContainer;
      fluxLinesGfxRef.current = fluxGfx;

      // 5. Output Light Bulb (Right, x = 660, y = 260)
      const { bulbGlow, bulbFilament } = drawLightBulb(app.stage);
      bulbGlowRef.current = bulbGlow;
      bulbFilamentRef.current = bulbFilament;

      // 6. Induced Current Electron Stream Particles along right wire (430 -> 660)
      electronParticlesRef.current = [];
      for (let i = 0; i < 12; i++) {
        const pGfx = new PIXI.Graphics();
        pGfx.circle(0, 0, 4).fill({ color: 0x38bdf8 });
        pGfx.circle(0, 0, 7).fill({ color: 0x67e8f9, alpha: 0.5 });
        app.stage.addChild(pGfx);
        electronParticlesRef.current.push({
          gfx: pGfx,
          progress: i / 12,
        });
      }

      // 7. 60 FPS CONTINUOUS ROTATION TICKER
      let angle = 0;
      app.ticker.add(() => {
        const activeRPM = isCranking || isSimulating ? userRPM : 0;

        if (activeRPM > 0) {
          // Angular velocity delta rad/frame = (RPM * 2pi) / (60 * 60)
          const deltaRad = (activeRPM * Math.PI * 2) / 3600;
          angle += deltaRad;

          // Rotate magnet rotor
          if (magnetContainerRef.current) {
            magnetContainerRef.current.rotation = angle;
          }

          // Rotate mechanical crank handle
          if (crankArmRef.current) {
            crankArmRef.current.rotation = angle;
          }

          // Render dynamic magnetic flux lines
          if (fluxLinesGfxRef.current) {
            drawMagneticFluxLines(fluxLinesGfxRef.current, angle);
          }

          // Advance electron flow particles along wire (430 -> 660)
          const speed = (activeRPM / 300) * 0.03;
          electronParticlesRef.current.forEach((p) => {
            p.progress = (p.progress + speed) % 1;
            const px = 430 + p.progress * 230;
            p.gfx.x = px;
            p.gfx.y = 260;
            p.gfx.alpha = 0.9;
          });

          // Calculate current EMF and update bulb glow brightness
          const currentEMF = calculateInducedEMF(round.numberOfTurns, round.magneticFieldB, round.coilAreaA, activeRPM);
          const brightnessRatio = Math.min(1.0, currentEMF / round.targetVoltage);

          if (bulbGlowRef.current) {
            bulbGlowRef.current.alpha = brightnessRatio * 0.9;
            bulbGlowRef.current.scale.set(0.8 + brightnessRatio * 0.6);
          }
        } else {
          // Stopped generator state
          electronParticlesRef.current.forEach((p) => (p.gfx.alpha = 0));
          if (bulbGlowRef.current) bulbGlowRef.current.alpha = 0;
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
  }, [round.id, isLight, isCranking]);

  const drawGrid = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.35 });
    for (let x = 0; x < width; x += 30) gfx.moveTo(x, 0).lineTo(x, height);
    for (let y = 0; y < height; y += 30) gfx.moveTo(0, y).lineTo(width, y);
    gfx.stroke();
  };

  const drawTransmissionWires = (gfx: PIXI.Graphics) => {
    gfx.clear();
    // Wire 1: Crank (200, 260) to Copper Coil (430, 260)
    gfx.setStrokeStyle({ width: 5, color: 0x475569 });
    gfx.moveTo(200, 260).lineTo(430, 260).stroke();

    // Wire 2: Copper Coil (430, 260) to Light Bulb (660, 260)
    gfx.setStrokeStyle({ width: 6, color: 0x0284c7 });
    gfx.moveTo(430, 260).lineTo(660, 260).stroke();
    gfx.setStrokeStyle({ width: 2, color: 0x38bdf8 });
    gfx.moveTo(430, 260).lineTo(660, 260).stroke();
  };

  /**
   * Mechanical Crank Wheel (Left, x = 200, y = 260)
   */
  const drawMechanicalCrank = (stage: PIXI.Container) => {
    const container = new PIXI.Container();
    container.x = 200;
    container.y = 260;

    const gfx = new PIXI.Graphics();
    // Outer Circular Housing
    gfx.circle(0, 0, 50).fill({ color: 0x0f172a });
    gfx.circle(0, 0, 50).stroke({ width: 3, color: 0x475569 });

    // Inner axle hub
    gfx.circle(0, 0, 16).fill({ color: 0x334155 });
    gfx.circle(0, 0, 16).stroke({ width: 2, color: 0x94a3b8 });

    container.addChild(gfx);

    // Rotating Crank Arm Handle
    const crankArm = new PIXI.Graphics();
    crankArm.rect(-6, -6, 45, 12).fill({ color: 0x94a3b8 });
    crankArm.rect(-6, -6, 45, 12).stroke({ width: 1.5, color: 0xf8fafc });
    crankArm.circle(35, 0, 10).fill({ color: 0xf59e0b }); // Yellow handle knob
    crankArm.circle(35, 0, 10).stroke({ width: 2, color: 0xfef08a });
    container.addChild(crankArm);

    // Text Label below
    const label = new PIXI.Text({
      text: 'CRANK',
      style: { fontSize: 11, fill: 0x94a3b8, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5, -6.0);
    container.addChild(label);

    stage.addChild(container);
    return crankArm;
  };

  /**
   * Copper Coil Rings & Central Rotating Bar Magnet (Center, x = 430, y = 260)
   */
  const drawCoilsAndMagnetRotor = (stage: PIXI.Container) => {
    const container = new PIXI.Container();
    container.x = 430;
    container.y = 260;

    const gfx = new PIXI.Graphics();

    // Outer Concentric Amber Copper Coil Ring 1
    gfx.circle(0, 0, 85).stroke({ width: 10, color: 0xd97706, alpha: 0.9 });
    gfx.circle(0, 0, 85).stroke({ width: 3, color: 0xfef08a, alpha: 0.9 });

    // Inner Concentric Amber Copper Coil Ring 2
    gfx.circle(0, 0, 65).stroke({ width: 8, color: 0xb45309, alpha: 0.9 });
    gfx.circle(0, 0, 65).stroke({ width: 2, color: 0xfcd34d, alpha: 0.9 });

    container.addChild(gfx);

    // Magnetic Flux Lines Layer
    const fluxGfx = new PIXI.Graphics();
    container.addChild(fluxGfx);

    // Rotating Bar Magnet Container
    const magnetContainer = new PIXI.Container();

    const mGfx = new PIXI.Graphics();
    // South Pole (Blue S)
    mGfx.rect(-50, -18, 50, 36).fill({ color: 0x0284c7 });
    mGfx.rect(-50, -18, 50, 36).stroke({ width: 2, color: 0x38bdf8 });

    // North Pole (Red N)
    mGfx.rect(0, -18, 50, 36).fill({ color: 0xd97706 }); // Red/Orange
    mGfx.rect(0, -18, 50, 36).stroke({ width: 2, color: 0xfca5a5 });

    const txtS = new PIXI.Text({
      text: 'S',
      style: { fontSize: 16, fill: 0xffffff, fontWeight: '900', fontFamily: 'monospace' },
    });
    txtS.anchor.set(0.5);
    txtS.x = -25;

    const txtN = new PIXI.Text({
      text: 'N',
      style: { fontSize: 16, fill: 0xffffff, fontWeight: '900', fontFamily: 'monospace' },
    });
    txtN.anchor.set(0.5);
    txtN.x = 25;

    magnetContainer.addChild(mGfx);
    magnetContainer.addChild(txtS);
    magnetContainer.addChild(txtN);
    container.addChild(magnetContainer);

    // Text Label below
    const label = new PIXI.Text({
      text: 'COPPER COIL',
      style: { fontSize: 11, fill: 0xd97706, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5, -9.5);
    container.addChild(label);

    stage.addChild(container);
    return { magnetContainer, fluxGfx };
  };

  /**
   * Draws dynamic magnetic flux lines radiating from spinning magnet
   */
  const drawMagneticFluxLines = (gfx: PIXI.Graphics, angle: number) => {
    gfx.clear();
    gfx.setStrokeStyle({ width: 1.5, color: 0x38bdf8, alpha: 0.35 });

    for (let offset = -40; offset <= 40; offset += 20) {
      if (offset === 0) continue;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x1 = -45 * cos - offset * sin;
      const y1 = -45 * sin + offset * cos;
      const x2 = 45 * cos - offset * sin;
      const y2 = 45 * sin + offset * cos;

      gfx.moveTo(x1, y1);
      gfx.quadraticCurveTo(0, offset * 1.8, x2, y2);
    }
    gfx.stroke();
  };

  /**
   * Output Light Bulb (Right, x = 660, y = 260)
   */
  const drawLightBulb = (stage: PIXI.Container) => {
    const container = new PIXI.Container();
    container.x = 660;
    container.y = 260;

    // Glowing Radial Light Halo Layer
    const bulbGlow = new PIXI.Graphics();
    bulbGlow.circle(0, 0, 50).fill({ color: 0xfacc15, alpha: 0.0 });
    container.addChild(bulbGlow);

    // Glass Bulb Fixture Body
    const gfx = new PIXI.Graphics();
    gfx.circle(0, 0, 26).fill({ color: 0x1e293b });
    gfx.circle(0, 0, 26).stroke({ width: 3, color: 0x818cf8 });

    // Inner Tungsten Filament Coils
    const bulbFilament = new PIXI.Graphics();
    bulbFilament.moveTo(-10, 10).lineTo(0, -10).lineTo(10, 10).stroke({ width: 2.5, color: 0xfef08a });
    container.addChild(gfx);
    container.addChild(bulbFilament);

    // Text Label below
    const label = new PIXI.Text({
      text: 'BULB',
      style: { fontSize: 11, fill: 0x818cf8, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    label.anchor.set(0.5, -4.5);
    container.addChild(label);

    stage.addChild(container);
    return { bulbGlow, bulbFilament };
  };

  // Simulation Trigger: Evaluate RPM precision & trigger celebratory confetti
  useEffect(() => {
    if (isSimulating) {
      const evalRes = evaluateVoltGeneratorSubmission(round.correctRPM, userRPM);
      const roundResult: RoundResult = {
        roundNumber: round.roundNumber,
        userVelocity: userRPM,
        correctVelocity: round.correctRPM,
        errorPercentage: evalRes.errorPercentage,
        tier: evalRes.tier,
        xpEarned: evalRes.xpEarned,
        actualLandingX: userRPM,
        targetX: round.correctRPM,
        trajectoryPoints: [],
        idealTrajectoryPoints: [],
      };

      gsap.to({}, {
        duration: 2.0,
        onComplete: () => {
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
      {/* Real-World Model Canvas Title Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none space-y-1">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
          REAL-WORLD GENERATOR MODEL
        </span>
        <h3 className="text-sm font-black text-white">
          Mechanical energy → electrical energy
        </h3>
        <p className="text-[11px] text-slate-400 font-mono">
          Mechanical rotation → changing magnetic flux → induced current → light
        </p>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          ⚡ Faraday's Law: Turn crank fast enough to induce ε = -dΦ/dt and power the bulb!
        </div>
      </div>
    </div>
  );
};
