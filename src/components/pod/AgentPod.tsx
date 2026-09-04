'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getPodBriefing } from '@/lib/pod/podBriefings';
import { getAgentProfile } from '@/lib/pod/agentRegistry';
import { PodChatPanel } from './PodChatPanel';
import { Bot, Zap, Radio, Sparkles, Volume2, VolumeX, X } from 'lucide-react';

export const AgentPod: React.FC = () => {
  const { activeMode, theme, isSimulating, simulationResult, currentRound, activeAgentId } = useGameStore();

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(true);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  const agent = getAgentProfile(activeAgentId || 'aura-9');
  const briefing = getPodBriefing(activeMode);
  const isLight = theme === 'light';

  const renderAgentIcon = (iconName: 'Bot' | 'Zap' | 'Radio' | 'Sparkles', className: string) => {
    if (iconName === 'Zap') return <Zap className={className} />;
    if (iconName === 'Radio') return <Radio className={className} />;
    if (iconName === 'Sparkles') return <Sparkles className={className} />;
    return <Bot className={className} />;
  };

  // Speak text verbally out loud using Web Speech API
  const speakTextOutLoud = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = agent.speechPitch;
    utterance.rate = agent.speechRate;

    utterance.onstart = () => setIsSpeakingAudio(true);
    utterance.onend = () => setIsSpeakingAudio(false);
    utterance.onerror = () => setIsSpeakingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Auto-expand speech bubble on round change & speak greeting
  useEffect(() => {
    const text = `${agent.name}: ${briefing.goalLine} ${briefing.controlsLine}`;
    setSpeechBubbleText(text);
    setShowSpeechBubble(true);

    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [activeMode, currentRound?.id, agent.id]);

  // Auto-expand speech bubble post-simulation with Hit/Miss reaction
  useEffect(() => {
    if (simulationResult) {
      let reaction = '';
      if (simulationResult.tier === 'hit') {
        const pool = briefing.hitReactions;
        reaction = pool[Math.floor(Math.random() * pool.length)] || 'Direct hit! Excellent physics work.';
      } else {
        const pool = briefing.missReactions;
        reaction = pool[Math.floor(Math.random() * pool.length)] || 'Good attempt! Check your calculations and try again.';
      }
      const fullText = `${agent.name}: ${reaction}`;
      setSpeechBubbleText(fullText);
      setShowSpeechBubble(true);
      speakTextOutLoud(reaction);
    }
  }, [simulationResult]);

  return (
    <>
      {/* Floating Pod Avatar Container */}
      <div className="fixed bottom-6 right-6 z-40 flex items-end gap-3 pointer-events-none">
        {/* Contextual Verbal Speech Bubble */}
        {showSpeechBubble && speechBubbleText && !isChatOpen && (
          <div className="pointer-events-auto max-w-xs p-4 rounded-3xl bg-slate-900/95 border border-sky-500/50 shadow-2xl text-slate-100 text-xs font-sans animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-md relative">
            <button
              type="button"
              onClick={() => {
                setShowSpeechBubble(false);
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${agent.badgeBorderClass} ${agent.badgeBgClass} ${agent.textAccentClass}`}>
                {agent.name} • {agent.title}
              </span>

              <button
                type="button"
                onClick={() => speakTextOutLoud(speechBubbleText)}
                className={`p-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                  isSpeakingAudio ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse' : 'bg-slate-950 border-slate-800 text-sky-400 hover:bg-slate-800'
                }`}
                title="Listen to Agent speak verbal explanation"
              >
                <Volume2 className="w-3 h-3" />
                <span>{isSpeakingAudio ? 'SPEAKING...' : 'LISTEN'}</span>
              </button>
            </div>

            <p className="leading-relaxed font-medium text-slate-200">{speechBubbleText}</p>

            <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] pt-2 border-t border-slate-800/80">
              <span className={`font-bold flex items-center gap-1 ${agent.textAccentClass}`}>
                {renderAgentIcon(agent.avatarIconName, 'w-3 h-3')} {agent.role}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowSpeechBubble(false);
                  setIsChatOpen(true);
                }}
                className="text-purple-400 hover:underline font-bold"
              >
                EXPLAIN ROUND →
              </button>
            </div>
          </div>
        )}

        {/* Floating Orb Avatar Button */}
        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          className="pointer-events-auto group relative flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          title={`Open ${agent.name} AI Companion`}
        >
          {/* Outer Glow Ring */}
          <div className={`absolute -inset-2 rounded-3xl bg-gradient-to-r ${agent.gradientClass} opacity-60 blur-md group-hover:opacity-100 animate-pulse transition-all`} />

          {/* Orb Core */}
          <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border-2 border-sky-400 flex items-center justify-center shadow-2xl overflow-hidden">
            {renderAgentIcon(agent.avatarIconName, `w-7 h-7 ${agent.textAccentClass} group-hover:rotate-12 transition-transform duration-300`)}
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
          </div>

          {/* Label Badge */}
          <span className="absolute -top-2 -right-2 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-sky-500 text-slate-950 shadow-md">
            {agent.name}
          </span>
        </button>
      </div>

      {/* Chat & Hint Panel */}
      <PodChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        modeKey={activeMode}
        telemetry={currentRound}
        theme={theme}
      />
    </>
  );
};
