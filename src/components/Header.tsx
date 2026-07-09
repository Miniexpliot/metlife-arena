import React from 'react';

const Header = React.memo(function Header() {
  return (
    <header
      aria-label="Main Application Header"
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0"
    >
      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-100 border border-indigo-500 flex-shrink-0">
          <span className="tracking-tight">W26</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap xs:flex-nowrap">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-none truncate">
              MetLife Arena
            </h1>
            <span className="bg-amber-50 text-amber-700 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide whitespace-nowrap">
              Official Guest Assistant
            </span>
          </div>
          <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5 sm:mt-1 truncate">
            FIFA World Cup 2026 • Live Matchday Updates
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-semibold">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>Live GPS Seat Routing & Map Guides Active</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-3 sm:pl-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-800">FIFA 2026 Arena</p>
            <p className="text-[9px] text-slate-400 uppercase font-semibold">MetLife Stadium, NJ</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm sm:text-lg shadow-sm flex-shrink-0">
            🇺🇸
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;
