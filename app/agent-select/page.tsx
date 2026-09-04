'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/useGameStore';
import { POD_AGENTS, AgentId, PodAgentProfile } from '@/lib/pod/agentRegistry';
import { MatchHeader } from '@/components/match/MatchHeader';
import { Bot, Zap, Radio, Sparkles, Volume2, VolumeX, CheckCircle2, ShieldCheck, ArrowRight, Activity, Cpu } from 'lucide-react';

export default function AgentSelectPage() {
  const { activeAgentId, setActiveAgent, theme } = useGameStore();
  const [speakingAgentId, setSpeakingAgentId] = useState<AgentId | null>(null);

  const isLight = theme === 'light';

  const renderAgentIcon = (iconName: 'Bot' | 'Zap' | 'Radio' | 'Sparkles', className: string) => {
    if (iconName === 'Zap') return <Zap className={className} />;
    if (iconName === 'Radio') return <Radio className={className} />;
    if (iconName === 'Sparkles') return <Sparkles className={className} />;
    return <Bot className={className} />;
  };

  const handleSpeakGreeting = (agent: PodAgentProfile) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(agent.introGreeting);
    utterance.pitch = agent.speechPitch;
    utterance.rate = agent.speechRate;

    utterance.onstart = () => {
      setSpeakingAgentId(agent.id);
    };

    utterance.onend = () => {
      setSpeakingAgentId(null);
    };

    utterance.onerror = () => {
      setSpeakingAgentId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950 transition-colors ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <MatchHeader onOpenTutorial={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
                AI COMPANION POD SELECTION
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1">
              SELECT YOUR POD AGENT
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Choose your active AI Pod companion. Each agent features distinct personality traits, physics specializations, and verbal explanations to guide you through physics lab challenges.
            </p>
          </div>

          <Link
            href="/class-select"
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <span>ENTER PHYSICS ARENA</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Agent Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(POD_AGENTS) as AgentId[]).map((agentKey) => {
            const agent = POD_AGENTS[agentKey];
            const isActive = activeAgentId === agent.id;
            const isSpeaking = speakingAgentId === agent.id;

            return (
              <div
                key={agent.id}
                className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-2xl group overflow-hidden ${
                  isActive
                    ? 'bg-slate-900 border-sky-500 shadow-sky-500/20 ring-2 ring-sky-500/30'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Active Indicator Badge */}
                {isActive && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACTIVE AGENT</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Character Avatar Container */}
                  <div className="relative w-20 h-20 rounded-3xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradientClass} opacity-20 group-hover:opacity-40 transition-opacity`} />
                    {renderAgentIcon(agent.avatarIconName, `w-10 h-10 ${agent.textAccentClass}`)}

                    {/* Audio Wave Animated Bar when speaking */}
                    {isSpeaking && (
                      <div className="absolute bottom-2 flex items-center gap-1">
                        <span className="w-1 h-3 bg-sky-400 animate-pulse" />
                        <span className="w-1 h-4 bg-emerald-400 animate-pulse delay-75" />
                        <span className="w-1 h-2 bg-amber-400 animate-pulse delay-150" />
                      </div>
                    )}
                  </div>

                  {/* Character Meta */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black">{agent.name}</h2>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${agent.badgeBorderClass} ${agent.badgeBgClass} ${agent.textAccentClass}`}>
                        {agent.title}
                      </span>
                    </div>
                    <p className={`text-xs font-mono font-bold mt-1 ${agent.textAccentClass}`}>
                      {agent.role}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {agent.personality}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider">PHYSICS SPECIALTY:</span>
                    <p className="text-slate-300 font-bold">{agent.specialty}</p>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="space-y-3 pt-6 border-t border-slate-800/80 mt-6">
                  {/* Test Voice & Audio Explanation Button */}
                  <button
                    type="button"
                    onClick={() => handleSpeakGreeting(agent)}
                    className={`w-full py-2.5 px-4 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isSpeaking
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Activity className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>SPEAKING EXPLANATION...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-sky-400" />
                        <span>HEAR VOICE EXPLANATION</span>
                      </>
                    )}
                  </button>

                  {/* Select Agent Button */}
                  <button
                    type="button"
                    onClick={() => setActiveAgent(agent.id)}
                    className={`w-full py-3 px-4 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 cursor-default shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 active:scale-95 shadow-sky-500/25'
                    }`}
                  >
                    {isActive ? 'SELECTED COMPANION' : `ACTIVATE ${agent.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
