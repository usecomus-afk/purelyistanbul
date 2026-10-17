const fs = require('fs');

function removeDarkClasses(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/dark:[^\s\"\'\`\}]+/g, '');
    content = content.replace(/text-zinc-900/g, 'text-slate-900');
    content = content.replace(/text-zinc-600/g, 'text-slate-700');
    content = content.replace(/text-zinc-700/g, 'text-slate-800');
    content = content.replace(/text-zinc-500/g, 'text-slate-600');
    content = content.replace(/text-zinc-400/g, 'text-slate-500');
    
    fs.writeFileSync(file, content);
}

removeDarkClasses('src/components/guest/service-request-form.tsx');
removeDarkClasses('src/components/guest/guest-room-service-menu.tsx');
console.log('done');
