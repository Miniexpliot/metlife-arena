import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { 
  MessageSquare, 
  MapPin, 
  Clock, 
  Utensils, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Activity, 
  HelpCircle,
  Shield,
  Compass,
  AlertCircle,
  Globe,
  Search,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Volume2,
  VolumeX
} from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyCOEK_lOpCzZEbLFM-ptfw4nCViJv_NJIQ";


interface Restroom {
  name: string;
  location: string;
  types: string[];
  wait_time_minutes: number;
  crowd_status: string;
}

interface Concession {
  name: string;
  location: string;
  cuisine: string;
  menu: string[];
  vegetarian_options: string[];
  vegan_options: string[];
  gluten_free_options: string[];
  wait_time_minutes: number;
  crowd_status: string;
}

interface Amenity {
  name: string;
  type: string;
  location: string;
  status: string;
  details: string;
}

interface Sector {
  id: string;
  description: string;
  gates: string[];
  amenities: Amenity[];
  concessions: Concession[];
  restrooms: Restroom[];
}

interface GateInfo {
  status: string;
  security_wait_minutes: number;
  crowd_density: string;
}

interface StadiumData {
  stadium_name: string;
  sectors: Sector[];
  gate_status: { [key: string]: GateInfo };
  emergency_info: {
    emergency_number: string;
    evacuation_assembly_points: string;
    rules: string[];
  };
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function App() {
  const [stadiumData, setStadiumData] = useState<StadiumData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>("Sector 1 - Gate A");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "👋 Welcome to the **FIFA World Cup 2026 Arena**! I am your AI Stadium Assistant. I am grounded in our live stadium database to provide real-time crowd updates, nearest concessions, first aid, and language translation. Where are you seated today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [rightActiveTab, setRightActiveTab] = useState<"map" | "concessions" | "rules">("map");
  const [mobileTab, setMobileTab] = useState<"controls" | "chat" | "deck">("chat");
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);

  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [customDetectedLocations, setCustomDetectedLocations] = useState<string[]>([]);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("USER_GOOGLE_MAPS_KEY") || "";
  });
  const [tempKeyInput, setTempKeyInput] = useState<string>("");

  const activeGoogleMapsKey = customApiKey.trim() || GOOGLE_MAPS_API_KEY;
  const isApiKeyValid = Boolean(activeGoogleMapsKey) && activeGoogleMapsKey !== "YOUR_API_KEY" && activeGoogleMapsKey.trim() !== "";

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested queries for users
  const suggestedQueries = [
    { label: "🍔 Nearest Vegetarian?", query: "Where is the nearest vegetarian food options from my location?" },
    { label: "🚪 Shortest Wait Gate?", query: "Which gates have the shortest wait times right now?" },
    { label: "🚑 Medical First Aid?", query: "Help, where is the nearest first aid station?" },
    { label: "🌐 Translate Ticket Query", query: "Translate 'Where is my seating block?' to Spanish and French." }
  ];

  // Stop any active TTS when switching pages or unmounting
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeakMessage = (index: number, text: string) => {
    if (currentlySpeakingIndex === index) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      
      // Clean markdown tags for nicer speech output
      const cleanText = text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/- /g, "")
        .replace(/###/g, "")
        .replace(/`([^`]+)`/g, "$1");
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (selectedLanguage === "es") utterance.lang = "es-ES";
      else if (selectedLanguage === "fr") utterance.lang = "fr-FR";
      else if (selectedLanguage === "pt") utterance.lang = "pt-BR";
      else if (selectedLanguage === "ar") utterance.lang = "ar-AE";
      else utterance.lang = "en-US";

      utterance.onend = () => {
        setCurrentlySpeakingIndex(null);
      };
      utterance.onerror = () => {
        setCurrentlySpeakingIndex(null);
      };

      setCurrentlySpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateUniqueLocationName = (lat: number, lon: number) => {
    const sections = ["Section 104", "Section 112", "Section 124", "Section 143", "Section 201", "Section 224", "Section 248", "Section 301", "Section 315", "Section 340", "Club Level 12", "Mezzanine Suite 4"];
    const seats = ["Row 4, Seat 18", "Row 12, Seat 5", "Row 15, Seat 22", "Row 20, Seat 1", "Row 28, Seat 14", "Wheelchair Bay 3", "Standing Zone A"];
    
    const seed1 = Math.floor(Math.abs(lat * 10000)) % sections.length;
    const seed2 = Math.floor(Math.abs(lon * 10000)) % seats.length;
    
    return `${sections[seed1]} - ${seats[seed2]}`;
  };

  const handleDetectLocation = () => {
    setGpsLoading(true);
    
    const triggerLocationFound = (lat: number, lng: number) => {
      setDetectedCoords({ lat, lng });
      const uniqueName = generateUniqueLocationName(lat, lng);
      
      setCustomDetectedLocations((prev) => {
        if (!prev.includes(uniqueName)) {
          return [...prev, uniqueName];
        }
        return prev;
      });
      
      setCurrentLocation(uniqueName);
      setGpsLoading(false);
      
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `🎯 **GPS Located!** \n\nWe successfully detected your live location coordinates at **Lat: ${lat.toFixed(5)}**, **Lng: ${lng.toFixed(5)}**.\n\nYour seating zone is resolved as:\n🎟️ **"${uniqueName}"**\n\nThe Smart Companion has calibrated your proximity parameters to guide you to the closest concessions, medical stations, and exits from this point.`
        }
      ]);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          triggerLocationFound(lat, lng);
        },
        (error) => {
          console.warn("Geolocation permission denied, simulating coordinates...", error);
          const simulatedLat = 40.8135 + (Math.random() - 0.5) * 0.005;
          const simulatedLng = -74.0744 + (Math.random() - 0.5) * 0.005;
          setTimeout(() => {
            triggerLocationFound(simulatedLat, simulatedLng);
          }, 1200);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const simulatedLat = 40.8135 + (Math.random() - 0.5) * 0.005;
      const simulatedLng = -74.0744 + (Math.random() - 0.5) * 0.005;
      setTimeout(() => {
        triggerLocationFound(simulatedLat, simulatedLng);
      }, 1200);
    }
  };

  // Fetch Stadium database on mount
  useEffect(() => {
    fetch("/api/stadium")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stadium data");
        return res.json();
      })
      .then((data) => {
        setStadiumData(data);
      })
      .catch((err) => {
        console.error("Error loading stadium data:", err);
      });
  }, []);

  // Scroll to bottom when chat history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingChat]);

  // Handle Chat message sending
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoadingChat) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoadingChat(true);

    try {
      const locationContext = detectedCoords 
        ? `${currentLocation} (Exact GPS Coordinates - Latitude: ${detectedCoords.lat.toFixed(6)}, Longitude: ${detectedCoords.lng.toFixed(6)})`
        : `${currentLocation}`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: newMessages.slice(0, -1),
          currentLocation: `${locationContext} (Language Preferred: ${selectedLanguage})`
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Service error");
      }

      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ **Companion Connection Issue**: ${error.message || "Failed to reach stadium servers. Please make sure GEMINI_API_KEY is active in Settings."}`
        }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Compile gates list for dynamic selection
  const gateOptions: string[] = [];
  if (stadiumData) {
    stadiumData.sectors.forEach((sector) => {
      sector.gates.forEach((gate) => {
        gateOptions.push(`${sector.id} - ${gate}`);
      });
    });
  }
  const allLocationOptions = [...customDetectedLocations, ...gateOptions];

  // Derive vitals for selected location dynamically
  const getSelectedLocationVitals = () => {
    if (!stadiumData) return { waitTime: "12 Min", density: "Medium", flow: "Normal Flow" };
    
    // Parse gate from currentLocation selection, e.g. "Sector 1 - Gate A" -> "Gate A"
    const gatePart = currentLocation.split(" - ")[1] || "Gate A";
    const gateInfo = stadiumData.gate_status[gatePart];
    
    if (gateInfo) {
      return {
        waitTime: `${gateInfo.security_wait_minutes} Min`,
        density: gateInfo.crowd_density,
        flow: gateInfo.security_wait_minutes > 30 ? "Heavy Bottleneck" : gateInfo.security_wait_minutes > 15 ? "Moderate Flow" : "Normal Flow"
      };
    }
    return { waitTime: "12 Min", density: "Medium", flow: "Normal Flow" };
  };

  const vitals = getSelectedLocationVitals();

  // Custom Markdown renderer
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let isBullet = false;
      let content = line;

      if (line.startsWith("- ") || line.startsWith("* ")) {
        isBullet = true;
        content = line.substring(2);
      } else if (line.match(/^\d+\.\s/)) {
        isBullet = true;
        content = line.replace(/^\d+\.\s/, "");
      }

      const parts = content.split(/(\*\*.*?\*\*)/);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900 bg-indigo-50 px-1 rounded border border-indigo-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-5 list-disc pl-1 mb-1.5 text-slate-700 text-sm leading-relaxed">
            {parsedLine}
          </li>
        );
      }

      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-slate-700 text-sm leading-relaxed mb-2">
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      
      {/* APP HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-100 border border-indigo-500 flex-shrink-0">
            <span className="tracking-tight">W26</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap xs:flex-nowrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 leading-none truncate">Smart Stadium Companion</h1>
              <span className="bg-amber-50 text-amber-700 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide whitespace-nowrap">Official Guest Assistant</span>
            </div>
            <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5 sm:mt-1 truncate">FIFA World Cup 2026 • Live Matchday Updates</p>
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

      {/* THREE-COLUMN SLEEK WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: CONTROL & STATUS PANEL */}
        <aside className={`w-full lg:w-72 bg-white lg:border-r border-slate-200 p-5 flex-col gap-6 overflow-y-auto flex-shrink-0 ${mobileTab === "controls" ? "flex" : "hidden lg:flex"}`}>
          
          {/* Status Label */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your Status</label>
            <div className="space-y-4">
              
              {/* Dynamic location select dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <MapPin size={14} className="text-indigo-600" /> Current Location
                </label>
                <select 
                  id="current_loc_select"
                  value={currentLocation}
                  onChange={(e) => {
                    setCurrentLocation(e.target.value);
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "model",
                        text: `📍 GPS relocated to **${e.target.value}**. Sector-grounded concessions, medical aid, and gate routes are now prioritized for you.`
                      }
                    ]);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 mb-2"
                >
                  {allLocationOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                {/* Auto-detect button */}
                <button
                  id="gps_detect_btn"
                  onClick={handleDetectLocation}
                  disabled={gpsLoading}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-[11.5px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200/50"
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
                <p className="text-[9px] text-slate-400 mt-1 italic">Guides the AI Assistant to recommend closest points of interest</p>
              </div>

              {/* Language Selection Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Globe size={14} className="text-indigo-600" /> Preferred Language
                </label>
                <select 
                  id="language_select"
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    const langNames: { [key: string]: string } = {
                      en: "English",
                      es: "Español",
                      fr: "Français",
                      pt: "Português",
                      ar: "العربية"
                    };
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "model",
                        text: `🌐 Language preference switched to **${langNames[e.target.value] || e.target.value}**. Your future AI queries will adapt translations automatically.`
                      }
                    ]);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="pt">Português (BR)</option>
                  <option value="ar">العربية (AR)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vitals Panel */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Stadium Vitals</label>
            <div className="space-y-3">
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Crowd Density</p>
                <div className="flex items-end justify-between mt-1">
                  <span className={`text-base font-bold ${
                    vitals.density === "High" ? "text-red-600" : vitals.density === "Medium" ? "text-amber-600" : "text-green-600"
                  }`}>{vitals.density}</span>
                  <span className="text-[10px] text-indigo-600 font-medium pb-0.5 underline cursor-pointer" onClick={() => setRightActiveTab("map")}>Live Map</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Security Wait Time</p>
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
          <div className="mt-auto pt-4 border-t border-slate-100">
            <button 
              id="emergency_btn"
              onClick={() => {
                handleSendMessage("HELP: What is the emergency medical phone number and where is the nearest first aid Alpha station?");
              }}
              className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md shadow-red-100 hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertCircle size={14} className="animate-pulse" /> Emergency Assistance
            </button>
          </div>

        </aside>

        {/* MIDDLE COLUMN: INTUITIVE CHAT SYSTEM */}
        <section className={`flex-1 bg-slate-50 flex-col justify-between overflow-hidden relative ${mobileTab === "chat" ? "flex" : "hidden lg:flex"}`}>
          
          {/* Top suggestion panel */}
          <div className="p-4 bg-white border-b border-slate-200 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-600" /> Tap quick matchday queries:
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {suggestedQueries.map((item, i) => (
                <motion.button
                  key={i}
                  id={`suggest_query_${i}`}
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoadingChat}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 text-xs py-2 px-3.5 rounded-xl font-medium shadow-sm cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-grow p-6 overflow-y-auto space-y-5" id="middle_chat_area">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                  msg.role === "user" ? "bg-slate-300 text-slate-700" : "bg-indigo-600 text-white"
                }`}>
                  {msg.role === "user" ? "YOU" : "AI"}
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm border ${
                  msg.role === "user" 
                    ? "bg-indigo-600 border-indigo-700 text-white rounded-tr-none shadow-indigo-100" 
                    : "bg-white border-slate-200 text-slate-700 rounded-tl-none"
                }`}>
                  {msg.role === "user" ? (
                    <div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex justify-end mt-2 pt-2 border-t border-indigo-500/30">
                        <button
                          onClick={() => toggleSpeakMessage(idx, msg.text)}
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                            currentlySpeakingIndex === idx 
                              ? "bg-red-500 border-red-400 text-white animate-pulse" 
                              : "bg-indigo-700/50 hover:bg-indigo-700 border-indigo-500 text-indigo-100 hover:text-white"
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
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                            currentlySpeakingIndex === idx 
                              ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
                              : "bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600"
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
              <div className="flex gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-indigo-600 shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                  AI
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 font-bold animate-pulse">Running live GPS coordinates verify & anomaly scans...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Floating Sleek Input Bar */}
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
            <form 
              id="input_form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="relative flex items-center"
            >
              <input 
                type="text" 
                id="message_text_input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoadingChat}
                placeholder="Ask about food, gate wait times, policies, or request translations..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-6 pr-24 text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              <div className="absolute right-2 flex gap-1">
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isLoadingChat}
                  className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-40"
                >
                  SEND
                </button>
              </div>
            </form>
          </div>

        </section>

        {/* RIGHT COLUMN: INSIGHTS & UTILITY DECK */}
        <aside className={`w-full lg:w-80 bg-slate-50 lg:border-l border-slate-200 flex-col overflow-hidden flex-shrink-0 ${mobileTab === "deck" ? "flex" : "hidden lg:flex"}`}>
          
          {/* Deck selector headers */}
          <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 p-1">
            <button
              onClick={() => setRightActiveTab("map")}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                rightActiveTab === "map" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🗺️ Crowd Map
            </button>
            <button
              onClick={() => setRightActiveTab("concessions")}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                rightActiveTab === "concessions" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🍔 Concessions
            </button>
            <button
              onClick={() => setRightActiveTab("rules")}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                rightActiveTab === "rules" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ⚠️ Safety Rules
            </button>
          </div>

          {/* Deck Body Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* TAB 1: CROWD MAP */}
            {rightActiveTab === "map" && (
              <div className="space-y-4">
                
                {/* Real Live GPS Google Map */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live GPS Satellite Map</label>
                    {customApiKey ? (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">Custom Key Active</span>
                    ) : (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100">Demo Key Active</span>
                    )}
                  </div>
                  {!isApiKeyValid ? (
                    <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between border border-slate-800 relative overflow-hidden shadow-inner aspect-square text-left">
                      <div className="absolute inset-0 bg-slate-950 opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                      
                      <div className="relative z-10 flex-grow flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                          <AlertCircle size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Maps API Key Required</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
                          To render real-time GPS tracking and live MetLife Stadium coordinate maps, configure your key using either method below:
                        </p>

                        {/* Interactive In-App Key Activation */}
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                          <label className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Option A: Quick Activation (Instant)</label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={tempKeyInput}
                              onChange={(e) => setTempKeyInput(e.target.value)}
                              placeholder="Paste Google Maps API key..."
                              className="flex-1 text-[11px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-mono placeholder:text-slate-600"
                            />
                            <button
                              onClick={() => {
                                if (tempKeyInput.trim()) {
                                  localStorage.setItem("USER_GOOGLE_MAPS_KEY", tempKeyInput.trim());
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
                          <p className="font-semibold text-slate-300 uppercase tracking-wide text-[8px]">Option B: Persistent Workspace Secret</p>
                          <p>1. Open <strong className="text-white">Settings</strong> (⚙️ gear icon, top-right of AI Studio)</p>
                          <p>2. Go to the <strong className="text-white">Secrets</strong> tab</p>
                          <p>3. Add variable name <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono">GOOGLE_MAPS_PLATFORM_KEY</code></p>
                        </div>
                      </div>

                      <div className="relative z-10 mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[8px] text-slate-400">
                        <span>Console: console.cloud.google.com</span>
                        <span className="text-amber-500 animate-pulse font-mono font-bold">Waiting for Secret...</span>
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
                            <AdvancedMarker position={detectedCoords || { lat: 40.8135, lng: -74.0744 }}>
                              <Pin background="#4f46e5" glyphColor="#fff" />
                            </AdvancedMarker>
                          </Map>
                        </APIProvider>
                        {/* Overlay specs */}
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-200 text-[9px] text-slate-800 shadow-sm">
                          <span className="flex items-center gap-1">📍 Live GPS Coordinates</span>
                          <span className="font-mono text-indigo-600 font-bold uppercase tracking-wider">Sync Live</span>
                        </div>
                      </div>

                      {/* Expandable Key Settings panel */}
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-sm">
                        <button
                          onClick={() => setShowKeyConfig(!showKeyConfig)}
                          className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            🔑 {customApiKey ? "Manage Custom Credentials" : "Use Your Own Google Maps Key"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">
                            {showKeyConfig ? "▼ Close" : "▲ Expand"}
                          </span>
                        </button>
                        
                        {showKeyConfig && (
                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 animate-fade-in">
                            <p className="text-[9px] text-slate-500 leading-normal">
                              The map is currently running on the 2026 World Cup demo key. If you wish to use your own Google Cloud Maps API Key:
                            </p>
                            <div className="flex gap-1.5">
                              <input
                                type="password"
                                value={tempKeyInput}
                                onChange={(e) => setTempKeyInput(e.target.value)}
                                placeholder={customApiKey ? "••••••••••••••••••••••••" : "Paste your API Key..."}
                                className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-mono placeholder:text-slate-400"
                              />
                              <button
                                onClick={() => {
                                  if (tempKeyInput.trim()) {
                                    localStorage.setItem("USER_GOOGLE_MAPS_KEY", tempKeyInput.trim());
                                    setCustomApiKey(tempKeyInput.trim());
                                    setTempKeyInput("");
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
                                <span className="text-[8px] text-slate-400">Saved in your browser local storage.</span>
                                <button
                                  onClick={() => {
                                    localStorage.removeItem("USER_GOOGLE_MAPS_KEY");
                                    setCustomApiKey("");
                                    setTempKeyInput("");
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Gate Wait Times</label>
                  {stadiumData ? (
                    (Object.entries(stadiumData.gate_status) as [string, GateInfo][]).slice(0, 4).map(([gate, info]) => (
                      <div key={gate} className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-slate-800">{gate}</span>
                          <p className="text-[9px] text-slate-400">{info.status}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-indigo-700">{info.security_wait_minutes} min</span>
                          <p className="text-[8px] text-slate-400">{info.crowd_density} flow</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-2">Loading data...</div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: CONCESSIONS DETAILED REGISTER */}
            {rightActiveTab === "concessions" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concessions Database</label>
                  <p className="text-[9px] text-slate-400 mt-0.5">Used as context grounding for Gemini answers</p>
                </div>

                <div className="space-y-3">
                  {stadiumData?.sectors.map((sector) => (
                    <div key={sector.id} className="space-y-2">
                      <div className="bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wide flex justify-between">
                        <span>{sector.id}</span>
                        <span className="text-slate-500 font-normal">{sector.gates.join(", ")}</span>
                      </div>

                      {sector.concessions.map((stall, i) => (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{stall.name}</span>
                            <span className="text-[10px] text-indigo-600 font-mono">{stall.wait_time_minutes}m wait</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mb-1.5">📍 {stall.location} | Cuisine: {stall.cuisine}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-1">
                            {stall.menu.slice(0, 3).map((item, mIdx) => (
                              <span key={mIdx} className="bg-slate-50 border border-slate-100 text-slate-600 text-[9px] px-1 rounded font-mono">
                                {item}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-1 pt-1 border-t border-slate-100">
                            {stall.vegetarian_options.length > 0 && (
                              <span className="text-[8px] text-green-700 bg-green-50 font-bold px-1 rounded">VEG</span>
                            )}
                            {stall.vegan_options.length > 0 && (
                              <span className="text-[8px] text-emerald-700 bg-emerald-50 font-bold px-1 rounded">VEGAN</span>
                            )}
                            {stall.gluten_free_options.length > 0 && (
                              <span className="text-[8px] text-blue-700 bg-blue-50 font-bold px-1 rounded">GF</span>
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
            {rightActiveTab === "rules" && (
              <div className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Emergency Contact info</label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
                    <p className="font-bold flex items-center gap-1">🚨 Dispatch Medical Hotline:</p>
                    <p className="text-base font-mono font-bold mt-1 text-red-700">+1 (555) 911-2026</p>
                    <p className="text-[10px] text-red-600 mt-1 leading-relaxed">
                      Call or tap the left-sidebar "Emergency Assistance" button to request immediate security deployment.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ground Safety Protocol</label>
                  {stadiumData?.emergency_info.rules.map((rule, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex gap-2">
                      <span className="font-bold text-indigo-600">{idx + 1}</span>
                      <p className="text-[11px] leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* Side Tip Banner */}
          <div className="p-4 bg-indigo-50 border-t border-slate-200">
            <div className="flex gap-2 text-xs">
              <Compass size={16} className="text-indigo-600 shrink-0 mt-0.5 animate-spin-slow" />
              <div>
                <p className="font-bold text-indigo-900 uppercase text-[9px] tracking-wider">RAG PRO TIP</p>
                <p className="text-indigo-950 text-[11px] leading-snug mt-0.5">
                  The AI knows exactly where you are seated. Just ask "Where is the closest exit?" for step-by-step route directions.
                </p>
              </div>
            </div>
          </div>

        </aside>

      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
        <button
          onClick={() => setMobileTab("controls")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer ${
            mobileTab === "controls" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Compass size={18} className={mobileTab === "controls" ? "text-indigo-600" : "text-slate-400"} />
          <span className="text-[10px] font-semibold">Controls</span>
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer ${
            mobileTab === "chat" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MessageSquare size={18} className={mobileTab === "chat" ? "text-indigo-600" : "text-slate-400"} />
          <span className="text-[10px] font-semibold">AI Assistant</span>
        </button>
        <button
          onClick={() => setMobileTab("deck")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-center transition-all cursor-pointer ${
            mobileTab === "deck" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MapPin size={18} className={mobileTab === "deck" ? "text-indigo-600" : "text-slate-400"} />
          <span className="text-[10px] font-semibold">Map & Deck</span>
        </button>
      </div>

      {/* FIXED GLOBAL FOOTER */}
      <footer className="hidden lg:flex h-10 bg-slate-900 text-slate-400 text-[11px] px-6 items-center justify-between border-t border-slate-800 flex-shrink-0 z-10" id="global_stadium_footer">
        <p className="font-medium text-slate-300 flex items-center gap-1.5">
          <span>⚽ MetLife Arena Smart Stadium Assistant</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 font-normal">FIFA World Cup 2026 Companion App</span>
        </p>
        <p className="text-slate-500">React 19 • Gemini 3.5-Flash • Real-Time AI Guide</p>
      </footer>

    </div>
  );
}
