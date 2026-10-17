const fs = require('fs');
const file = 'src/components/guest/hotel-header.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove dark classes
content = content.replace(/dark:[^\s\"\'\`\}]+/g, '');
// Replace zinc with slate
content = content.replace(/text-zinc-900/g, 'text-slate-900');
content = content.replace(/text-zinc-800/g, 'text-slate-800');
content = content.replace(/text-zinc-700/g, 'text-slate-700');
content = content.replace(/text-zinc-500/g, 'text-slate-500');

fs.writeFileSync(file, content);
console.log('done');
