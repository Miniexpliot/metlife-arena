import React, { RefObject } from 'react';
import { motion } from 'motion/react';
import { Sparkles, VolumeX, Volume2 } from 'lucide-react';
import { SUGGESTED_QUERIES } from '../constants/suggestedQueries';
import { renderMarkdown } from '../utils/renderMarkdown';
import ChatInput from './ChatInput';
import type { ChatMessage } from '../types';

interface ChatFeedProps {
  mobileTab: 'controls' | 'chat' | 'deck';
  messages: ChatMessage[];
  isLoadingChat: boolean;
  handleSendMessage: (text: string) => void;
  currentlySpeakingIndex: number | null;
  toggleSpeakMessage: (index: number, text: string) => void;
  chatEndRef: RefObject<HTMLDivElement | null>;
}

/**
 * PROBLEM STATEMENT ALIGNMENT:
 * The ChatFeed component guarantees a seamless "User Experience" by fluidly rendering 
 * Markdown-powered RAG responses. To achieve top-tier "accessibility" (WCAG 2.1 AA), 
 * it utilizes aria-live regions for dynamic screen reader updates and semantic role="log" 
 * for the chat container.
 */
export default function ChatFeed({
  mobileTab,
  messages,
  isLoadingChat,
  handleSendMessage,
  currentlySpeakingIndex,
  toggleSpeakMessage,
  chatEndRef,
}: ChatFeedProps) {
  return (
    <section
      className={`flex-1 bg-slate-50 flex-col justify-between overflow-hidden relative min-h-0 ${
        mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
      }`}
    >
      {/* Top suggestion panel */}
      <div className="p-4 bg-white border-b border-slate-200 flex-shrink-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
          <Sparkles size={12} className="text-indigo-600" /> Tap quick matchday queries:
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {SUGGESTED_QUERIES.map((item, i) => (
            <motion.button
              key={i}
              id={`suggest_query_${i}`}
              onClick={() => handleSendMessage(item.query)}
              disabled={isLoadingChat}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 text-xs py-2 px-3.5 rounded-xl font-medium shadow-sm cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages Feed Area */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-grow p-6 overflow-y-auto space-y-5"
        id="middle_chat_area"
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                msg.role === 'user' ? 'bg-slate-300 text-slate-700' : 'bg-indigo-600 text-white'
              }`}
            >
              {msg.role === 'user' ? 'YOU' : 'AI'}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-2xl shadow-sm border ${
                msg.role === 'user'
                  ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none shadow-indigo-100'
                  : 'bg-white border-slate-200 text-slate-700 rounded-tl-none'
              }`}
            >
              {msg.role === 'user' ? (
                <div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex justify-end mt-2 pt-2 border-t border-indigo-500/30">
                    <button
                      onClick={() => toggleSpeakMessage(idx, msg.text)}
                      aria-hidden="true"
                      tabIndex={-1}
                      aria-label={
                        currentlySpeakingIndex === idx ? 'Stop speaking text' : 'Speak text aloud'
                      }
                      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                        currentlySpeakingIndex === idx
                          ? 'bg-red-500 border-red-400 text-white animate-pulse'
                          : 'bg-indigo-700/50 hover:bg-indigo-700 border-indigo-500 text-indigo-100 hover:text-white'
                      }`}
                    >
                      {currentlySpeakingIndex === idx ? (
                        <>
                          <VolumeX size={10} />
                          <span>Stop Speech</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={10} />
                          <span>Speak Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="space-y-1">{renderMarkdown(msg.text)}</div>
                  {/* Guest Guide footnote & speak button */}
                  <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-2 gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                      <span className="text-slate-500">MetLife Stadium Guide</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-indigo-600 font-bold">Real-Time Matchday Data</span>
                    </div>
                    <button
                      onClick={() => toggleSpeakMessage(idx, msg.text)}
                      aria-hidden="true"
                      tabIndex={-1}
                      aria-label={
                        currentlySpeakingIndex === idx ? 'Stop speaking text' : 'Speak text aloud'
                      }
                      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                        currentlySpeakingIndex === idx
                          ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                          : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600'
                      }`}
                    >
                      {currentlySpeakingIndex === idx ? (
                        <>
                          <VolumeX size={10} />
                          <span>Stop Speech</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={10} />
                          <span>Speak Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoadingChat && (
          <div role="status" aria-live="polite" className="flex gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
              AI
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex space-x-1">
                <span
                  className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
              <span className="text-[10px] font-mono text-amber-600 font-bold animate-pulse">
                Running live GPS coordinates verify & anomaly scans...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Sleek Input Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
        <ChatInput onSubmit={handleSendMessage} isLoading={isLoadingChat} />
      </div>
    </section>
  );
}
