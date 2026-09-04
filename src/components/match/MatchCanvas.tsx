'use client';

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { RoundData, RoundResult } from '@/lib/physics/types';
import { evaluateHorizontalSubmission, generateTrajectoryPoints } from '@/lib/physics/horizontalProjectile';

interface MatchCanvasProps {
  round: RoundData;
  userVelocity: number;
  isSimulating: boolean;
  onSimulationComplete: (result: RoundResult) => void;
  onCanvasLoaded?: () => void;
}

export const MatchCanvas: React.FC<MatchCanvasProps> = ({
  round,
  userVelocity,
  isSimulating,
  onSimulationComplete,
  onCanvasLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const matterEngineRef = useRef<Matter.Engine | null>(null);
  const avatarSpriteRef = useRef<PIXI.Container | null>(null);
  const idleAnimationRef = useRef<gsap.core.Tween | null>(null);
  const trailContainerRef = useRef<PIXI.Container | null>(null);
  const overlayGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulation state refs
  const simStateRef = useRef<{
    active: boolean;
    startTime: number;
    userV: number;
    round: RoundData;
    hasLanded: boolean;
  }>({
    active: false,
    startTime: 0,
    userV: 0,
    round,
    hasLanded: false,
  });

  // Scale constants: 1 meter = 5.5 pixels
  const M2P = 5.5; 
  const ORIGIN_X = 90; // Launcher X
  const GROUND_Y = 440; // Ground level Y

  useEffect(() => {
    let isMounted = true;
    let animFrameId: number;

    const initCanvas = async () => {
      if (!containerRef.current) return;

      // Clear previous canvas if any
      containerRef.current.innerHTML = '';

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 520;

      // 1. Initialize PixiJS Application
      const app = new PIXI.Application();
      await app.init({
        width,
        height,
        backgroundColor: 0x0b0f19,
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

      // 2. Initialize Matter.js Engine
      const engine = Matter.Engine.create({
        gravity: { x: 0, y: 1, scale: 0.001 },
      });
      matterEngineRef.current = engine;

      // 3. Build Static Environment Graphics
      const worldGraphics = new PIXI.Graphics();
      app.stage.addChild(worldGraphics);

      const trailContainer = new PIXI.Container();
      app.stage.addChild(trailContainer);
      trailContainerRef.current = trailContainer;

      const overlayGraphics = new PIXI.Graphics();
      app.stage.addChild(overlayGraphics);
      overlayGraphicsRef.current = overlayGraphics;

      // 4. Create Avatar Sprite Container
      const avatarContainer = new PIXI.Container();
      
      // Avatar Visual: Futuristic Pod / Rider
      const avatarGfx = new PIXI.Graphics();
      // Outer glow pod
      avatarGfx.circle(0, 0, 16).fill({ color: 0x06b6d4, alpha: 0.3 });
      avatarGfx.circle(0, 0, 12).fill({ color: 0x0284c7 });
      // Inner visor
      avatarGfx.rect(-4, -6, 12, 6).fill({ color: 0x38bdf8 });
      // Core crystal
      avatarGfx.circle(-2, 2, 4).fill({ color: 0xf43f5e });

      avatarContainer.addChild(avatarGfx);
      app.stage.addChild(avatarContainer);
      avatarSpriteRef.current = avatarContainer;

      // Position Avatar at Launcher Platform Top
      const platformY = GROUND_Y - round.height * M2P;
      avatarContainer.x = ORIGIN_X;
      avatarContainer.y = platformY - 14;

      // Start Idle Bobbing GSAP
      startIdleBob(avatarContainer, platformY - 14);

      // Render Stage Environment
      renderEnvironment(worldGraphics, round, width, height);

      setIsLoaded(true);
      if (onCanvasLoaded) onCanvasLoaded();

      // Main Animation / Physics Loop
      const tickerLoop = () => {
        if (simStateRef.current.active && !simStateRef.current.hasLanded) {
          const simTime = (performance.now() - simStateRef.current.startTime) / 1000;
          const { userV, round: currentRound } = simStateRef.current;
          const g = currentRound.gravity;

          // Physics exact kinematic trajectory for smooth 60fps sync
          const posX = ORIGIN_X + userV * simTime * M2P;
          const posY = platformY - 14 + 0.5 * g * simTime * simTime * M2P;

          avatarContainer.x = posX;
          avatarContainer.y = posY;

          // Rotation based on velocity vector
          const vY = g * simTime;
          avatarContainer.rotation = Math.atan2(vY, userV);

          // Add trail particle
          const dot = new PIXI.Graphics();
          dot.circle(posX, posY, 2.5).fill({ color: 0x38bdf8, alpha: 0.7 });
          trailContainer.addChild(dot);
          if (trailContainer.children.length > 80) {
            trailContainer.removeChildAt(0);
          }

          // Collision Check with Ground Level
          if (posY >= GROUND_Y - 14) {
            avatarContainer.y = GROUND_Y - 14;
            simStateRef.current.hasLanded = true;
            simStateRef.current.active = false;
            handleLanding(posX, currentRound, userV);
          }
        }
      };

      app.ticker.add(tickerLoop);
    };

    initCanvas();

    return () => {
      isMounted = false;
      if (idleAnimationRef.current) idleAnimationRef.current.kill();
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true });
        pixiAppRef.current = null;
      }
      if (matterEngineRef.current) {
        Matter.Engine.clear(matterEngineRef.current);
        matterEngineRef.current = null;
      }
    };
  }, [round.id]);

  // Handle Idle Bob animation
  const startIdleBob = (container: PIXI.Container, baseY: number) => {
    if (idleAnimationRef.current) idleAnimationRef.current.kill();
    idleAnimationRef.current = gsap.to(container, {
      y: baseY + 4,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  };

  // Re-render world environment whenever round changes
  const renderEnvironment = (
    gfx: PIXI.Graphics,
    currentRound: RoundData,
    width: number,
    height: number
  ) => {
    gfx.clear();

    // 1. Cyber Grid background lines
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b, alpha: 0.5 });
    for (let x = 0; x < width; x += 40) {
      gfx.moveTo(x, 0).lineTo(x, height);
    }
    for (let y = 0; y < height; y += 40) {
      gfx.moveTo(0, y).lineTo(width, y);
    }
    gfx.stroke();

    const platformY = GROUND_Y - currentRound.height * M2P;
    const targetX = ORIGIN_X + currentRound.distance * M2P;

    // 2. Launcher Platform Tower
    gfx.rect(ORIGIN_X - 40, platformY, 40, GROUND_Y - platformY).fill({ color: 0x1e293b });
    gfx.rect(ORIGIN_X - 40, platformY, 40, 8).fill({ color: 0x06b6d4 });
    gfx.setStrokeStyle({ width: 2, color: 0x0ea5e9 });
    gfx.rect(ORIGIN_X - 40, platformY, 40, GROUND_Y - platformY).stroke();

    // Height Label Overlay
    gfx.moveTo(ORIGIN_X - 55, platformY).lineTo(ORIGIN_X - 55, GROUND_Y).stroke({ width: 2, color: 0x38bdf8 });
    gfx.moveTo(ORIGIN_X - 60, platformY).lineTo(ORIGIN_X - 50, platformY).stroke({ width: 2, color: 0x38bdf8 });
    gfx.moveTo(ORIGIN_X - 60, GROUND_Y).lineTo(ORIGIN_X - 50, GROUND_Y).stroke({ width: 2, color: 0x38bdf8 });

    // 3. Ground Terrain
    gfx.rect(0, GROUND_Y, width, height - GROUND_Y).fill({ color: 0x0f172a });
    gfx.rect(0, GROUND_Y, width, 4).fill({ color: 0x334155 });

    // 4. Target Landing Zones
    // Hit zone: +-5% of target distance
    const hitRadius = currentRound.distance * 0.05 * M2P;
    // Close zone: +-15% of target distance
    const closeRadius = currentRound.distance * 0.15 * M2P;

    // Outer Close Zone (Amber)
    gfx.rect(targetX - closeRadius, GROUND_Y - 4, closeRadius * 2, 8).fill({ color: 0xf59e0b, alpha: 0.35 });
    
    // Inner Hit Zone (Emerald)
    gfx.rect(targetX - hitRadius, GROUND_Y - 6, hitRadius * 2, 12).fill({ color: 0x10b981, alpha: 0.8 });
    
    // Bullseye Ring Target Marker
    gfx.circle(targetX, GROUND_Y, 14).fill({ color: 0x10b981, alpha: 0.3 });
    gfx.circle(targetX, GROUND_Y, 6).fill({ color: 0x10b981 });
    gfx.circle(targetX, GROUND_Y, 14).stroke({ width: 2, color: 0x34d399 });

    // Distance Indicator Line
    gfx.moveTo(ORIGIN_X, GROUND_Y + 18).lineTo(targetX, GROUND_Y + 18).stroke({ width: 2, color: 0x10b981 });
    gfx.moveTo(ORIGIN_X, GROUND_Y + 12).lineTo(ORIGIN_X, GROUND_Y + 24).stroke({ width: 2, color: 0x10b981 });
    gfx.moveTo(targetX, GROUND_Y + 12).lineTo(targetX, GROUND_Y + 24).stroke({ width: 2, color: 0x10b981 });
  };

  // Trigger Launch Simulation
  useEffect(() => {
    if (isSimulating && !simStateRef.current.active) {
      if (idleAnimationRef.current) idleAnimationRef.current.kill();
      if (trailContainerRef.current) trailContainerRef.current.removeChildren();
      if (overlayGraphicsRef.current) overlayGraphicsRef.current.clear();

      simStateRef.current = {
        active: true,
        startTime: performance.now(),
        userV: userVelocity,
        round,
        hasLanded: false,
      };
    }
  }, [isSimulating, userVelocity, round]);

  // Handle Simulation Landing & Scoring
  const handleLanding = (landingX: number, currentRound: RoundData, userV: number) => {
    const platformY = GROUND_Y - currentRound.height * M2P;
    const targetX = ORIGIN_X + currentRound.distance * M2P;

    // Evaluate result using pure physics rules
    const result = evaluateHorizontalSubmission(currentRound, userV);

    const actualLandingMeters = (landingX - ORIGIN_X) / M2P;
    const targetMeters = currentRound.distance;

    // Trajectory Points for path overlays
    const actualPoints = generateTrajectoryPoints(userV, currentRound.height, currentRound.gravity).map(
      (pt) => ({ x: ORIGIN_X + pt.x * M2P, y: GROUND_Y - pt.y * M2P })
    );
    const idealPoints = generateTrajectoryPoints(
      currentRound.correctVelocity,
      currentRound.height,
      currentRound.gravity
    ).map((pt) => ({ x: ORIGIN_X + pt.x * M2P, y: GROUND_Y - pt.y * M2P }));

    const roundResult: RoundResult = {
      roundNumber: currentRound.roundNumber,
      userVelocity: userV,
      correctVelocity: currentRound.correctVelocity,
      errorPercentage: result.errorPercentage,
      tier: result.tier,
      xpEarned: result.xpEarned,
      actualLandingX: Number(actualLandingMeters.toFixed(2)),
      targetX: targetMeters,
      trajectoryPoints: actualPoints,
      idealTrajectoryPoints: idealPoints,
    };

    // Render Trajectory Overlays (Curriculum requirement QA Checklist line 59)
    if (overlayGraphicsRef.current) {
      const gfx = overlayGraphicsRef.current;
      gfx.clear();

      // Ideal path in glowing cyan dashed line
      gfx.setStrokeStyle({ width: 2, color: 0x06b6d4, alpha: 0.8 });
      idealPoints.forEach((pt, idx) => {
        if (idx === 0) gfx.moveTo(pt.x, pt.y);
        else gfx.lineTo(pt.x, pt.y);
      });
      gfx.stroke();

      // Actual path in amber / red line if miss/close
      const pathColor = result.tier === 'hit' ? 0x10b981 : result.tier === 'close' ? 0xf59e0b : 0xef4444;
      gfx.setStrokeStyle({ width: 3, color: pathColor, alpha: 0.9 });
      actualPoints.forEach((pt, idx) => {
        if (idx === 0) gfx.moveTo(pt.x, pt.y);
        else gfx.lineTo(pt.x, pt.y);
      });
      gfx.stroke();
    }

    // GSAP Snippet Implementation per Curriculum Spec v2 Section 5:
    // On collision with target:
    if (avatarSpriteRef.current) {
      const avatar = avatarSpriteRef.current;
      if (result.tier === 'hit') {
        // Hit = scale-up + flash (0.3s GSAP)
        gsap.to(avatar.scale, {
          x: 1.3,
          y: 1.3,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        });
        gsap.to(avatar, {
          alpha: 0.5,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
        });
        // Fire celebration confetti!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        // Close or Miss = stop, highlight impact marker
        gsap.to(avatar.scale, {
          x: 1.1,
          y: 1.1,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
        });
      }
    }

    // Notify parent component with complete round result
    setTimeout(() => {
      onSimulationComplete(roundResult);
    }, 600);
  };

  const platformY = GROUND_Y - round.height * M2P;
  const targetX = ORIGIN_X + round.distance * M2P;

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl flex flex-col justify-between">
      {/* HUD Overlay Top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Launch Height (h):</span>
            <span className="font-mono font-semibold text-cyan-400 text-sm">{round.height} m</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Target Distance (d):</span>
            <span className="font-mono font-semibold text-emerald-400 text-sm">{round.distance} m</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Gravity (g):</span>
            <span className="font-mono font-semibold text-amber-400 text-sm">{round.gravity} m/s²</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium animate-pulse">
          PHYSICS SIMULATOR v1.0
        </div>
      </div>

      {/* Pixi Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-crosshair" />

      {/* Legend / Canvas Footer Info */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-4 text-[11px] text-slate-400 bg-slate-900/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Hit Zone (±5%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Close Zone (±15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Ideal Trajectory</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Canvas Scale: 1m = {M2P}px
        </div>
      </div>
    </div>
  );
};
