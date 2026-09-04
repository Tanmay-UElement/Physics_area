'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Target, Calculator, Rocket, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<number>(1);
  const { setHasCompletedTutorial } = useGameStore();

  if (!isOpen) return null;

  const handleFinish = () => {
    setHasCompletedTutorial(true);
    onClose();
  };

  const steps = [
    {
      id: 1,
      title: "Step 1: Meet Your Avatar Pod",
      icon: <Target className="w-8 h-8 text-cyan-400" />,
      description: "Your cyber pod rides the physics simulation in real-time. Calculate the launch parameters correctly so gravity curves your flight directly onto the target landing pad!",
      badge: "PHYSICS ENGINE SYNC",
    },
    {
      id: 2,
      title: "Step 2: Solve the Kinematics",
      icon: <Calculator className="w-8 h-8 text-emerald-400" />,
      description: "Use height (h) and target distance (d) to calculate flight time t = √(2h/g). Then find horizontal launch velocity v = d / t. Toggle the Formula helper if you need a step-by-step formula guide!",
      badge: "FORMULA & ACCURACY",
    },
    {
      id: 3,
      title: "Step 3: Fire & Earn XP",
      icon: <Rocket className="w-8 h-8 text-amber-400" />,
      description: "Hit FIRE LAUNCHER! Landing within ±5% grants 100 XP (BULLSEYE!). Landing within ±15% earns 40 XP (SO CLOSE!). Every launch earns XP so keep improving your physics precision!",
      badge: "SCORING & TIERS",
    },
  ];

  const currentStepData = steps[step - 1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                s.id === step
                  ? 'w-8 bg-cyan-400'
                  : s.id < step
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
          <span className="ml-auto text-xs font-mono text-slate-400">
            Step {step} of 3
          </span>
        </div>

        {/* Card Content */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
              {currentStepData.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                {currentStepData.badge}
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            {currentStepData.description}
          </p>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Previous
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="text-xs font-semibold text-slate-500 hover:text-slate-400"
            >
              Skip Walkthrough
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>START PLAYING!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
