import React from 'react';
import { Compass, MessageSquare, MapPin } from 'lucide-react';

interface MobileNavProps {
  mobileTab: 'controls' | 'chat' | 'deck';
  setMobileTab: (tab: 'controls' | 'chat' | 'deck') => void;
}

const MobileNav = React.memo(function MobileNav({ mobileTab, setMobileTab }: MobileNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20 flex-shrink-0"
    >
      <button
        onClick={() => setMobileTab('controls')}
        aria-current={mobileTab === 'controls' ? 'page' : undefined}
        aria-label="Controls Tab"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md ${
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
        aria-current={mobileTab === 'chat' ? 'page' : undefined}
        aria-label="AI Assistant Tab"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md ${
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
        aria-current={mobileTab === 'deck' ? 'page' : undefined}
        aria-label="Map and Deck Tab"
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md ${
          mobileTab === 'deck' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <MapPin size={18} className={mobileTab === 'deck' ? 'text-indigo-600' : 'text-slate-400'} />
        <span className="text-[10px] font-semibold">Map & Deck</span>
      </button>
    </nav>
  );
});

export default MobileNav;
