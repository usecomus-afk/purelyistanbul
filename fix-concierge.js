const fs = require('fs');
const file = 'src/components/guest/guest-concierge-view.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/className=\"w-full text-slate-900 h-\[100dvh\] overflow-y-auto relative\"/g, 'className="w-full text-slate-900 min-h-full relative"');

fs.writeFileSync(file, content);
console.log('done');
