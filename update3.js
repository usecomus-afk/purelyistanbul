const fs = require("fs");
let code = fs.readFileSync("src/components/guest/guest-concierge-view.tsx", "utf8");

const iconBoxPattern = /className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform relative"/g;
code = code.replace(iconBoxPattern, 'className="w-20 h-20 sm:w-22 sm:h-22 shrink-0 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform relative"');

fs.writeFileSync("src/components/guest/guest-concierge-view.tsx", code, "utf8");

let inRoomCode = fs.readFileSync("src/components/guest/in-room-services.tsx", "utf8");
const inRoomIconBoxPattern = /className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center group-hover:scale-110 transition-transform relative/g;
inRoomCode = inRoomCode.replace(inRoomIconBoxPattern, 'className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform relative');

fs.writeFileSync("src/components/guest/in-room-services.tsx", inRoomCode, "utf8");
