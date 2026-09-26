const fs = require("fs");
let code = fs.readFileSync("src/components/guest/experience-detail-modal.tsx", "utf8");
code = code.replace(/className="fixed inset-0 z-50/g, 'className="fixed inset-0 z-[100000]');
code = code.replace(/className="fixed bottom-\[64px\] sm:bottom-\[68px\]/g, 'className="fixed bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))]');
fs.writeFileSync("src/components/guest/experience-detail-modal.tsx", code, "utf8");
