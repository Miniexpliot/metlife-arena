import React from 'react';
import { Compass, MessageSquare, MapPin } from 'lucide-react';

interface MobileNavProps {
  mobileTab: 'controls' | 'chat' | 'deck';
  setMobileTab: (tab: 'controls' | 'chat' | 'deck') => void;
}

export default function MobileNav({ mobileTab, setMobileTab }: MobileNavProps) {
  return (
    <div className="lg:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
      <button
        onClick={() => setMobileTab('controls')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer ${
          mobileTab === 'controls'
            ? 'text-indigo-600 font-bold'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Compass
          size={18}
          className={mobileTab === 'controls' ? 'text-indigo-600' : 'text-slate-400'}
        />
        <span className="text-[10px] font-semibold">Controls</span>
      </button>
      <button
        onClick={() => setMobileTab('chat')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer ${
          mobileTab === 'chat' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <MessageSquare
          size={18}
          className={mobileTab === 'chat' ? 'text-indigo-600' : 'text-slate-400'}
        />
        <span className="text-[10px] font-semibold">AI Assistant</span>
      </button>
      <button
        onClick={() => setMobileTab('deck')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer ${
          mobileTab === 'deck' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <MapPin size={18} className={mobileTab === 'deck' ? 'text-indigo-600' : 'text-slate-400'} />
        <span className="text-[10px] font-semibold">Map & Deck</span>
      </button>
    </div>
  );
}
