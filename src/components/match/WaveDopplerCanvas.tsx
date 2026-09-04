'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { DopplerState, WaveDopplerRoundData } from '@/lib/physics/waveDoppler';
import { RoundResult } from '@/lib/physics/types';

interface WaveDopplerCanvasProps {
  round: WaveDopplerRoundData;
  dopplerState: DopplerState;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
  onCameraChange?: (mode: 'OVERVIEW' | 'FOLLOW_SIREN' | 'FOLLOW_PLAYER') => void;
  onSpeedScaleChange?: (scale: number) => void;
}

export const WaveDopplerCanvas: React.FC<WaveDopplerCanvasProps> = ({
  round,
  dopplerState,
  theme,
  onCameraChange,
  onSpeedScaleChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // Ref to always hold the latest doppler state without triggering useEffect re-init
  const dopplerStateRef = useRef<DopplerState>(dopplerState);
  useEffect(() => {
    dopplerStateRef.current = dopplerState;
  }, [dopplerState]);

  // References for live 60fps rendering
  const worldStageRef = useRef<PIXI.Container | null>(null);
  const sirenVehicleRef = useRef<PIXI.Container | null>(null);
  const playerVehicleRef = useRef<PIXI.Container | null>(null);
  const sirenSpeedTextRef = useRef<PIXI.Text | null>(null);
  const playerSpeedTextRef = useRef<PIXI.Text | null>(null);
  const wavefrontsGfxRef = useRef<PIXI.Graphics | null>(null);
  const hudGfxRef = useRef<PIXI.Graphics | null>(null);
  const listenerPulseRef = useRef<PIXI.Graphics | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const isLight = theme === 'light';

  // Sound wavefront particles pool
  const wavefrontsRef = useRef<{ x: number; radius: number; maxRadius: number; alpha: number; detected: boolean }[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initCanvas = async () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 480;

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

      // World Stage Root Container for Smooth Camera Panning
      const worldStage = new PIXI.Container();
      app.stage.addChild(worldStage);
      worldStageRef.current = worldStage;

      // 1. City Environment & Road Scene
      const envGfx = new PIXI.Graphics();
      worldStage.addChild(envGfx);
      drawCityRoadEnvironment(envGfx, height);

      // 2. Measurement Gate (Physical Checkered Gate 🏁)
      const gateGfx = new PIXI.Graphics();
      worldStage.addChild(gateGfx);
      drawMeasurementGate(gateGfx, height);

      // 3. Wavefront Graphics Layer
      const wavefrontsGfx = new PIXI.Graphics();
      worldStage.addChild(wavefrontsGfx);
      wavefrontsGfxRef.current = wavefrontsGfx;

      // 4. Siren Vehicle (Emergency Ambulance 🚑)
      const sirenContainer = drawSirenVehicle(worldStage);
      sirenVehicleRef.current = sirenContainer;

      // 5. Player Vehicle (Observer Car 🚗 & Listener Sensor 🎧)
      const playerContainer = drawPlayerVehicle(worldStage);
      playerVehicleRef.current = playerContainer;

      // Listener Pulse Overlay Graphics
      const pulseGfx = new PIXI.Graphics();
      worldStage.addChild(pulseGfx);
      listenerPulseRef.current = pulseGfx;

      // 6. HUD Telemetry Graphics Layer (Fixed UI)
      const hudGfx = new PIXI.Graphics();
      app.stage.addChild(hudGfx);
      hudGfxRef.current = hudGfx;

      // Web Audio API Synthesizer
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(dopplerStateRef.current.observedFreqHz, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.015, audioCtx.currentTime);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();

          audioCtxRef.current = audioCtx;
          oscRef.current = osc;
          gainRef.current = gain;
        }
      } catch {
        // Audio synthesis fallback
      }

      let frameCounter = 0;

      // 7. CONTINUOUS 60 FPS ANIMATION TICKER
      app.ticker.add(() => {
        frameCounter++;
        const currentState = dopplerStateRef.current;

        // Map physical 0-240 meters to Canvas X coordinates
        const metersToPx = 5.0; // 5 pixels per meter
        const sirenCanvasX = currentState.sourceX * metersToPx;
        const playerCanvasX = currentState.playerX * metersToPx;
        const roadY = height - 140;

        // Position Ambulance 🚑 & Player Car 🚗
        if (sirenVehicleRef.current) {
          sirenVehicleRef.current.x = sirenCanvasX;
          sirenVehicleRef.current.y = roadY - 12;
        }

        if (playerVehicleRef.current) {
          playerVehicleRef.current.x = playerCanvasX;
          playerVehicleRef.current.y = roadY - 12;
        }

        // Update Text Labels dynamically
        if (sirenSpeedTextRef.current) {
          sirenSpeedTextRef.current.text = `🚑 SIREN (${currentState.sourceSpeedMps} m/s →)`;
        }
        if (playerSpeedTextRef.current) {
          playerSpeedTextRef.current.text = `🚗 YOU (${currentState.playerSpeedMps} m/s →)`;
        }

        // Camera Panning Logic (Overview, Follow Siren, Follow Player)
        if (worldStageRef.current) {
          if (currentState.cameraMode === 'FOLLOW_SIREN') {
            const targetCamX = width / 2 - sirenCanvasX;
            worldStageRef.current.x += (targetCamX - worldStageRef.current.x) * 0.1;
          } else if (currentState.cameraMode === 'FOLLOW_PLAYER') {
            const targetCamX = width / 2 - playerCanvasX;
            worldStageRef.current.x += (targetCamX - worldStageRef.current.x) * 0.1;
          } else {
            worldStageRef.current.x += (0 - worldStageRef.current.x) * 0.1;
          }
        }

        // Spawn Expanding Doppler Wavefront Circles
        const spawnInterval = Math.max(8, Math.round(30 * (currentState.simSpeedScale || 1.0)));
        if (frameCounter % spawnInterval === 0) {
          wavefrontsRef.current.push({
            x: sirenCanvasX,
            radius: 8,
            maxRadius: 400,
            alpha: 0.9,
            detected: false,
          });
        }

        // Render Wavefronts & Listener Detection Events
        if (wavefrontsGfxRef.current && listenerPulseRef.current) {
          drawWavefrontsAndDetections(
            wavefrontsGfxRef.current,
            listenerPulseRef.current,
            playerCanvasX,
            roadY - 12,
            currentState.simSpeedScale || 1.0
          );
        }

        // Render Telemetry HUD Line & State Banner
        if (hudGfxRef.current) {
          drawHudOverlay(hudGfxRef.current, sirenCanvasX, playerCanvasX, roadY, width);
        }

        // Update Web Audio Synth Pitch dynamically
        if (oscRef.current && audioCtxRef.current) {
          oscRef.current.frequency.setValueAtTime(
            currentState.observedFreqHz,
            audioCtxRef.current.currentTime
          );
        }
      });
    };

    initCanvas();

    return () => {
      isMounted = false;
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true });
        pixiAppRef.current = null;
      }
    };
  }, [round.id, isLight]); // REMOVED dopplerState from dependency array to prevent canvas destruction flicker!

  const drawCityRoadEnvironment = (gfx: PIXI.Graphics, height: number) => {
    gfx.clear();

    const roadY = height - 140;
    const worldWidth = 1400; // 240m * 5px/m

    // Buildings Silhouettes Backdrop
    for (let bx = 0; bx < worldWidth; bx += 140) {
      const bH = 120 + ((bx * 7) % 90);
      gfx.rect(bx, roadY - bH, 110, bH).fill({ color: 0x0f172a, alpha: 0.85 });
      gfx.rect(bx, roadY - bH, 110, bH).stroke({ width: 1.5, color: 0x1e293b });

      // Glowing Window Dots
      for (let wy = roadY - bH + 20; wy < roadY - 20; wy += 25) {
        for (let wx = bx + 15; wx < bx + 95; wx += 22) {
          if ((wx + wy) % 3 === 0) {
            gfx.rect(wx, wy, 8, 12).fill({ color: 0xfef08a, alpha: 0.7 });
          }
        }
      }
    }

    // Roadside Curb & Sidewalk
    gfx.rect(0, roadY - 14, worldWidth, 14).fill({ color: 0x475569 });

    // Asphalt Highway Road Surface
    gfx.rect(0, roadY, worldWidth, 100).fill({ color: 0x1e293b });
    gfx.setStrokeStyle({ width: 4, color: 0x64748b });
    gfx.moveTo(0, roadY).lineTo(worldWidth, roadY).stroke();

    // Center Double Yellow Divider Line
    gfx.setStrokeStyle({ width: 2, color: 0xeab308 });
    gfx.moveTo(0, roadY + 48).lineTo(worldWidth, roadY + 48).stroke();
    gfx.moveTo(0, roadY + 52).lineTo(worldWidth, roadY + 52).stroke();

    // Dashed White Lane Dividers
    gfx.setStrokeStyle({ width: 2.5, color: 0xf8fafc, alpha: 0.8 });
    for (let x = 0; x < worldWidth; x += 50) {
      gfx.moveTo(x, roadY + 25).lineTo(x + 25, roadY + 25).stroke();
      gfx.moveTo(x, roadY + 75).lineTo(x + 25, roadY + 75).stroke();
    }

    // Road Distance Scale Markers along bottom (0m ... 50m ... 100m ... 200m)
    gfx.setStrokeStyle({ width: 1.5, color: 0x94a3b8, alpha: 0.7 });
    for (let m = 0; m <= 240; m += 20) {
      const px = m * 5.0;
      gfx.moveTo(px, roadY + 100).lineTo(px, roadY + 86).stroke();

      const txt = new PIXI.Text({
        text: `${m} m`,
        style: { fontSize: 9, fill: 0x94a3b8, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      txt.anchor.set(0.5, 0);
      txt.x = px;
      txt.y = roadY + 102;
      gfx.addChild(txt);
    }
  };

  const drawMeasurementGate = (gfx: PIXI.Graphics, height: number) => {
    gfx.clear();

    const gateX = 140 * 5.0; // 140m Gate Position
    const roadY = height - 140;

    // Checkered Measurement Gate Banner Overhead
    gfx.setStrokeStyle({ width: 3, color: 0x38bdf8, alpha: 0.8 });
    for (let y = roadY - 140; y <= roadY + 100; y += 12) {
      gfx.moveTo(gateX, y).lineTo(gateX, y + 6).stroke();
    }

    const txt = new PIXI.Text({
      text: '🏁 MEASUREMENT ZONE GATE (140m)',
      style: { fontSize: 10, fill: 0x38bdf8, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    txt.anchor.set(0.5);
    txt.x = gateX;
    txt.y = roadY - 130;
    gfx.addChild(txt);
  };

  const drawSirenVehicle = (stage: PIXI.Container) => {
    const container = new PIXI.Container();

    const gfx = new PIXI.Graphics();
    // Emergency Ambulance Body 🚑
    gfx.rect(-36, -26, 72, 32).fill({ color: 0xef4444 });
    gfx.rect(-36, -26, 72, 32).stroke({ width: 2.5, color: 0xf87171 });

    // Ambulance Windows & Cross
    gfx.rect(12, -20, 20, 14).fill({ color: 0x38bdf8 });
    gfx.rect(-16, -18, 14, 14).fill({ color: 0xffffff });
    gfx.rect(-11, -18, 4, 14).fill({ color: 0xef4444 });
    gfx.rect(-16, -13, 14, 4).fill({ color: 0xef4444 });

    // Flashing Red/Blue Siren Light
    gfx.rect(-6, -33, 12, 7).fill({ color: 0x38bdf8 });
    gfx.circle(-6, -30, 4).fill({ color: 0xef4444 });

    // Wheels
    gfx.circle(-22, 8, 7).fill({ color: 0x020617 });
    gfx.circle(22, 8, 7).fill({ color: 0x020617 });

    const txt = new PIXI.Text({
      text: `🚑 SIREN (${dopplerStateRef.current.sourceSpeedMps} m/s →)`,
      style: { fontSize: 9, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -42;
    sirenSpeedTextRef.current = txt;

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);

    return container;
  };

  const drawPlayerVehicle = (stage: PIXI.Container) => {
    const container = new PIXI.Container();

    const gfx = new PIXI.Graphics();
    // Player Sound Tracker Car Body 🚗
    gfx.rect(-30, -22, 60, 26).fill({ color: 0x38bdf8 });
    gfx.rect(-30, -22, 60, 26).stroke({ width: 2.5, color: 0x7dd3fc });

    // Car Windshield
    gfx.rect(-12, -18, 24, 12).fill({ color: 0x020617 });

    // Listener Microphone Antenna Receiver 🎧
    gfx.moveTo(0, -22).lineTo(0, -36).stroke({ width: 2.5, color: 0xfef08a });
    gfx.circle(0, -36, 5).fill({ color: 0xfef08a });

    // Wheels
    gfx.circle(-18, 7, 7).fill({ color: 0x020617 });
    gfx.circle(18, 7, 7).fill({ color: 0x020617 });

    const txt = new PIXI.Text({
      text: `🚗 YOU (${dopplerStateRef.current.playerSpeedMps} m/s →)`,
      style: { fontSize: 9, fill: 0x38bdf8, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -44;
    playerSpeedTextRef.current = txt;

    container.addChild(gfx);
    container.addChild(txt);
    stage.addChild(container);

    return container;
  };

  const drawWavefrontsAndDetections = (
    wfGfx: PIXI.Graphics,
    pulseGfx: PIXI.Graphics,
    playerX: number,
    roadY: number,
    speedScale: number
  ) => {
    wfGfx.clear();
    pulseGfx.clear();

    wavefrontsRef.current.forEach((wf, index) => {
      wf.radius += 3.0 * speedScale;
      wf.alpha -= 0.0025;

      if (wf.radius < wf.maxRadius && wf.alpha > 0) {
        // Draw Expanding Wavefront Circle
        wfGfx.setStrokeStyle({ width: 2.5, color: 0x38bdf8, alpha: wf.alpha });
        wfGfx.circle(wf.x, roadY, wf.radius).stroke();

        // Check if Wavefront reaches Listener Sensor (Player Car position playerX)
        const distToPlayer = Math.abs(wf.x + wf.radius - playerX);
        if (distToPlayer <= 10 && !wf.detected) {
          wf.detected = true;

          // Listener Pulse Wave Ring Effect 🎧
          pulseGfx.circle(playerX, roadY - 36, 18).fill({ color: 0xfef08a, alpha: 0.6 });
          pulseGfx.circle(playerX, roadY - 36, 26).stroke({ width: 2.5, color: 0x34d399, alpha: 0.8 });
        }
      } else {
        wavefrontsRef.current.splice(index, 1);
      }
    });
  };

  const drawHudOverlay = (
    gfx: PIXI.Graphics,
    sirenX: number,
    playerX: number,
    roadY: number,
    width: number
  ) => {
    gfx.clear();

    // Fixed Top HUD Bar
    const camOffset = worldStageRef.current ? worldStageRef.current.x : 0;
    const hudSirenX = sirenX + camOffset;
    const hudPlayerX = playerX + camOffset;

    // Physical Distance Measuring Line Between Vehicles
    if (hudSirenX > 0 && hudPlayerX < width) {
      gfx.setStrokeStyle({ width: 2, color: 0xfef08a, alpha: 0.8 });
      gfx.moveTo(hudSirenX, roadY - 60).lineTo(hudPlayerX, roadY - 60).stroke();

      // Distance Line Arrow Ticks
      gfx.moveTo(hudSirenX, roadY - 66).lineTo(hudSirenX, roadY - 54).stroke();
      gfx.moveTo(hudPlayerX, roadY - 66).lineTo(hudPlayerX, roadY - 54).stroke();
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Top Telemetry Header & State HUD Banner */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>SIREN DISTANCE: <span className="font-mono font-bold text-sky-400">{dopplerState.distanceM.toFixed(1)} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>RELATIVE RADIAL SPEED: <span className="font-mono font-bold text-amber-400">{dopplerState.relRadialSpeedMps} m/s</span></div>
        </div>

        {/* Phase Status Badge */}
        <div className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${
          dopplerState.phase === 'APPROACHING'
            ? 'bg-sky-950/80 border-sky-500/50 text-sky-300'
            : dopplerState.phase === 'CLOSEST'
            ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
            : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
        }`}>
          {dopplerState.phase === 'APPROACHING' && '🔵 APPROACHING (Frequency ↑)'}
          {dopplerState.phase === 'CLOSEST' && '⚡ CLOSEST APPROACH (MEASUREMENT ZONE)'}
          {dopplerState.phase === 'RECEDING' && '🟣 RECEDING (Frequency ↓)'}
        </div>

        {/* Camera & Speed Scale Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => onCameraChange?.(dopplerState.cameraMode === 'OVERVIEW' ? 'FOLLOW_SIREN' : dopplerState.cameraMode === 'FOLLOW_SIREN' ? 'FOLLOW_PLAYER' : 'OVERVIEW')}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-cyan-400 hover:bg-slate-800"
          >
            CAM: {dopplerState.cameraMode.replace('_', ' ')}
          </button>
          <button
            type="button"
            onClick={() => onSpeedScaleChange?.(dopplerState.simSpeedScale === 1.0 ? 0.5 : dopplerState.simSpeedScale === 0.5 ? 0.25 : 1.0)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-amber-400 hover:bg-slate-800"
          >
            SPEED: {dopplerState.simSpeedScale}x
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Diagnostic Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          dopplerState.phase === 'APPROACHING'
            ? 'bg-sky-950/80 border-sky-500/40 text-sky-300'
            : dopplerState.phase === 'CLOSEST'
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            : 'bg-purple-950/80 border-purple-500/40 text-purple-300'
        }`}>
          {dopplerState.statusText}
        </div>
      </div>
    </div>
  );
};
