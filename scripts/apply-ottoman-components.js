const fs = require('fs');

// 1. Update guest-concierge-view.tsx
let concierge = fs.readFileSync('src/components/guest/guest-concierge-view.tsx', 'utf8');

// Replace top container style to incorporate ottoman-theme and #151310 background
concierge = concierge.replace(
  'className="w-full max-w-[100vw] overflow-x-clip overscroll-x-none touch-pan-y box-border text-[#221F1C] relative"',
  'className="ottoman-theme w-full max-w-[100vw] min-h-[100dvh] overflow-x-clip overscroll-x-none touch-pan-y box-border text-[#F5F2EB] bg-[#151310] relative"'
);

// Replace fixed background with a deep dark warm espresso mosque silhouette and vignette
concierge = concierge.replace(
  '<div className="fixed -top-[70px] -bottom-[50px] left-0 right-0 z-0 pointer-events-none overflow-hidden bg-[#F6F1E7]">',
  '<div className="fixed -top-[70px] -bottom-[50px] left-0 right-0 z-0 pointer-events-none overflow-hidden bg-[#151310]">'
);

concierge = concierge.replace(
  'className="object-cover object-center scale-[1.01] blur-[2px] sepia-[0.18] saturate-[0.88] brightness-[1.01] contrast-[0.98]"',
  'className="object-cover object-center scale-[1.01] blur-[3px] brightness-[0.22] contrast-[1.15] saturate-[0.7] opacity-60"'
);

concierge = concierge.replace(
  '<div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F0]/68 via-[#F5EFE6]/14 to-transparent" />',
  '<div className="absolute inset-0 bg-gradient-to-b from-[#151310] via-[#151310]/70 to-[#151310]" />'
);

fs.writeFileSync('src/components/guest/guest-concierge-view.tsx', concierge, 'utf8');
console.log('guest-concierge-view.tsx updated to ottoman-theme');

// 2. Update hotel-header.tsx
let header = fs.readFileSync('src/components/guest/hotel-header.tsx', 'utf8');

// Update header pill class
header = header.replace(
  'className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 max-w-full box-border rounded-full backdrop-blur-xl border border-[rgba(224,184,102,0.52)] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.75),inset_0_-1px_2px_rgba(218,174,86,0.22),0_8px_24px_rgba(24,18,10,0.10)] relative z-50"',
  'className="ottoman-header-pill flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 max-w-full box-border rounded-full relative z-50"'
);

// In case inline style is on header pill, clear it so ottoman-header-pill takes over
header = header.replace(
  `          style={{
            background:
              'linear-gradient(145deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.16) 52%, rgba(248, 234, 202, 0.22) 100%)',
            backdropFilter: 'blur(16px) saturate(135%)',
            WebkitBackdropFilter: 'blur(16px) saturate(135%)',
          }}`,
  ''
);

// If CRLF was present:
header = header.replace(
  `          style={{\r\n            background:\r\n              'linear-gradient(145deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0.16) 52%, rgba(248, 234, 202, 0.22) 100%)',\r\n            backdropFilter: 'blur(16px) saturate(135%)',\r\n            WebkitBackdropFilter: 'blur(16px) saturate(135%)',\r\n          }}`,
  ''
);

// Update colors in header icons and dividers to Ottoman Gold and Taupe
header = header.split('text-[#8C6D46]').join('text-[#D4AF37]');
header = header.split('bg-[#C4B7A3]/70').join('bg-[#D4AF37]/25');
header = header.split('hover:bg-white/45').join('hover:bg-white/10');

// Update Wi-Fi / Room button to ottoman-room-badge
header = header.replace(
  'className="flex items-center gap-1.5 px-3 py-1 bg-white/35 hover:bg-white/55 backdrop-blur-md border border-[rgba(224,184,102,0.52)] rounded-full text-[#141414] text-[11.5px] font-bold transition cursor-pointer shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.8)]"',
  'className="ottoman-room-badge flex items-center gap-1.5 px-3 py-1 rounded-full text-[#F5F2EB] text-[11.5px] font-semibold transition cursor-pointer"'
);

// Header h1 title style: EB Garamond, Warm Ivory (#F5F2EB) with relaxed tracking
header = header.replace(
  'font-luxury-serif text-[18px] sm:text-[21px] tracking-[0.14em] font-normal text-[#141414] uppercase text-center leading-[1.28] select-none mt-0.5 max-w-full',
  'font-luxury-serif text-[19px] sm:text-[22px] tracking-[0.12em] font-semibold text-[#F5F2EB] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase text-center leading-[1.28] select-none mt-0.5 max-w-full'
);

fs.writeFileSync('src/components/guest/hotel-header.tsx', header, 'utf8');
console.log('hotel-header.tsx updated to ottoman-theme');

// 3. Update guest-tab-bar.tsx to Luxury Dark Ottoman style
let tabBar = fs.readFileSync('src/components/guest/guest-tab-bar.tsx', 'utf8');

