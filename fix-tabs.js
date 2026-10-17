const fs = require('fs');
const file = 'src/components/guest/guest-tab-bar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change the main nav background back to light glass
content = content.replace(/bg-amber-500\/95 backdrop-blur-\[4px\] border-t border-amber-400 shadow-\[0_-8px_24px_rgba\(245,158,11,0\.3\)\]/g, 'bg-white/80 backdrop-blur-md border-t border-slate-900/10 shadow-sm');
content = content.replace(/bg-amber-500\/95 backdrop-blur-\[4px\]/g, 'bg-white/80 backdrop-blur-md');

// Active/Inactive Text
content = content.replace(/\(isServicesDark \? 'text-white font-bold' : 'text-amber-800 font-bold'\)/g, "'text-amber-600 font-bold'");
content = content.replace(/\(isServicesDark \? 'text-white\/80 hover:text-white' : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:text-slate-200'\)/g, "'text-slate-500 hover:text-slate-800'");

// Active/Inactive Background
content = content.replace(/\(isServicesDark \? 'bg-white\/20 text-white shadow-\[inset_0_1px_4px_rgba\(255,255,255,0\.3\)\] scale-105' : 'btn-3d text-amber-800 scale-105'\)/g, "'bg-amber-500 text-white shadow-md scale-105'");
content = content.replace(/\(isServicesDark \? 'hover:bg-white\/10' : 'hover:bg-amber-50\/80'\)/g, "'hover:bg-amber-50'");

// Fix the image invert logic. Since the active bg is amber-500, we want the image to be white (inverted) when active.
content = content.replace(/className=\{isServicesDark && tab\.id === 'ai' \? 'brightness-0 invert' : ''\}/g, "className={isActive ? 'brightness-0 invert' : ''}");

fs.writeFileSync(file, content);
console.log('done');
