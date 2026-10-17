const fs = require('fs');
const file = 'src/components/guest/in-room-services.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/group-hover:scale-110/g, 'group-hover:scale-105');
content = content.replace(/drop-shadow-\[0_6px_12px_rgba\(0,0,0,0\.4\)\]/g, 'drop-shadow-sm');
content = content.replace(/text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-400 transition-colors leading-tight block drop-shadow-sm/g, 'text-[13px] sm:text-[15px] font-[800] text-[#1e293b] leading-tight block');

fs.writeFileSync(file, content);
console.log('done');
