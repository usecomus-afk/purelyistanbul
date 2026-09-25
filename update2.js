const fs = require("fs");
let code = fs.readFileSync("src/components/guest/guest-concierge-view.tsx", "utf8");

// Fix alignment in guest-concierge-view
const buttonStylePattern = /className="p-4 sm:p-5 flex flex-col items-center text-center justify-between gap-3 min-h-\[155px\] sm:min-h-\[170px\] group relative cursor-pointer bg-black\/10/g;
code = code.replace(buttonStylePattern, 'className="p-4 sm:p-5 flex flex-col items-center text-center justify-start gap-3 h-full min-h-[155px] sm:min-h-[170px] group relative cursor-pointer bg-black/10');
fs.writeFileSync("src/components/guest/guest-concierge-view.tsx", code, "utf8");

let inRoomCode = fs.readFileSync("src/components/guest/in-room-services.tsx", "utf8");

// Fix alignment in in-room-services
const inRoomButtonStylePattern = /className=\{`p-3 flex flex-col items-center text-center justify-center gap-2 min-h-\[110px\] group relative bg-black\/10/g;
inRoomCode = inRoomCode.replace(inRoomButtonStylePattern, 'className={`p-3 flex flex-col items-center text-center justify-start gap-2 h-full min-h-[110px] group relative bg-black/10');

// Fix title color in in-room-services
const inRoomTitleColorPattern = /bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent/g;
inRoomCode = inRoomCode.replace(inRoomTitleColorPattern, "text-white group-hover:text-amber-400 transition-colors");

fs.writeFileSync("src/components/guest/in-room-services.tsx", inRoomCode, "utf8");
