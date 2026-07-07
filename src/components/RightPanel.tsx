import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { AlertCircle, X, Info } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '../config/env';
import type { StadiumData, GateInfo } from '../types';

interface RightPanelProps {
  mobileTab: 'controls' | 'chat' | 'deck';
  rightActiveTab: 'map' | 'concessions' | 'rules';
  setRightActiveTab: (tab: 'map' | 'concessions' | 'rules') => void;
  detectedCoords: { lat: number; lng: number } | null;
  stadiumData: StadiumData | null;
}

export default function RightPanel({
  mobileTab,
  rightActiveTab,
  setRightActiveTab,
  detectedCoords,
  stadiumData,
}: RightPanelProps) {
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [showTip, setShowTip] = useState<boolean>(true);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [tempKeyInput, setTempKeyInput] = useState<string>('');

  const activeGoogleMapsKey = customApiKey.trim() || GOOGLE_MAPS_API_KEY;
  const isApiKeyValid =
    Boolean(activeGoogleMapsKey) &&
    activeGoogleMapsKey !== 'YOUR_API_KEY' &&
    activeGoogleMapsKey.trim() !== '';

  return (
    <aside
      className={`w-full lg:w-80 bg-slate-50 lg:border-l border-slate-200 flex-col overflow-hidden flex-shrink-0 flex-1 lg:flex-none min-h-0 ${
        mobileTab === 'deck' ? 'flex' : 'hidden lg:flex'
      }`}
    >
      {/* Deck selector */}
      <div
        role="tablist"
        aria-label="Stadium information panels"
        className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 p-1"
      >
        <button
          role="tab"
          id="tab-map"
          aria-selected={rightActiveTab === 'map'}
          aria-controls="tabpanel-map"
          onClick={() => setRightActiveTab('map')}
          className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            rightActiveTab === 'map'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🗺️ Crowd Map
        </button>
        <button
          role="tab"
          id="tab-concessions"
          aria-selected={rightActiveTab === 'concessions'}
          aria-controls="tabpanel-concessions"
          onClick={() => setRightActiveTab('concessions')}
          className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            rightActiveTab === 'concessions'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🍔 Concessions
        </button>
        <button
          role="tab"
          id="tab-rules"
          aria-selected={rightActiveTab === 'rules'}
          aria-controls="tabpanel-rules"
          onClick={() => setRightActiveTab('rules')}
          className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            rightActiveTab === 'rules'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          ⚠️ Safety Rules
        </button>
      </div>

      {/* Deck Body Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* TAB 1: CROWD MAP */}
        {rightActiveTab === 'map' && (
          <div role="tabpanel" id="tabpanel-map" aria-labelledby="tab-map" className="space-y-4">
            {/* Real Live GPS Google Map */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Live GPS Satellite Map
                </span>
                <a
                  href="https://maps.google.com/?q=MetLife+Stadium"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open MetLife Stadium in Google Maps"
                  className="text-[9px] bg-indigo-600 text-white px-2 py-1 rounded-md font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:scale-105 transition-all animate-pulse"
                >
                  Open in Maps ↗️
                </a>
              </div>
              {!isApiKeyValid ? (
                <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between border border-slate-800 relative overflow-hidden shadow-inner aspect-square text-left">
                  <div className="absolute inset-0 bg-slate-950 opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

                  <div className="relative z-10 flex-grow flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                      <AlertCircle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Maps API Key Required
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
                      To render real-time GPS tracking and live MetLife Stadium coordinate maps,
                      configure your key using either method below:
                    </p>

                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                      <span className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
                        Option A: Quick Activation (Instant)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          aria-label="Google Maps API key"
                          value={tempKeyInput}
                          onChange={(e) => setTempKeyInput(e.target.value)}
                          placeholder="Paste Google Maps API key..."
                          className="flex-1 text-[11px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-mono placeholder:text-slate-600"
                        />
                        <button
                          aria-label="Activate Google Maps API key"
                          onClick={() => {
                            if (tempKeyInput.trim()) {
                              setCustomApiKey(tempKeyInput.trim());
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg px-3 py-1 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Activate
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-[9px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                      <p className="font-semibold text-slate-300 uppercase tracking-wide text-[8px]">
                        Option B: Persistent Workspace Secret
                      </p>
                      <p>
                        1. Open <strong className="text-white">Settings</strong> (⚙️ gear icon,
                        top-right of AI Studio)
                      </p>
                      <p>
                        2. Go to the <strong className="text-white">Secrets</strong> tab
                      </p>
                      <p>
                        3. Add variable name{' '}
                        <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono">
                          GOOGLE_MAPS_PLATFORM_KEY
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[8px] text-slate-400">
                    <span>Console: console.cloud.google.com</span>
                    <span className="text-amber-500 animate-pulse font-mono font-bold">
                      Waiting for Secret...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200">
                    <APIProvider apiKey={activeGoogleMapsKey} version="weekly">
                      <Map
                        center={detectedCoords || { lat: 40.8135, lng: -74.0744 }}
                        zoom={16}
                        mapId="smart_stadium_map"
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <AdvancedMarker
                          position={detectedCoords || { lat: 40.8135, lng: -74.0744 }}
                        >
                          <Pin background="#4f46e5" glyphColor="#fff" />
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-200 text-[9px] text-slate-800 shadow-sm">
                      <span className="flex items-center gap-1">📍 Live GPS Coordinates</span>
                      <span className="font-mono text-indigo-600 font-bold uppercase tracking-wider">
                        Sync Live
                      </span>
                    </div>
                  </div>

                  {/* Expandable Key Settings panel */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-sm">
                    <button
                      onClick={() => setShowKeyConfig(!showKeyConfig)}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        🔑{' '}
                        {customApiKey
                          ? 'Manage Custom Credentials'
                          : 'Use Your Own Google Maps Key'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">
                        {showKeyConfig ? '▼ Close' : '▲ Expand'}
                      </span>
                    </button>

                    {showKeyConfig && (
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 animate-fade-in">
                        <p className="text-[9px] text-slate-500 leading-normal">
                          The map is currently running on the 2026 World Cup demo key. If you
                          wish to use your own Google Cloud Maps API Key:
                        </p>
                        <div className="flex gap-1.5">
                          <input
                            type="password"
                            aria-label="Custom Google Maps API key"
                            value={tempKeyInput}
                            onChange={(e) => setTempKeyInput(e.target.value)}
                            placeholder={
                              customApiKey
                                ? '••••••••••••••••••••••••'
                                : 'Paste your API Key...'
                            }
                            className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-mono placeholder:text-slate-400"
                          />
                          <button
                            aria-label="Save custom Google Maps API key"
                            onClick={() => {
                              if (tempKeyInput.trim()) {
                                setCustomApiKey(tempKeyInput.trim());
                                setTempKeyInput('');
                                setShowKeyConfig(false);
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                          >
                            Save Key
                          </button>
                        </div>
                        {customApiKey && (
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[8px] text-slate-400">
                              Active for this session only.
                            </span>
                            <button
                              aria-label="Reset to default demo API key"
                              onClick={() => {
                                setCustomApiKey('');
                                setTempKeyInput('');
                                setShowKeyConfig(false);
                              }}
                              className="text-[9px] text-red-500 hover:text-red-600 font-bold transition-all cursor-pointer"
                            >
                              Reset to Demo Key
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gate wait times list */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Entry Gate Wait Times
              </span>
              <button
                aria-label="View live crowd map"
                className="sr-only"
                onClick={() => setRightActiveTab('map')}
              >
                View map
              </button>
              {stadiumData ? (
                (Object.entries(stadiumData.gateStatus) as [string, GateInfo][])
                  .slice(0, 4)
                  .map(([gate, info]) => (
                    <div
                      key={gate}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-800">{gate}</span>
                        <p className="text-[9px] text-slate-400">{info.status}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-indigo-700">
                          {info.securityWaitMinutes} min
                        </span>
                        <p className="text-[8px] text-slate-400">{info.crowdDensity} flow</p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-2">Loading data...</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONCESSIONS */}
        {rightActiveTab === 'concessions' && (
          <div role="tabpanel" id="tabpanel-concessions" aria-labelledby="tab-concessions" className="space-y-4">
            <div className="border-b border-slate-200 pb-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Concessions Database
              </span>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Used as context grounding for Gemini answers
              </p>
            </div>

            <div className="space-y-3">
              {stadiumData?.sectors.map((sector) => (
                <div key={sector.id} className="space-y-2">
                  <div className="bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wide flex justify-between">
                    <span>{sector.id}</span>
                    <span className="text-slate-500 font-normal">
                      {sector.gates.join(', ')}
                    </span>
                  </div>

                  {(sector.concessions || []).map((stall, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                            🍔 {stall.name}
                          </span>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            📍 {stall.location}
                          </p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold border border-indigo-100 shadow-sm flex items-center gap-1">
                          ⏳ {stall.waitTimeMinutes}m
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-2 italic">
                        Cuisine: {stall.cuisine}
                      </p>

                      <div className="bg-slate-50 rounded-lg p-2 mb-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Menu Highlights
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {stall.menu.map((item, mIdx) => (
                            <span
                              key={mIdx}
                              className="bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md shadow-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        {(stall.vegetarianOptions || []).length > 0 && (
                          <span className="text-[9px] text-green-700 bg-green-50 border border-green-200 font-bold px-1.5 py-0.5 rounded-md">
                            🌱 VEG
                          </span>
                        )}
                        {(stall.veganOptions || []).length > 0 && (
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-1.5 py-0.5 rounded-md">
                            🍃 VEGAN
                          </span>
                        )}
                        {(stall.glutenFreeOptions || []).length > 0 && (
                          <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-200 font-bold px-1.5 py-0.5 rounded-md">
                            🌾 GF
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SAFETY RULES */}
        {rightActiveTab === 'rules' && (
          <div role="tabpanel" id="tabpanel-rules" aria-labelledby="tab-rules" className="space-y-4">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Emergency Contact info
              </span>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
                <p className="font-bold flex items-center gap-1">
                  🚨 Dispatch Medical Hotline:
                </p>
                <p className="text-base font-mono font-bold mt-1 text-red-700">
                  +1 (555) 911-2026
                </p>
                <p className="text-[10px] text-red-600 mt-1 leading-relaxed">
                  Call or tap the left-sidebar "Emergency Assistance" button to request
                  immediate security deployment.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ground Safety Protocol
              </span>
              {(stadiumData?.emergencyInfo?.rules || []).map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex gap-2"
                >
                  <span className="font-bold text-indigo-600">{idx + 1}</span>
                  <p className="text-[11px] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side Tip Banner */}
      {showTip && (
        <div className="p-4 bg-indigo-50 border-t border-slate-200 relative">
          <button
            onClick={() => setShowTip(false)}
            className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600 transition-colors"
            aria-label="Dismiss tip"
          >
            <X size={14} />
          </button>
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-3 flex gap-2.5 mt-2 shadow-sm">
            <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-indigo-900 uppercase text-[9px] tracking-wider mb-0.5">
                SMART COMPANION TIP
              </p>
              <p className="text-[10px] text-indigo-800/80 leading-relaxed">
                Try asking the AI something like{' '}
                <strong>"Where can I get vegetarian food near my seat?"</strong> or{' '}
                <strong>"How long is the wait at the nearest gate?"</strong> The AI reads your
                live GPS and the stadium database to give you a perfect, customized answer!
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
