const fs = require('fs');
const file = 'src/components/guest/guest-concierge-view.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className={\max-w-4xl mx-auto px-3\.5 sm:px-4 w-full \$\{activeTab === 'services' \? 'mt-1 sm:mt-2 space-y-3 sm:space-y-4 overflow-hidden' : 'mt-3 sm:mt-4 space-y-5 sm:space-y-6'\}\}/g,
  'className={\max-w-4xl mx-auto px-3.5 sm:px-4 w-full \\}'
);

content = content.replace(
  /\{activeTab === 'services' && \(\s*<div>\s*<InRoomServices/g,
  '{activeTab === \\'services\\' && (\\n          <div className="flex-1 h-full w-full">\\n            <InRoomServices'
);

fs.writeFileSync(file, content);
console.log('done');
