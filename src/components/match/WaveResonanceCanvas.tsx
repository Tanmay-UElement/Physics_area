'use client';

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { ResonanceState, WaveResonanceRoundData } from '@/lib/physics/waveResonance';
import { RoundResult } from '@/lib/physics/types';

interface WaveResonanceCanvasProps {
  round: WaveResonanceRoundData;
  resonanceState: ResonanceState;
  theme: 'dark' | 'light';
  onSimulationComplete: (result: RoundResult) => void;
  onToggleNodesAntinodes?: () => void;
  onToggleSuperpositionWave?: () => void;
  onChangeCameraView?: (view: 'LAB_VIEW' | 'CLOSE_UP' | 'SUPERPOSITION_VIEW') => void;
}

export const WaveResonanceCanvas: React.FC<WaveResonanceCanvasProps> = ({
  round,
  resonanceState,
  theme,
  onToggleNodesAntinodes,
  onToggleSuperpositionWave,
  onChangeCameraView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // State Ref to prevent useEffect re-initialization flicker
  const stateRef = useRef<ResonanceState>(resonanceState);
  useEffect(() => {
    stateRef.current = resonanceState;
  }, [resonanceState]);

  // PIXI Graphics references
  const bgGfxRef = useRef<PIXI.Graphics | null>(null);
  const stringRigGfxRef = useRef<PIXI.Graphics | null>(null);
  const waveCurvesGfxRef = useRef<PIXI.Graphics | null>(null);
  const nodesAntinodesContainerRef = useRef<PIXI.Container | null>(null);

  const isLight = theme === 'light';

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

      // 1. Studio Laboratory Backdrop
      const bgGfx = new PIXI.Graphics();
      app.stage.addChild(bgGfx);
      bgGfxRef.current = bgGfx;

      // 2. Physical String Rig / Tube Equipment Graphics
      const stringRigGfx = new PIXI.Graphics();
      app.stage.addChild(stringRigGfx);
      stringRigGfxRef.current = stringRigGfx;

      // 3. Dynamic Wave Curves Layer (Incident, Reflected, Resultant)
      const waveCurvesGfx = new PIXI.Graphics();
      app.stage.addChild(waveCurvesGfx);
      waveCurvesGfxRef.current = waveCurvesGfx;

      // 4. Nodes and Antinodes Markers Container
      const nodesContainer = new PIXI.Container();
      app.stage.addChild(nodesContainer);
      nodesAntinodesContainerRef.current = nodesContainer;

      let frameCounter = 0;

      // 5. CONTINUOUS 60 FPS TICKER
      app.ticker.add(() => {
        frameCounter++;
        const state = stateRef.current;
        const tSec = (Date.now() / 1000) * state.simSpeed;

        if (state.mode === 'STRING') {
          drawLaboratoryStudioBackdrop(bgGfx, width, height);
          drawVibratingStringRig(stringRigGfx, width, height, state);
          drawStandingWaveCurves(waveCurvesGfx, width, height, state, tSec);
          drawNodesAndAntinodesMarkers(nodesContainer, width, height, state);
        } else {
          drawAirColumnTubeRig(bgGfx, waveCurvesGfx, nodesContainer, width, height, state, tSec);
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

  const drawLaboratoryStudioBackdrop = (gfx: PIXI.Graphics, width: number, height: number) => {
    gfx.clear();

    // Dark Acoustic Studio Walls Backdrop
    gfx.rect(0, 0, width, height).fill({ color: 0x030712 });

    // Grid Workbench Surface (Y = height - 70)
    gfx.setStrokeStyle({ width: 1, color: 0x1e293b });
    for (let x = 40; x <= width - 40; x += 40) {
      gfx.moveTo(x, height - 120).lineTo(x, height - 40).stroke();
    }
    gfx.setStrokeStyle({ width: 2, color: 0x475569 });
    gfx.moveTo(20, height - 70).lineTo(width - 20, height - 70).stroke();
  };

  const drawVibratingStringRig = (
    gfx: PIXI.Graphics,
    width: number,
    height: number,
    state: ResonanceState
  ) => {
    gfx.clear();

    const startX = 120;
    const endX = startX + state.stringLengthM * 320; // 320 px per meter
    const centerY = height / 2 - 10;

    // Mechanical Motor Driver Box (Left)
    gfx.rect(startX - 50, centerY - 35, 50, 70).fill({ color: 0x1e293b });
    gfx.rect(startX - 50, centerY - 35, 50, 70).stroke({ width: 2, color: 0x38bdf8 });
    gfx.circle(startX - 25, centerY, 12).fill({ color: 0x38bdf8 });

    // Pulley Wheel & Hanging Mass Tension Mechanism (Right)
    gfx.circle(endX + 15, centerY, 16).fill({ color: 0x334155 });
    gfx.circle(endX + 15, centerY, 16).stroke({ width: 2, color: 0x94a3b8 });
    gfx.rect(endX + 10, centerY + 16, 10, 45).fill({ color: 0x0f172a }); // Hanging Weight
    gfx.rect(endX + 10, centerY + 16, 10, 45).stroke({ width: 2, color: 0xf59e0b });

    // Pulley Cable
    gfx.setStrokeStyle({ width: 2, color: 0x94a3b8 });
    gfx.moveTo(endX, centerY).lineTo(endX + 15, centerY).lineTo(endX + 15, centerY + 20).stroke();
  };

  const drawStandingWaveCurves = (
    gfx: PIXI.Graphics,
    width: number,
    height: number,
    state: ResonanceState,
    tSec: number
  ) => {
    gfx.clear();

    const startX = 120;
    const endX = startX + state.stringLengthM * 320;
    const stringWidthPx = endX - startX;
    const centerY = height / 2 - 10;

    const L = state.stringLengthM;
    const f = state.driverFrequencyHz;
    const k = (2 * Math.PI * f) / state.waveSpeedMps;
    const omega = 2 * Math.PI * f;

    // Response Amplitude scaling
    const ampPx = Math.min(65, state.responseAmplitude * 24);

    // 1. Incident Wave Component Curve (blue, traveling right)
    if (state.showIncidentWave) {
      gfx.setStrokeStyle({ width: 1.5, color: 0x38bdf8, alpha: 0.5 });
      gfx.beginPath();
      for (let px = 0; px <= stringWidthPx; px += 4) {
        const xM = (px / stringWidthPx) * L;
        const yInc = (ampPx / 2) * Math.sin(k * xM - omega * tSec);
        if (px === 0) gfx.moveTo(startX + px, centerY + yInc);
        else gfx.lineTo(startX + px, centerY + yInc);
      }
      gfx.stroke();
    }

    // 2. Reflected Wave Component Curve (purple, traveling left)
    if (state.showReflectedWave) {
      gfx.setStrokeStyle({ width: 1.5, color: 0xc084fc, alpha: 0.5 });
      gfx.beginPath();
      for (let px = 0; px <= stringWidthPx; px += 4) {
        const xM = (px / stringWidthPx) * L;
        const yRef = -(ampPx / 2) * Math.sin(k * (2 * L - xM) - omega * tSec);
        if (px === 0) gfx.moveTo(startX + px, centerY + yRef);
        else gfx.lineTo(startX + px, centerY + yRef);
      }
      gfx.stroke();
    }

    // 3. Resultant Superposition Standing Wave Curve (emerald green glowing)
    if (state.showResultantWave) {
      const modeColor = state.isAtResonance ? 0x34d399 : 0xf59e0b;
      gfx.setStrokeStyle({ width: state.isAtResonance ? 3.5 : 2, color: modeColor, alpha: 0.95 });
      gfx.beginPath();

      for (let px = 0; px <= stringWidthPx; px += 3) {
        const xM = (px / stringWidthPx) * L;
        // Standing wave spatial envelope: 2 * A * sin(k*x) * cos(omega*t)
        const yRes = ampPx * Math.sin((Math.PI * xM * (state.activeHarmonicMode || 1)) / L) * Math.cos(omega * tSec);
        if (px === 0) gfx.moveTo(startX + px, centerY + yRes);
        else gfx.lineTo(startX + px, centerY + yRes);
      }
      gfx.stroke();
    }
  };

  const drawNodesAndAntinodesMarkers = (
    container: PIXI.Container,
    width: number,
    height: number,
    state: ResonanceState
  ) => {
    container.removeChildren();
    if (!state.showNodesAntinodes) return;

    const startX = 120;
    const endX = startX + state.stringLengthM * 320;
    const stringWidthPx = endX - startX;
    const centerY = height / 2 - 10;

    // Render Nodes (N ●)
    state.nodePositionsM.forEach((nM) => {
      const px = startX + (nM / state.stringLengthM) * stringWidthPx;
      const gfx = new PIXI.Graphics();
      gfx.circle(px, centerY, 6).fill({ color: 0xef4444 });
      gfx.circle(px, centerY, 6).stroke({ width: 2, color: 0xffffff });

      const txt = new PIXI.Text({
        text: 'N',
        style: { fontSize: 10, fill: 0xef4444, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      txt.anchor.set(0.5);
      txt.x = px;
      txt.y = centerY + 14;

      container.addChild(gfx);
      container.addChild(txt);
    });

    // Render Antinodes (A ▲)
    state.antinodePositionsM.forEach((aM) => {
      const px = startX + (aM / state.stringLengthM) * stringWidthPx;
      const gfx = new PIXI.Graphics();
      gfx.poly([px - 6, centerY + 6, px + 6, centerY + 6, px, centerY - 6]).fill({ color: 0x34d399 });

      const txt = new PIXI.Text({
        text: 'A',
        style: { fontSize: 10, fill: 0x34d399, fontWeight: 'bold', fontFamily: 'monospace' },
      });
      txt.anchor.set(0.5);
      txt.x = px;
      txt.y = centerY - 16;

      container.addChild(gfx);
      container.addChild(txt);
    });
  };

  const drawAirColumnTubeRig = (
    bgGfx: PIXI.Graphics,
    waveGfx: PIXI.Graphics,
    nodesContainer: PIXI.Container,
    width: number,
    height: number,
    state: ResonanceState,
    tSec: number
  ) => {
    bgGfx.clear();
    waveGfx.clear();
    nodesContainer.removeChildren();

    bgGfx.rect(0, 0, width, height).fill({ color: 0x030712 });

    const startX = 140;
    const tubeWidthPx = state.tubeLengthM * 340;
    const centerY = height / 2;

    // Transparent Resonance Tube
    bgGfx.rect(startX, centerY - 40, tubeWidthPx, 80).fill({ color: 0x0f172a });
    bgGfx.rect(startX, centerY - 40, tubeWidthPx, 80).stroke({ width: 3, color: 0x38bdf8 });

    // Closed End (Left or Right)
    if (state.tubeBoundary === 'CLOSED_ONE_END') {
      bgGfx.rect(startX - 10, centerY - 45, 10, 90).fill({ color: 0x334155 });
    }

    // Longitudinal Air Displacement Particles
    const omega = 2 * Math.PI * state.driverFrequencyHz;
    const ampPx = Math.min(30, state.responseAmplitude * 15);

    waveGfx.setStrokeStyle({ width: 2, color: state.isAtResonance ? 0x34d399 : 0x38bdf8, alpha: 0.8 });
    for (let px = 10; px < tubeWidthPx; px += 16) {
      const xM = (px / tubeWidthPx) * state.tubeLengthM;
      const disp = ampPx * Math.sin((Math.PI * xM * (state.activeHarmonicMode || 1)) / state.tubeLengthM) * Math.cos(omega * tSec);
      waveGfx.moveTo(startX + px + disp, centerY - 30).lineTo(startX + px + disp, centerY + 30).stroke();
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors ${
      isLight ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* Top Header Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10 pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs shadow-md backdrop-blur-md ${
          isLight ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>SPEED v: <span className="font-mono font-bold text-sky-400">{resonanceState.waveSpeedMps} m/s</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>f₁: <span className="font-mono font-bold text-purple-400">{resonanceState.fundamentalFreqHz} Hz</span></div>
          <div className="w-[1px] h-4 bg-slate-400/40" />
          <div>ACTIVE MODE: <span className="font-mono font-bold text-emerald-400">n = {resonanceState.activeHarmonicMode || 'None'}</span></div>
        </div>

        {/* View Mode & Overlay Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleNodesAntinodes}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              resonanceState.showNodesAntinodes
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            N / A MARKERS
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full flex-1" />

      {/* Footer Diagnostic Status Bar */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className={`text-xs font-mono px-3.5 py-1.5 rounded-lg border ${
          resonanceState.isComplete
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : resonanceState.isAtResonance
            ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          {resonanceState.statusText}
        </div>
      </div>
    </div>
  );
};
