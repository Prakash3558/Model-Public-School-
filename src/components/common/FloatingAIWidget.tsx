import React, { useState } from 'react';
import { Bot, Sparkles, X, MessageSquare } from 'lucide-react';
import { AIHomeworkTutor } from './AIHomeworkTutor';

export const FloatingAIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 hover:from-amber-500 hover:to-amber-600 text-white hover:text-slate-950 px-4 py-3 rounded-full shadow-2xl border-2 border-amber-400/80 transition-all duration-300 hover:scale-105 active:scale-95"
          title="Open AI Homework Tutor"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-amber-400 group-hover:text-slate-950 transition-colors" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black font-heading tracking-wide flex items-center gap-1">
              Homework AI Assistant
              <Sparkles className="w-3 h-3 text-amber-300 group-hover:text-slate-950" />
            </span>
            <span className="text-[10px] text-slate-300 group-hover:text-slate-900 font-medium leading-none">
              Get Instant CBSE Help
            </span>
          </div>
        </button>
      )}

      {/* Homework Tutor Floating Window */}
      {isOpen && (
        <AIHomeworkTutor
          isWidgetMode={true}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
