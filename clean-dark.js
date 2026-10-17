const fs = require('fs');
const path = require('path');

const dir = 'src/components/guest';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        const originalContent = content;
        content = content.replace(/dark:[^\s\"\'\`\}]+/g, '');
        content = content.replace(/text-zinc-900/g, 'text-slate-900');
        content = content.replace(/text-zinc-800/g, 'text-slate-800');
        content = content.replace(/text-zinc-700/g, 'text-slate-700');
        content = content.replace(/text-zinc-600/g, 'text-slate-600');
        content = content.replace(/text-zinc-500/g, 'text-slate-500');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${file}`);
        }
    }
});

// Also check components in root of components (e.g. auth-modal.tsx, online-checkin-modal.tsx)
const rootDir = 'src/components';
const rootFiles = fs.readdirSync(rootDir);
rootFiles.forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(rootDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        const originalContent = content;
        content = content.replace(/dark:[^\s\"\'\`\}]+/g, '');
        content = content.replace(/text-zinc-900/g, 'text-slate-900');
        content = content.replace(/text-zinc-800/g, 'text-slate-800');
        content = content.replace(/text-zinc-700/g, 'text-slate-700');
        content = content.replace(/text-zinc-600/g, 'text-slate-600');
        content = content.replace(/text-zinc-500/g, 'text-slate-500');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated root ${file}`);
        }
    }
});
console.log('done');
