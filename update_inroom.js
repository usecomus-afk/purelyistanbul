const fs = require("fs");
let code = fs.readFileSync("src/components/guest/in-room-services.tsx", "utf8");

code = code.replace(/bg-black\/10 backdrop-blur-\[3px\] border border-white\/30 shadow-\[.*?\]/g, 'bg-transparent border-transparent shadow-none');

code = code.replace(/className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600"/g, 'className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 scale-[1.4]"');

fs.writeFileSync("src/components/guest/in-room-services.tsx", code, "utf8");
console.log("Updated in-room-services.tsx");
