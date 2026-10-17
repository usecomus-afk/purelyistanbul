const fs = require('fs');

function removeDarkClasses(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/dark:[^\s\"\'\`\}]+/g, '');
    content = content.replace(/text-zinc-900/g, 'text-slate-900');
    content = content.replace(/text-zinc-800/g, 'text-slate-800');
    content = content.replace(/text-zinc-700/g, 'text-slate-700');
    
    fs.writeFileSync(file, content);
}

removeDarkClasses('src/components/guest/language-selector.tsx');
console.log('done');
