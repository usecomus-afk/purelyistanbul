const fs = require('fs');
const file = 'src/components/guest/in-room-services.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{services\.map\(\(item\) => \{\s*const settings = moduleSettings\[item\.key\];\s*const isEnabled = settings \? settings\.enabled : item\.enabled !== false;\s*const serviceTitle = getLocalizedTitle\(item\);\s*const serviceDesc = getLocalizedDesc\(item\);\s*return \(/;

const newStr = `{services.filter(item => {
          const settings = moduleSettings[item.key];
          return settings ? settings.enabled : item.enabled !== false;
        }).map((item) => {
          const isEnabled = true;
          const serviceTitle = getLocalizedTitle(item);
          const serviceDesc = getLocalizedDesc(item);

          return (`;

if(regex.test(content)) {
    content = content.replace(regex, newStr);
    fs.writeFileSync(file, content);
    console.log('done');
} else {
    console.log('regex not found');
}
