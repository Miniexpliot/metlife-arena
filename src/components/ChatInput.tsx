import React, { useState } from 'react';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const ChatInput = React.memo(function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    onSubmit(inputMessage);
    setInputMessage('');
  };

  return (
    <form id="input_form" onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        id="message_text_input"
        aria-label="Chat message input"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        disabled={isLoading}
        placeholder="Ask about food, gate wait times, policies, or request translations..."
        className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-6 pr-24 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
      />
      <div className="absolute right-2 flex gap-1">
        <button
          type="submit"
          aria-label="Send message"
          disabled={!inputMessage.trim() || isLoading}
          className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          SEND
        </button>
      </div>
    </form>
  );
});

export default ChatInput;
