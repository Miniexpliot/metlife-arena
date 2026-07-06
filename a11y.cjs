const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Location Dropdown
code = code.replace(
  /onClick=\{\(\) => setIsLocationDropdownOpen\(\!isLocationDropdownOpen\)\}/g,
  `onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)} aria-expanded={isLocationDropdownOpen} aria-haspopup="listbox" aria-label="Select Current Location"`
);
// Focus rings for Location Dropdown
code = code.replace(
  /className="w-full flex justify-between items-center text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 mb-2 transition-all cursor-pointer"/g,
  `className="w-full flex justify-between items-center text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-medium text-slate-700 mb-2 transition-all cursor-pointer"`
);

// GPS Detect Button
code = code.replace(
  /<button\s+id="gps_detect_btn"/g,
  `<button\n                id="gps_detect_btn"\n                aria-label="Detect GPS Location"\n                aria-busy={gpsLoading}`
);
code = code.replace(
  /className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-\[0.98\] text-white rounded-xl text-\[11.5px\] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200\/50"/g,
  `className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-[11.5px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:scale-100 shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"`
);

// Language Flags
code = code.replace(
  /title=\{lang\.name\}/g,
  `title={lang.name}\n                    aria-label={\`Change language to \${lang.name}\`}\n                    aria-pressed={selectedLanguage === lang.code}`
);
code = code.replace(
  /className=\{\`h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm transition-all \$\{/g,
  `className={\`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-sm transition-all \${`
);

// TTS Speak Out
code = code.replace(
  /<button\n\s*onClick=\{\(\) => toggleSpeakMessage\(idx, msg\.text\)\}/g,
  `<button\n                          onClick={() => toggleSpeakMessage(idx, msg.text)}\n                          aria-label={currentlySpeakingIndex === idx ? "Stop speaking text" : "Speak text aloud"}`
);
code = code.replace(
  /className=\{\`text-\[9px\] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer \$\{/g,
  `className={\`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer \${`
);

// Input Field
code = code.replace(
  /id="message_text_input"/g,
  `id="message_text_input"\n                aria-label="Chat message input"`
);
code = code.replace(
  /className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-6 pr-24 text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"/g,
  `className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-6 pr-24 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"`
);

// Send Button
code = code.replace(
  /<button\n\s*type="submit"\n\s*disabled=\{!inputMessage\.trim\(\) \|\| isLoadingChat\}/g,
  `<button\n                  type="submit"\n                  aria-label="Send message"\n                  disabled={!inputMessage.trim() || isLoadingChat}`
);
code = code.replace(
  /className="px-5 py-2 bg-indigo-600 text-white text-\[10px\] font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-40"/g,
  `className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Applied A11y to App.tsx');
