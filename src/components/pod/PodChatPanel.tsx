'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getPodBriefing } from '@/lib/pod/podBriefings';
import { getAgentProfile } from '@/lib/pod/agentRegistry';
import { Send, Bot, Zap, Radio, Sparkles, Volume2, X, Lightbulb, BookOpen, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'pod' | 'user';
  text: string;
  timestamp: string;
}

interface PodChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  modeKey: string;
  telemetry?: any;
  theme: 'dark' | 'light';
}

export const PodChatPanel: React.FC<PodChatPanelProps> = ({
  isOpen,
  onClose,
  modeKey,
  telemetry,
  theme,
}) => {
  const { activeAgentId } = useGameStore();
  const agent = getAgentProfile(activeAgentId || 'aura-9');
  const briefing = getPodBriefing(modeKey);
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'chat' | 'hints' | 'briefing'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'pod',
      text: `${agent.introGreeting} ${briefing.goalLine}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unlockedHintTier, setUnlockedHintTier] = useState<number>(1);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  if (!isOpen) return null;

  const renderAgentIcon = (iconName: 'Bot' | 'Zap' | 'Radio' | 'Sparkles', className: string) => {
    if (iconName === 'Zap') return <Zap className={className} />;
    if (iconName === 'Radio') return <Radio className={className} />;
    if (iconName === 'Sparkles') return <Sparkles className={className} />;
    return <Bot className={className} />;
  };

  const handleSpeakText = (text: string) => {
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

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/pod-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          modeKey,
          conceptName: briefing.conceptName,
          telemetry,
        }),
      });

      const data = await res.json();
      const podText = data.answer || briefing.nudgeHint;

      const podMsg: ChatMessage = {
        id: `pod-${Date.now()}`,
        sender: 'pod',
        text: podText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, podMsg]);
      handleSpeakText(podText);
    } catch (e) {
      const podMsg: ChatMessage = {
        id: `pod-err-${Date.now()}`,
        sender: 'pod',
        text: briefing.nudgeHint,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, podMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[540px] rounded-3xl border shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 ${
      isLight ? 'bg-slate-900/95 border-sky-500/40 text-slate-100' : 'bg-slate-950/95 border-sky-500/40 text-slate-100'
    }`}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${agent.gradientClass} flex items-center justify-center shadow-lg shadow-sky-500/30`}>
              {renderAgentIcon(agent.avatarIconName, 'w-5 h-5 text-slate-950 font-bold')}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-sm tracking-wide ${agent.textAccentClass}`}>
                {agent.name}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${agent.badgeBorderClass} ${agent.badgeBgClass} ${agent.textAccentClass} font-bold`}>
                {agent.title}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">{briefing.conceptName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/agent-select"
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 hover:bg-slate-800 text-xs font-mono font-bold flex items-center gap-1"
            title="Switch Active Agent"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="text-[10px]">SWITCH</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`py-2.5 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chat'
              ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>EXPLAIN</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hints')}
          className={`py-2.5 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'hints'
              ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>HINTS ({unlockedHintTier}/3)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('briefing')}
          className={`py-2.5 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'briefing'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>BRIEFING</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {activeTab === 'chat' && (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'pod' && (
                  <div className={`w-6 h-6 rounded-xl ${agent.badgeBgClass} border ${agent.badgeBorderClass} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {renderAgentIcon(agent.avatarIconName, `w-3.5 h-3.5 ${agent.textAccentClass}`)}
                  </div>
                )}
                <div className={`max-w-[84%] p-3.5 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-1.5'
                }`}>
                  <p className="leading-relaxed">{m.text}</p>

                  {m.sender === 'pod' && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono text-[9px]">
                      <button
                        type="button"
                        onClick={() => handleSpeakText(m.text)}
                        className={`px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                          isSpeakingAudio ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse' : 'bg-slate-950 border-slate-800 text-sky-400 hover:bg-slate-800'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>LISTEN AUDIO</span>
                      </button>
                      <span className="opacity-60">{m.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-400 font-mono text-[11px]">
                {renderAgentIcon(agent.avatarIconName, `w-4 h-4 ${agent.textAccentClass} animate-spin`)}
                <span>{agent.name} is deriving physics equations...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hints' && (
          <div className="space-y-4 font-mono">
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
              💡 <strong>Hint Ladder:</strong> {agent.name} provides progressive clues without spoiling the exact answer!
            </div>

            {/* Tier 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                <span>TIER 1: CONCEPT NUDGE</span>
                <span className="text-[10px] text-emerald-400 font-bold">UNLOCKED</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">{briefing.nudgeHint}</p>
            </div>

            {/* Tier 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                <span>TIER 2: FORMULA REVEAL</span>
                {unlockedHintTier >= 2 ? (
                  <span className="text-[10px] text-emerald-400 font-bold">UNLOCKED</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUnlockedHintTier(2)}
                    className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 hover:bg-purple-500/30"
                  >
                    UNLOCK TIER 2
                  </button>
                )}
              </div>
              {unlockedHintTier >= 2 ? (
                <p className="text-purple-300 font-mono text-xs font-bold bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {briefing.formulaHint}
                </p>
              ) : (
                <p className="text-slate-500 text-[11px] italic">Unlock to reveal governing physics equations.</p>
              )}
            </div>

            {/* Tier 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>TIER 3: WORKED STRUCTURE</span>
                {unlockedHintTier >= 3 ? (
                  <span className="text-[10px] text-emerald-400 font-bold">UNLOCKED</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUnlockedHintTier(3)}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 hover:bg-amber-500/30"
                  >
                    UNLOCK TIER 3
                  </button>
                )}
              </div>
              {unlockedHintTier >= 3 ? (
                <p className="text-slate-300 font-sans text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                  {briefing.workedStructure}
                </p>
              ) : (
                <p className="text-slate-500 text-[11px] italic">Unlock step-by-step setup using current values.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'briefing' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                ROUND GOAL
              </span>
              <p className="text-slate-200 leading-relaxed">{briefing.goalLine}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">
                PHYSICAL CONTROLS
              </span>
              <p className="text-slate-200 leading-relaxed">{briefing.controlsLine}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-[11px]">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                GOVERNING EQUATION
              </span>
              <p className="text-amber-300 font-bold bg-slate-950 p-2 rounded-xl border border-slate-800">
                {briefing.formulaHint}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Chips (Chat tab only) */}
      {activeTab === 'chat' && (
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-900 flex items-center gap-2 overflow-x-auto text-[10px] font-mono">
          <button
            type="button"
            onClick={() => handleSendMessage('What equation do I use to solve this?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 font-bold hover:bg-slate-800 whitespace-nowrap"
          >
            📐 Formula?
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('What is the goal of this round?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 font-bold hover:bg-slate-800 whitespace-nowrap"
          >
            🎯 Goal?
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Can you give me a hint?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold hover:bg-slate-800 whitespace-nowrap"
          >
            💡 Hint?
          </button>
        </div>
      )}

      {/* Input Box (Chat tab only) */}
      {activeTab === 'chat' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask ${agent.name} a question...`}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-sans text-xs outline-none focus:border-sky-400 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 font-bold hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4 fill-slate-950" />
          </button>
        </form>
      )}
    </div>
  );
};
