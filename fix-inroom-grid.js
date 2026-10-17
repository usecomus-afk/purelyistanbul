const fs = require('fs');
const file = 'src/components/guest/in-room-services.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /return \(\s*<div>\s*\{\/\* Background moved to GuestConciergeView to apply globally \*\/\}\s*\{\/\* Grid of In-Room Services \*\/\}\s*<div className="relative z-10 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 -mx-2 sm:mx-0">/g,
  'return (\\n    <div className="h-full flex flex-col flex-1">\\n      {/* Background moved to GuestConciergeView to apply globally */}\\n      \\n      {/* Grid of In-Room Services */}\\n      <div className="relative z-10 grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 -mx-2 sm:mx-0 flex-1 grid-rows-4 h-full items-stretch">'
);

fs.writeFileSync(file, content);
console.log('done');