tabBar = tabBar.split('const strokeColor = active ? "#A67C46" : "currentColor";')
  .join('const strokeColor = active ? "#D4AF37" : "#A8A398";');

tabBar = tabBar.split('const strokeColor = active ? "#7D5E2A" : "#8B6220";')
  .join('const strokeColor = active ? "#D4AF37" : "#A8A398";');

tabBar = tabBar.split('text-[#9E7035] font-semibold')
  .join('text-[#D4AF37] font-semibold drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]');

tabBar = tabBar.split('text-[#222222] hover:text-[#000000] font-normal')
  .join('text-[#A8A398] hover:text-[#F5F2EB] font-normal');

// Active tab container pill
tabBar = tabBar.replace(
  'w-11 h-11 rounded-full bg-white/38 backdrop-blur-md border-[1.5px] border-[rgba(224,184,102,0.68)] text-[#A67C46] shadow-[0_5px_12px_rgba(60,45,20,0.12),inset_0_1px_2px_rgba(255,255,255,0.9)]',
  'w-11 h-11 rounded-full ottoman-tab-active backdrop-blur-md text-[#D4AF37]'
);

// Comus trigger pill
tabBar = tabBar.replace(
  'w-11 h-11 rounded-full bg-gradient-to-br from-[#FFFDF7]/70 via-[#F5E6C8]/65 to-[#E2C285]/60 backdrop-blur-md border-[1.5px] border-[#C59B38] text-[#8B6220] shadow-[0_4px_14px_rgba(166,124,70,0.28),inset_0_1px_2px_rgba(255,255,255,0.9)]',
  'w-11 h-11 rounded-full bg-gradient-to-br from-[#262420] to-[#1D1B18] backdrop-blur-md border-[1.5px] border-[#D4AF37] text-[#D4AF37] shadow-[0_4px_14px_rgba(212,175,55,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)]'
);

tabBar = tabBar.split("'w-10 h-10 text-[#1E1E1E]'")
  .join("'w-10 h-10 text-[#A8A398]'");

// Green active status dot on comus
tabBar = tabBar.replace(
  'bg-emerald-500 ring-2 ring-[#F5F2EC]',
  'bg-[#4E8B62] ring-2 ring-[#1D1B18] shadow-[0_0_8px_#4E8B62]'
);

fs.writeFileSync('src/components/guest/guest-tab-bar.tsx', tabBar, 'utf8');
console.log('guest-tab-bar.tsx updated to ottoman-theme');

// 4. Update guest-shell.tsx so appMode has ottoman-theme background
let shell = fs.readFileSync('src/components/guest/guest-shell.tsx', 'utf8');
shell = shell.replace(
  "appMode\r\n          ? 'w-full max-w-[100vw] min-h-[100dvh] overflow-x-clip overscroll-x-none touch-pan-y text-slate-900 antialiased relative box-border'",
  "appMode\r\n          ? 'ottoman-theme w-full max-w-[100vw] min-h-[100dvh] overflow-x-clip overscroll-x-none touch-pan-y text-[#F5F2EB] bg-[#151310] antialiased relative box-border'"
);
shell = shell.replace(
  "appMode\n          ? 'w-full max-w-[100vw] min-h-[100dvh] overflow-x-clip overscroll-x-none touch-pan-y text-slate-900 antialiased relative box-border'",
  "appMode\n          ? 'ottoman-theme w-full max-w-[100vw] min-h-[100dvh] overflow-x-clip overscroll-x-none touch-pan-y text-[#F5F2EB] bg-[#151310] antialiased relative box-border'"
);
fs.writeFileSync('src/components/guest/guest-shell.tsx', shell, 'utf8');
console.log('guest-shell.tsx updated');

// 5. Update luxury-service-icon.tsx for Warm Antique Brass / Ottoman Gold
let iconCode = fs.readFileSync('src/components/guest/luxury-service-icon.tsx', 'utf8');
iconCode = iconCode.replace(
  '<stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />',
  '<stop offset="0" stopColor="#F5F2EB" stopOpacity="0.95" />'
);
iconCode = iconCode.replace(
  '<stop offset="0.55" stopColor="#F7ECD3" stopOpacity="0.92" />',
  '<stop offset="0.55" stopColor="#E5C358" stopOpacity="0.85" />'
);
iconCode = iconCode.replace(
  '<stop offset="1" stopColor="#DFC187" stopOpacity="0.9" />',
  '<stop offset="1" stopColor="#D4AF37" stopOpacity="0.80" />'
);
iconCode = iconCode.replace(
  '<stop offset="0" stopColor="#B08A45" />',
  '<stop offset="0" stopColor="#E5C358" />'
);
iconCode = iconCode.replace(
  '<stop offset="1" stopColor="#6B4E1F" />',
  '<stop offset="1" stopColor="#B89324" />'
);
fs.writeFileSync('src/components/guest/luxury-service-icon.tsx', iconCode, 'utf8');
console.log('luxury-service-icon.tsx updated');
