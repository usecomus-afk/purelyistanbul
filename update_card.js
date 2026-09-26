const fs = require("fs");
let code = fs.readFileSync("src/components/guest/experience-card.tsx", "utf8");

code = code.replace(/bg-amber-100\/70 text-amber-950/g, 'bg-black/50 text-amber-300');
code = code.replace(/hover:bg-amber-100 text-amber-400/g, 'hover:bg-black/40 text-amber-400');
code = code.replace(/hover:bg-zinc-200 text-white\/80/g, 'hover:bg-black/40 text-white/80');

fs.writeFileSync("src/components/guest/experience-card.tsx", code, "utf8");
console.log("Updated experience-card.tsx");
