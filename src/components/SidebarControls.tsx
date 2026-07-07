import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ChevronDown, Compass, Globe, Shield, AlertCircle } from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../constants/languages';
import type { ChatMessage } from '../types';

interface SidebarControlsProps {
  mobileTab: 'controls' | 'chat' | 'deck';
  setMobileTab: (tab: 'controls' | 'chat' | 'deck') => void;
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;
  isLocationDropdownOpen: boolean;
  setIsLocationDropdownOpen: (open: boolean) => void;
  allLocationOptions: string[];
  gpsLoading: boolean;
  handleDetectLocation: () => void;
  detectedCoords: { lat: number; lng: number } | null;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  vitals: { waitTime: string; density: string; flow: string };
  setRightActiveTab: (tab: 'map' | 'concessions' | 'rules') => void;
  handleSendMessage: (text: string) => void;
  addMessage: (msg: ChatMessage) => void;
}

export default function SidebarControls({
  mobileTab,
  setMobileTab,
  currentLocation,
  setCurrentLocation,
  isLocationDropdownOpen,
  setIsLocationDropdownOpen,
  allLocationOptions,
  gpsLoading,
  handleDetectLocation,
  detectedCoords,
  selectedLanguage,
  setSelectedLanguage,
  vitals,
  setRightActiveTab,
  handleSendMessage,
  addMessage,
}: SidebarControlsProps) {
  return (
    <aside
      className={`w-full lg:w-72 bg-white lg:border-r border-slate-200 p-5 flex-col gap-6 overflow-y-auto flex-shrink-0 flex-1 lg:flex-none min-h-0 ${
        mobileTab === 'controls' ? 'flex' : 'hidden lg:flex'
      }`}
    >
      {/* Status Label */}
      <div>
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Your Status
        </span>
        <div className="space-y-4">
          <div className="relative">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <MapPin size={14} className="text-indigo-600" /> Current Location
            </span>
            <button
              id="location-dropdown-btn"
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' && !isLocationDropdownOpen) {
                  e.preventDefault();
                  setIsLocationDropdownOpen(true);
                  setTimeout(() => {
                    const firstOpt = document.querySelector('[role="option"]') as HTMLElement;
                    firstOpt?.focus();
                  }, 50);
                }
              }}
              aria-expanded={isLocationDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select Current Location"
              className="w-full flex justify-between items-center text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-medium text-slate-700 mb-2 transition-all cursor-pointer"
            >
              <span className="truncate">{currentLocation || 'Select your location...'}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  isLocationDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isLocationDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  role="listbox"
                  aria-label="Location options"
                  className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 shadow-xl rounded-lg mt-1 max-h-60 overflow-y-auto"
                >
                  {allLocationOptions.map((opt) => (
                    <div
                      key={opt}
                      role="option"
                      aria-selected={currentLocation === opt}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCurrentLocation(opt);
                          setIsLocationDropdownOpen(false);
                          addMessage({
                            role: 'model',
                            text: `📍 GPS relocated to **${opt}**. Sector-grounded concessions, medical aid, and gate routes are now prioritized for you.`,
                          });
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const next = (e.currentTarget.nextElementSibling ||
                            e.currentTarget.parentElement?.firstElementChild) as HTMLElement;
                          next?.focus();
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const prev = (e.currentTarget.previousElementSibling ||
                            e.currentTarget.parentElement?.lastElementChild) as HTMLElement;
                          prev?.focus();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsLocationDropdownOpen(false);
                          document.getElementById('location-dropdown-btn')?.focus();
                        }
                      }}
                      onClick={() => {
                        setCurrentLocation(opt);
                        setIsLocationDropdownOpen(false);
                        addMessage({
                          role: 'model',
                          text: `📍 GPS relocated to **${opt}**. Sector-grounded concessions, medical aid, and gate routes are now prioritized for you.`,
                        });
                      }}
                      className={`px-3 py-2 text-xs cursor-pointer hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset ${
                        currentLocation === opt
                          ? 'bg-indigo-50/50 text-indigo-700 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auto-detect button */}
          <button
            id="gps_detect_btn"
            aria-label="Detect GPS Location"
            aria-busy={gpsLoading}
            onClick={handleDetectLocation}
            disabled={gpsLoading}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-[11.5px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {gpsLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing GPS Satellites...</span>
              </>
            ) : (
              <>
                <Compass size={14} className="text-white animate-pulse" />
                <span>Detect My Seat GPS</span>
              </>
            )}
          </button>

          {detectedCoords && (
            <p className="text-[10px] text-emerald-600 font-mono mt-1.5 text-center font-bold bg-emerald-50 border border-emerald-100 py-1 rounded">
              📡 Lat: {detectedCoords.lat.toFixed(5)} | Lng: {detectedCoords.lng.toFixed(5)}
            </p>
          )}
          <p className="text-[9px] text-slate-400 mt-1 italic">
            Guides the AI Assistant to recommend closest points of interest
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <span className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
            <Globe size={14} className="text-indigo-600" /> Assistant Language
          </span>
          <div className="flex gap-2.5">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSelectedLanguage(lang.code);
                  addMessage({
                    role: 'model',
                    text: `🌐 Language preference switched to **${lang.name}**. Your future AI queries will adapt translations automatically.`,
                  });
                }}
                title={lang.name}
                aria-label={`Change language to ${lang.name}`}
                aria-pressed={selectedLanguage === lang.code}
                className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm transition-all ${
                  selectedLanguage === lang.code
                    ? 'ring-2 ring-indigo-500 bg-indigo-50 scale-110'
                    : 'bg-slate-50 border border-slate-200 hover:scale-110 hover:bg-white cursor-pointer opacity-70 hover:opacity-100'
                }`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vitals Panel */}
      <div>
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Stadium Vitals
        </span>
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Crowd Density</p>
            <div className="flex items-end justify-between mt-1">
              <span
                className={`text-base font-bold ${
                  vitals.density === 'High'
                    ? 'text-red-600'
                    : vitals.density === 'Medium'
                      ? 'text-amber-600'
                      : 'text-green-600'
                }`}
              >
                {vitals.density}
                <span className="sr-only">Crowd density level: {vitals.density}</span>
              </span>
              <button
                aria-label="View live crowd density map"
                className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold border border-indigo-200 transition-all shadow-sm active:scale-95"
                onClick={() => {
                  setRightActiveTab('map');
                  setMobileTab('deck');
                }}
              >
                <MapPin size={12} /> Live Map
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              Security Wait Time
            </p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-base font-bold text-slate-800">{vitals.waitTime}</span>
              <span className="text-[10px] text-slate-500 font-medium pb-0.5">{vitals.flow}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Overview snippet */}
      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
        <h4 className="text-[11px] font-bold text-indigo-900 uppercase flex items-center gap-1.5 mb-1">
          <Shield size={12} className="text-indigo-600" /> Arena Bag Policy
        </h4>
        <p className="text-[10px] text-indigo-950 leading-relaxed">
          Clear plastic bags only (under 12x6x12"). Clutch purses must be smaller than 4.5x6.5".
        </p>
      </div>

      {/* Emergency button */}
      <div className="mt-auto pt-4">
        <button
          id="emergency_btn"
          aria-label="Request emergency assistance and locate nearest first aid station"
          onClick={() => {
            setMobileTab('chat');
            handleSendMessage(
              'HELP: What is the emergency medical phone number and where is the nearest first aid Alpha station?'
            );
          }}
          className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md shadow-red-100 hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <AlertCircle size={14} className="animate-pulse" /> Emergency Assistance
        </button>
      </div>
    </aside>
  );
}
