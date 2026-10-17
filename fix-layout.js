const fs = require('fs');
const file = 'src/app/(guest)/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the old div
const regex = /<div className="min-h-screen bg-\[#f8f6f0\] text-zinc-900 dark:text-slate-100 w-full pb-8 pb-\[calc\(2rem\+env\(safe-area-inset-bottom\)\)\] antialiased">\s*\{children\}\s*<\/div>\s*\{\/\*.*?\*\/\}\s*<MobileFooterNav \/>/s;

const newStr = `<div className="h-[100dvh] overflow-hidden bg-[#f8f6f0] text-slate-900 w-full antialiased relative">
        <div className="w-full h-full overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
        <MobileFooterNav />
      </div>`;

if (regex.test(content)) {
    content = content.replace(regex, newStr);
    fs.writeFileSync(file, content);
    console.log('done');
} else {
    console.log('regex not found');
}
