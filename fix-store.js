const fs = require('fs');
const file = 'src/components/guest/in-room-services.tsx';
let content = fs.readFileSync(file, 'utf8');

// Also filter by !item.hidden
content = content.replace(
  /return settings \? settings\.enabled : item\.enabled !== false;/g,
  'if (item.hidden || (settings && settings.hidden)) return false;\\n          return settings ? settings.enabled : item.enabled !== false;'
);

fs.writeFileSync(file, content);

const storeFile = 'src/lib/store.ts';
let storeContent = fs.readFileSync(storeFile, 'utf8');

storeContent = storeContent.replace(
  /\{ id: 'minibar', key: 'minibar', label: 'Mini Bar Dolumu', desc: 'Mini bar dolumu ve su', icon: '\/icons\/menu\/minibar\.png', department: 'Housekeeping', enabled: true, hidden: false, order: 9 \},/g,
  "{ id: 'minibar', key: 'minibar', label: 'Mini Bar Dolumu', desc: 'Mini bar dolumu ve su', icon: '/icons/menu/minibar.png', department: 'Housekeeping', enabled: false, hidden: true, order: 9 },"
);
storeContent = storeContent.replace(
  /\{ id: 'safe', key: 'safe', label: 'Kasa & G.*?venlik', desc: 'Kasa kullan.*?m.*? & g.*?venlik', icon: '\/icons\/menu\/safe\.png', department: 'Resepsiyon & G.*?venlik', enabled: true, hidden: false, order: 10 \},/g,
  "{ id: 'safe', key: 'safe', label: 'Kasa & Güvenlik', desc: 'Kasa kullanýmý & güvenlik', icon: '/icons/menu/safe.png', department: 'Resepsiyon & Güvenlik', enabled: false, hidden: true, order: 10 },"
);
storeContent = storeContent.replace(
  /\{ id: 'technical', key: 'technical', label: 'Teknik Destek', desc: 'Klima, TV, priz ve ayd.*?nlatma', icon: '\/icons\/menu\/technical\.png', department: 'Teknik Servis', enabled: true, hidden: false, order: 11 \},/g,
  "{ id: 'technical', key: 'technical', label: 'Teknik Destek', desc: 'Klima, TV, priz ve aydýnlatma', icon: '/icons/menu/technical.png', department: 'Teknik Servis', enabled: false, hidden: true, order: 11 },"
);
storeContent = storeContent.replace(
  /\{ id: 'laundry', key: 'laundry', label: '.*?ama.*?rhane & .*?t.*?', desc: 'Kuru temizleme ve .*?t.*?', icon: '\/icons\/menu\/laundry\.png', department: 'Housekeeping \(.*?ama.*?rhane\)', enabled: true, hidden: false, order: 12 \},/g,
  "{ id: 'laundry', key: 'laundry', label: 'Çamaþýrhane & Ütü', desc: 'Kuru temizleme ve ütü', icon: '/icons/menu/laundry.png', department: 'Housekeeping (Çamaþýrhane)', enabled: false, hidden: true, order: 12 },"
);
storeContent = storeContent.replace(
  /\{ id: 'lateCheckout', key: 'lateCheckout', label: 'Ge.*? .*?k.*? Talebi', desc: "Saat 14:00'e kadar ge.*? .*?k.*?", icon: '\/icons\/menu\/lateCheckout\.png', department: 'Resepsiyon \/ .*?n B.*?ro', enabled: true, hidden: false, order: 13 \},/g,
  "{ id: 'lateCheckout', key: 'lateCheckout', label: 'Geç Çýkýþ Talebi', desc: \\\"Saat 14:00'e kadar geç çýkýþ\\\", icon: '/icons/menu/lateCheckout.png', department: 'Resepsiyon / Ön Büro', enabled: false, hidden: true, order: 13 },"
);
storeContent = storeContent.replace(
  /\{ id: 'extendStay', key: 'extendStay', label: 'Konaklama Uzatma', desc: 'Konaklama s.*?resini uzat', icon: '\/icons\/menu\/extendStay\.png', department: 'Resepsiyon \/ Rezervasyon', enabled: true, hidden: false, order: 14 \}/g,
  "{ id: 'extendStay', key: 'extendStay', label: 'Konaklama Uzatma', desc: 'Konaklama süresini uzat', icon: '/icons/menu/extendStay.png', department: 'Resepsiyon / Rezervasyon', enabled: false, hidden: true, order: 14 }"
);

fs.writeFileSync(storeFile, storeContent);
console.log('done');
