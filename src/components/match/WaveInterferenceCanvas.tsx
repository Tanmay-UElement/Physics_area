'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { InterferenceState, WaveInterferenceRoundData, calculateSuperposition } from '@/lib/physics/waveInterference';
import { RoundResult } from '@/lib/physics/types';

interface WaveInterferenceCanvasProps {
  round: WaveInterferenceRoundData;
  interferenceState: InterferenceState;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
  onSourceAPositionChange: (x: number, y: number) => void;
  onSourceBPositionChange: (x: number, y: number) => void;
  onMicPositionChange: (x: number, y: number) => void;
  onViewModeChange?: (mode: 'BOTH' | 'SOURCE_A' | 'SOURCE_B' | 'RESULTANT') => void;
  onInterferenceModeChange?: (mode: 'SOUND' | 'LIGHT') => void;
  onTogglePhysicsInspector?: () => void;
}

export const WaveInterferenceCanvas: React.FC<WaveInterferenceCanvasProps> = ({
  round,
  interferenceState,
  theme,
  onSourceAPositionChange,
  onSourceBPositionChange,
  onMicPositionChange,
  onViewModeChange,
  onInterferenceModeChange,
  onTogglePhysicsInspector,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // State Ref to prevent useEffect re-initialization flicker
  const stateRef = useRef<InterferenceState>(interferenceState);
  useEffect(() => {
    stateRef.current = interferenceState;
  }, [interferenceState]);

  // Callbacks refs
  const onSourceAPosRef = useRef(onSourceAPositionChange);
  const onSourceBPosRef = useRef(onSourceBPositionChange);
  const onMicPosRef = useRef(onMicPositionChange);
  useEffect(() => {
    onSourceAPosRef.current = onSourceAPositionChange;
    onSourceBPosRef.current = onSourceBPositionChange;
    onMicPosRef.current = onMicPositionChange;
  });

  // PIXI Stage references
  const gridGfxRef = useRef<PIXI.Graphics | null>(null);
  const waveFieldGfxRef = useRef<PIXI.Graphics | null>(null);
  const speakerAGfxRef = useRef<PIXI.Container | null>(null);
  const speakerBGfxRef = useRef<PIXI.Container | null>(null);
  const micGfxRef = useRef<PIXI.Container | null>(null);
  const distanceLinesGfxRef = useRef<PIXI.Graphics | null>(null);

  const isLight = theme === 'light';

  // Wavefront particles pool
  const waveRingsRef = useRef<{ sourceId: string; x: number; y: number; radius: number; alpha: number }[]>([]);

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

      const centerX = width / 2;
      const centerY = height - 90;
      const scalePx = 110; // 110 pixels per meter

      // 1. Acoustic Chamber Grid & Backdrop
      const gridGfx = new PIXI.Graphics();
      app.stage.addChild(gridGfx);
      gridGfxRef.current = gridGfx;
      drawAcousticChamberGrid(gridGfx, width, height, centerX, centerY);

      // 2. Real-Time 2D Wave Propagation & Superposition Layer
      const waveFieldGfx = new PIXI.Graphics();
      app.stage.addChild(waveFieldGfx);
      waveFieldGfxRef.current = waveFieldGfx;

      // 3. Distance Lines Graphics Layer
      const distGfx = new PIXI.Graphics();
      app.stage.addChild(distGfx);
      distanceLinesGfxRef.current = distGfx;

      // 4. Interactive Speaker A 🔊 (Draggable)
      const speakerA = createDraggableSpeaker(
        app.stage,
        'Speaker A (Noise Source)',
        0x38bdf8,
        (newX, newY) => {
          const physX = Number(((newX - centerX) / scalePx).toFixed(2));
          const physY = Number(((centerY - newY) / scalePx).toFixed(2));
          onSourceAPosRef.current(Math.max(-3, Math.min(3, physX)), Math.max(0.2, Math.min(3.8, physY)));
        }
      );
      speakerAGfxRef.current = speakerA;

      // 5. Interactive Speaker B 🔊 (Draggable)
      const speakerB = createDraggableSpeaker(
        app.stage,
        'Speaker B (Cancellation)',
        0xc084fc,
        (newX, newY) => {
          const physX = Number(((newX - centerX) / scalePx).toFixed(2));
          const physY = Number(((centerY - newY) / scalePx).toFixed(2));
          onSourceBPosRef.current(Math.max(-3, Math.min(3, physX)), Math.max(0.2, Math.min(3.8, physY)));
        }
      );
      speakerBGfxRef.current = speakerB;

      // 6. Interactive Microphone Sensor 🎙 (Draggable)
      const micContainer = createDraggableMicrophone(app.stage, (newX, newY) => {
        const physX = Number(((newX - centerX) / scalePx).toFixed(2));
        const physY = Number(((centerY - newY) / scalePx).toFixed(2));
        onMicPosRef.current(Math.max(-3, Math.min(3, physX)), Math.max(0.2, Math.min(3.8, physY)));
      });
      micGfxRef.current = micContainer;

      let frameCounter = 0;

      // 7. CONTINUOUS 60 FPS TICKER
      app.ticker.add(() => {
        frameCounter++;
        const state = stateRef.current;

        const spAX = centerX + state.sourceA.x * scalePx;
        const spAY = centerY - state.sourceA.y * scalePx;

        const spBX = centerX + state.sourceB.x * scalePx;
        const spBY = centerY - state.sourceB.y * scalePx;

        const micX = centerX + state.activeSensor.x * scalePx;
        const micY = centerY - state.activeSensor.y * scalePx;

        if (state.mode === 'SOUND') {
          drawAcousticChamberGrid(gridGfx, width, height, centerX, centerY);

          // Update physical positions of draggable containers
          if (speakerAGfxRef.current) {
            speakerAGfxRef.current.x = spAX;
            speakerAGfxRef.current.y = spAY;
            speakerAGfxRef.current.visible = state.sourceA.enabled;
          }

          if (speakerBGfxRef.current) {
            speakerBGfxRef.current.x = spBX;
            speakerBGfxRef.current.y = spBY;
            speakerBGfxRef.current.visible = state.sourceB.enabled;
          }

          if (micGfxRef.current) {
            micGfxRef.current.x = micX;
            micGfxRef.current.y = micY;
          }

          // Draw Distance Rays (r1 & r2)
          if (distanceLinesGfxRef.current) {
            drawDistanceLines(distanceLinesGfxRef.current, spAX, spAY, spBX, spBY, micX, micY, state);
          }

          // Spawn expanding wave rings from speakers
          if (state.isEmittingWaves && frameCounter % 10 === 0) {
            if (state.sourceA.enabled && (state.viewSourceMode === 'BOTH' || state.viewSourceMode === 'SOURCE_A' || state.viewSourceMode === 'RESULTANT')) {
              waveRingsRef.current.push({ sourceId: 'source-a', x: spAX, y: spAY, radius: 6, alpha: 0.9 });
            }
            if (state.sourceB.enabled && (state.viewSourceMode === 'BOTH' || state.viewSourceMode === 'SOURCE_B' || state.viewSourceMode === 'RESULTANT')) {
              waveRingsRef.current.push({ sourceId: 'source-b', x: spBX, y: spBY, radius: 6, alpha: 0.9 });
            }
          }

          // Draw Superposition Field & Wavefront Overlaps
          if (waveFieldGfxRef.current) {
            drawWaveSuperpositionField(waveFieldGfxRef.current, state, spAX, spAY, spBX, spBY, micX, micY);
          }
        } else {
          // Double Slit Mode
          drawDoubleSlitOpticalBench(gridGfx, waveFieldGfxRef.current!, width, height, state);
          if (speakerAGfxRef.current) speakerAGfxRef.current.visible = false;
          if (speakerBGfxRef.current) speakerBGfxRef.current.visible = false;
          if (micGfxRef.current) micGfxRef.current.visible = false;
          if (distanceLinesGfxRef.current) distanceLinesGfxRef.current.clear();
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

  const drawAcousticChamberGrid = (
    gfx: PIXI.Graphics,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ) => {
    gfx.clear();

    // Dark Acoustic Room Wall Backdrop
    gfx.rect(0, 0, width, height).fill({ color: 0x030712 });

    // Grid Floor Ticks (-3.0m to +3.0m)
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b });
    for (let x = -3.5; x <= 3.5; x += 0.5) {
      const px = centerX + x * 110;
      gfx.moveTo(px, 0).lineTo(px, height).stroke();
    }
    for (let y = 0; y <= 4.0; y += 0.5) {
      const py = centerY - y * 110;
      gfx.moveTo(0, py).lineTo(width, py).stroke();
    }

    // Main Axes
    gfx.setStrokeStyle({ width: 2, color: 0x475569 });
    gfx.moveTo(0, centerY).lineTo(width, centerY).stroke();
    gfx.moveTo(centerX, 0).lineTo(centerX, height).stroke();

    for (let m = -3; m <= 3; m++) {
      const px = centerX + m * 110;
      const txt = new PIXI.Text({
        text: `${m}m`,
        style: { fontSize: 10, fill: 0x64748b, fontFamily: 'monospace', fontWeight: 'bold' },
      });
      txt.anchor.set(0.5, 0);
      txt.x = px;
      txt.y = centerY + 6;
      gfx.addChild(txt);
    }
  };

  const createDraggableSpeaker = (
    stage: PIXI.Container,
    title: string,
    colorHex: number,
    onDragEnd: (x: number, y: number) => void
  ) => {
    const container = new PIXI.Container();
    container.eventMode = 'static';
    container.cursor = 'grab';

    const gfx = new PIXI.Graphics();
    // Loudspeaker Physical Cabinet 🔊
    gfx.rect(-22, -26, 44, 52).fill({ color: 0x020617 });
    gfx.rect(-22, -26, 44, 52).stroke({ width: 2.5, color: colorHex });
    gfx.circle(0, 0, 14).fill({ color: colorHex });
    gfx.circle(0, 0, 6).fill({ color: 0x020617 });

    const txt = new PIXI.Text({
      text: title,
      style: { fontSize: 9, fill: colorHex, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -34;

    container.addChild(gfx);
    container.addChild(txt);

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    container.on('pointerdown', (event) => {
      isDragging = true;
      container.cursor = 'grabbing';
      dragOffsetX = container.x - event.global.x;
      dragOffsetY = container.y - event.global.y;
    });

    container.on('pointermove', (event) => {
      if (isDragging) {
        const newX = event.global.x + dragOffsetX;
        const newY = event.global.y + dragOffsetY;
        container.x = newX;
        container.y = newY;
        onDragEnd(newX, newY);
      }
    });

    const stopDrag = () => {
      if (isDragging) {
        isDragging = false;
        container.cursor = 'grab';
      }
    };

    container.on('pointerup', stopDrag);
    container.on('pointerupoutside', stopDrag);

    stage.addChild(container);
    return container;
  };

  const createDraggableMicrophone = (
    stage: PIXI.Container,
    onDragEnd: (x: number, y: number) => void
  ) => {
    const container = new PIXI.Container();
    container.eventMode = 'static';
    container.cursor = 'grab';

    const gfx = new PIXI.Graphics();
    // Physical Measurement Microphone Stand 🎙
    gfx.moveTo(0, 0).lineTo(0, 32).stroke({ width: 3, color: 0x94a3b8 });
    gfx.rect(-12, 32, 24, 6).fill({ color: 0x475569 }); // Base stand
    gfx.circle(0, 0, 15).fill({ color: 0x020617 });
    gfx.circle(0, 0, 15).stroke({ width: 3, color: 0xef4444 });
    gfx.circle(0, 0, 6).fill({ color: 0xef4444 });

    const txt = new PIXI.Text({
      text: '🎙 TARGET MICROPHONE',
      style: { fontSize: 9, fill: 0xef4444, fontWeight: 'bold', fontFamily: 'monospace' },
    });
    txt.anchor.set(0.5);
    txt.y = -24;

    container.addChild(gfx);
    container.addChild(txt);

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    container.on('pointerdown', (event) => {
      isDragging = true;
      container.cursor = 'grabbing';
      dragOffsetX = container.x - event.global.x;
      dragOffsetY = container.y - event.global.y;
    });

    container.on('pointermove', (event) => {
      if (isDragging) {
        const newX = event.global.x + dragOffsetX;
        const newY = event.global.y + dragOffsetY;
        container.x = newX;
        container.y = newY;
        onDragEnd(newX, newY);
      }
    });

    const stopDrag = () => {
      if (isDragging) {
        isDragging = false;
        container.cursor = 'grab';
      }
    };

    container.on('pointerup', stopDrag);
    container.on('pointerupoutside', stopDrag);

    stage.addChild(container);
    return container;
  };

  const drawDistanceLines = (
    gfx: PIXI.Graphics,
    spAX: number,
    spAY: number,
    spBX: number,
    spBY: number,
    micX: number,
    micY: number,
    state: InterferenceState
  ) => {
    gfx.clear();

    // Distance Line r1 (Speaker A -> Mic)
    if (state.sourceA.enabled) {
      gfx.setStrokeStyle({ width: 1.5, color: 0x38bdf8, alpha: 0.6 });
      gfx.moveTo(spAX, spAY).lineTo(micX, micY).stroke();
    }

    // Distance Line r2 (Speaker B -> Mic)
    if (state.sourceB.enabled) {
      gfx.setStrokeStyle({ width: 1.5, color: 0xc084fc, alpha: 0.6 });
      gfx.moveTo(spBX, spBY).lineTo(micX, micY).stroke();
    }
  };

  const drawWaveSuperpositionField = (
    gfx: PIXI.Graphics,
    state: InterferenceState,
    spAX: number,
    spAY: number,
    spBX: number,
    spBY: number,
    micX: number,
    micY: number
  ) => {
    gfx.clear();
    const tSec = Date.now() / 1000;

    // Render expanding wave rings
    waveRingsRef.current.forEach((ring, idx) => {
      ring.radius += 2.8;
      ring.alpha -= 0.003;

      if (ring.radius < 500 && ring.alpha > 0) {
        const color = ring.sourceId === 'source-a' ? 0x38bdf8 : 0xc084fc;
        gfx.setStrokeStyle({ width: 2, color, alpha: ring.alpha });
        gfx.circle(ring.x, ring.y, ring.radius).stroke();
      } else {
        waveRingsRef.current.splice(idx, 1);
      }
    });

    // Real-Time Superposition Pulse Ring at Target Microphone
    const sup = calculateSuperposition(state.activeSensor.x, state.activeSensor.y, tSec, state.sourceA, state.sourceB, state.soundSpeedMps);
    const color = state.interferenceType === 'DESTRUCTIVE' ? 0xef4444 : state.interferenceType === 'CONSTRUCTIVE' ? 0x34d399 : 0xf59e0b;

    gfx.circle(micX, micY, 18 + Math.abs(sup.yTotal) * 12).stroke({ width: 3, color, alpha: 0.8 });
  };

  const drawDoubleSlitOpticalBench = (
    gridGfx: PIXI.Graphics,
    waveGfx: PIXI.Graphics,
    width: number,
    height: number,
    state: InterferenceState
  ) => {
    gridGfx.clear();
    waveGfx.clear();

    gridGfx.rect(0, 0, width, height).fill({ color: 0x030712 });

    // Laser Source Emitter Box
    gridGfx.rect(40, height / 2 - 25, 60, 50).fill({ color: 0x1e293b });
    gridGfx.rect(40, height / 2 - 25, 60, 50).stroke({ width: 2, color: 0xef4444 });

    const laserTxt = new PIXI.Text({
      text: 'LASER 🔴',
      style: { fontSize: 10, fill: 0xef4444, fontFamily: 'monospace', fontWeight: 'bold' },
    });
    laserTxt.anchor.set(0.5);
    laserTxt.x = 70;
    laserTxt.y = height / 2;
    gridGfx.addChild(laserTxt);

    // Double Slit Barrier (X = 220)
    gridGfx.rect(220, 40, 14, height - 80).fill({ color: 0x334155 });
    gridGfx.rect(220, height / 2 - 45, 14, 30).fill({ color: 0x030712 });
    gridGfx.rect(220, height / 2 + 15, 14, 30).fill({ color: 0x030712 });

    // Target Screen (X = 680)
    gridGfx.rect(680, 40, 20, height - 80).fill({ color: 0x0f172a });
    gridGfx.rect(680, 40, 20, height - 80).stroke({ width: 2.5, color: 0x475569 });

    // Laser Rays
    waveGfx.setStrokeStyle({ width: 4, color: 0xef4444, alpha: 0.8 });
    waveGfx.moveTo(100, height / 2).lineTo(220, height / 2).stroke();

    // Fringes on Screen
    for (let y = 60; y <= height - 60; y += 8) {
      const distFromCenter = Math.abs(y - height / 2);
      const intensity = Math.max(0.05, Math.cos(distFromCenter * (0.05 / (state.slitSeparationMm || 0.2))) ** 2);
      waveGfx.rect(680, y, 20, 6).fill({ color: 0xef4444, alpha: intensity });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Top Header & Diagnostics Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>r₁: <span className="font-mono font-bold text-sky-400">{interferenceState.pathA} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>r₂: <span className="font-mono font-bold text-purple-400">{interferenceState.pathB} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>ΔL: <span className="font-mono font-bold text-amber-400">{interferenceState.pathDiffM} m</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>λ: <span className="font-mono font-bold text-emerald-400">{interferenceState.wavelengthM} m</span></div>
        </div>

        {/* View & Inspector Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onTogglePhysicsInspector}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              interferenceState.showPhysicsInspector
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🔍 INSPECTOR
          </button>
          <button
            type="button"
            onClick={() => onInterferenceModeChange?.(interferenceState.mode === 'SOUND' ? 'LIGHT' : 'SOUND')}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-emerald-400 hover:bg-slate-800"
          >
            MODE: {interferenceState.mode}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Physics Inspector Overlay Modal */}
      {interferenceState.showPhysicsInspector && (
        <div className="absolute top-16 right-4 w-72 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono space-y-2 backdrop-blur-md z-20">
          <div className="font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            PHYSICS ENGINE DIAGNOSTICS
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Path Diff (ΔL):</span>
            <span className="font-bold text-amber-400">{interferenceState.pathDiffM} m</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Path Phase (Δφ_path):</span>
            <span className="font-bold text-sky-400">{interferenceState.pathPhaseDeg}°</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Total Phase (Δφ_total):</span>
            <span className="font-bold text-purple-400">{interferenceState.totalPhaseDiffDeg}°</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Resultant Amp (A_total):</span>
            <span className="font-bold text-emerald-400">{interferenceState.resultantAmp}</span>
          </div>
          <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
            <span>Sound Pressure Level:</span>
            <span className="font-bold text-rose-400">{interferenceState.measuredDb} dB</span>
          </div>
        </div>
      )}

      {/* Footer Diagnostic Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          interferenceState.isComplete
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : interferenceState.interferenceType === 'DESTRUCTIVE'
            ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
            : 'bg-sky-950/80 border-sky-500/40 text-sky-300'
        }`}>
          {interferenceState.statusText}
        </div>
      </div>
    </div>
  );
};
