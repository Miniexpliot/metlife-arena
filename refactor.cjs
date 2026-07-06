const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace header
code = code.replace(/<header className="h-16 bg-white border-b border-slate-200[\s\S]*?<\/header>/, '<Header />');

// Replace MobileNav
code = code.replace(/<div className="lg:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 shadow-\[0_-4px_12px_rgba\(0,0,0,0.05\)\] z-20 flex-shrink-0\">[\s\S]*?<\/div>/, '<MobileNav mobileTab={mobileTab} setMobileTab={setMobileTab} />');

// Add imports if not present
if (!code.includes('import Header from')) {
    code = 'import Header from "./components/Header";\nimport MobileNav from "./components/MobileNav";\n' + code;
}

fs.writeFileSync('src/App.tsx', code);
console.log('Refactored App.tsx safely.');
