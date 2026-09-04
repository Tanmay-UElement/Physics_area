'use client';

import React from 'react';
import { Atom } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading?: boolean;
  conceptName?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = true,
  conceptName = 'Physics Arena',
}) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      {/* Branded Loading Avatar Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-1 animate-pulse shadow-2xl shadow-cyan-500/30">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Atom className="w-10 h-10 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-cyan-500 text-slate-950 text-[10px] font-mono font-black uppercase">
          2D ENGINE
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-1">
        Initializing {conceptName} Engine
      </h3>
      <p className="text-xs text-slate-400 max-w-xs mb-6">
        Setting up collision bodies, target landing zones, and kinematic vector solvers...
      </p>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full animate-pulse w-3/4" />
      </div>
    </div>
  );
};
