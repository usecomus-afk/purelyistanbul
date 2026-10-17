const fs = require('fs');
const file = 'src/components/guest/guest-tab-bar.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change the nav bar background to solid white, increase padding
content = content.replace(/px-3 pt-2\.5 pb-\[calc\(0\.75rem\+env\(safe-area-inset-bottom\)\)\]/g, 'px-2 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]');
content = content.replace(/bg-white\/80 backdrop-blur-md border-t border-slate-900\/10 shadow-sm/g, 'bg-[#ffffff] border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]');

// 2. Change the iOS overscroll gap filler to solid white
content = content.replace(/bg-white\/80 backdrop-blur-md/g, 'bg-[#ffffff]');

// 3. Remove the orange box from the active tab icon wrapper
content = content.replace(/'bg-amber-500 text-white shadow-md scale-105'/g, "'text-amber-500 scale-105'");

// 4. Change active text to amber-500 (matching icon)
content = content.replace(/'text-amber-600 font-bold'/g, "'text-amber-500 font-bold'");

// 5. Remove the invert class from the active image (since the active bg is no longer amber, we don't want a white icon)
content = content.replace(/className=\{isActive \? 'brightness-0 invert' : ''\}/g, "className=''");

fs.writeFileSync(file, content);
console.log('done');
