const fs = require("fs");
let code = fs.readFileSync("src/components/guest/guest-concierge-view.tsx", "utf8");

const oldShowcaseMatch = code.match(/const categoryShowcase\s*=\s*\[[\s\S]*?\];/);

const newShowcase = `const categoryShowcase = [
    { key: t.categoriesList.history.title, rawKey: "Tarih & Müzeler", targetCategory: "Tarih & Müzeler", iconPath: '/icons/categories/tarih-muzeler.png', count: 8, desc: t.categoriesList.history.desc },
    { key: t.categoriesList.gastronomy.title, rawKey: "Gastronomi & Gurme", targetCategory: "Gastronomi & Gurme", iconPath: '/icons/categories/gastronomi-gurme.png', count: 6, desc: t.categoriesList.gastronomy.desc },
    { key: t.categoriesList.art.title, rawKey: "Sanat & Semazen", targetCategory: "Sanat & Semazen", iconPath: '/icons/categories/sanat-semazen.png', count: 4, desc: t.categoriesList.art.desc },
    { key: t.categoriesList.shopping.title, rawKey: "Alışveriş & Çarşılar", targetCategory: "Alışveriş & Çarşılar", iconPath: '/icons/categories/alisveris-carsilar.png', count: 4, desc: t.categoriesList.shopping.desc },
    { key: t.categoriesList.bosphorus.title, rawKey: "Boğaz Turları & Yat", targetCategory: "Boğaz Turları & Yat", iconPath: '/icons/categories/bogaz-yatturlari.png', count: 7, desc: t.categoriesList.bosphorus.desc },
    { key: t.categoriesList.culture.title, rawKey: "Kültürel Miras", targetCategory: "Kültürel Miras", iconPath: '/icons/categories/kulturel-miras.png', count: 5, desc: t.categoriesList.culture.desc },
    { key: t.categoriesList.hamam.title, rawKey: "Türk Hamamı & Spa", targetCategory: "Türk Hamamı & Spa", iconPath: '/icons/categories/turk-hamami-spa.png', count: 4, desc: t.categoriesList.hamam.desc },
    { key: t.categoriesList.photo.title, rawKey: "Fotoğraf & Kostüm", targetCategory: "Fotoğraf & Kostüm", iconPath: '/icons/categories/fotograf-kostum.svg', count: 5, desc: t.categoriesList.photo.desc },
    { key: t.categoriesList.transfer.title, rawKey: "Özel VIP Transfer", targetCategory: "Özel VIP Transfer", iconPath: '/icons/categories/ozel-vip-transfer.png', count: 2, desc: t.categoriesList.transfer.desc },
    { key: t.categoriesList.restaurants.title, rawKey: "Önerdiğimiz Restoranlar", targetCategory: "Önerdiğimiz Restoranlar", iconPath: '/icons/categories/onerdigimiz-restoranlar.png', count: 20, desc: t.categoriesList.restaurants.desc },
    { key: t.categoriesList.aesthetic?.title || "Medikal Estetik & Güzellik", rawKey: "Medikal Estetik & Güzellik", targetCategory: "Medikal Estetik & Güzellik", iconPath: '/icons/categories/aesthetic-beauty.png', count: 12, desc: t.categoriesList.aesthetic?.desc || "Nişantaşı & Şişli'nin seçkin kliniklerinde medikal estetik, saç ekimi & cilt bakımı" },
    { key: t.categoriesList.invest.title, rawKey: "İstanbul'da Yatırım", targetCategory: "İstanbul'da Yatırım", iconPath: '/icons/categories/invest.png', count: 20, desc: t.categoriesList.invest.desc, tab: 'invest' }
  ];`;

if (oldShowcaseMatch) {
    code = code.replace(oldShowcaseMatch[0], newShowcase);
} else {
    console.error("Could not find categoryShowcase!");
}

fs.writeFileSync("src/components/guest/guest-concierge-view.tsx", code, "utf8");
console.log("Updated guest-concierge-view.tsx category mapping");
