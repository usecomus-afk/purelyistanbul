const fs = require("fs");
let code = fs.readFileSync("src/components/guest/guest-concierge-view.tsx", "utf8");

const categoryShowcasePattern = /const categoryShowcase = \[([\s\S]*?)\];/;
const newCategoryShowcase = `const categoryShowcase = [
      { key: t.categoriesList.history.title, rawKey: "Tarih & Müzeler", targetCategory: "2. Tarihi Rota & Hızlı Geçiş Turları", iconPath: '/icons/categories/tarih-muzeler.png', count: 8, desc: t.categoriesList.history.desc },
      { key: t.categoriesList.gastronomy.title, rawKey: "Gastronomi & Gurme", targetCategory: "3. Gastronomi & Sokak Lezzetleri", iconPath: '/icons/categories/gastronomi-gurme.png', count: 6, desc: t.categoriesList.gastronomy.desc },
      { key: t.categoriesList.art.title, rawKey: "Sanat & Semazen", targetCategory: "11. Modern Sanat, Tasarım & Mimarlık Yürüyüşleri", iconPath: '/icons/categories/sanat-semazen.png', count: 4, desc: t.categoriesList.art.desc },
      { key: t.categoriesList.shopping.title, rawKey: "Alışveriş & Çarşılar", targetCategory: "9. Alışveriş, Stilist & Pazarlık Asistanlığı", iconPath: '/icons/categories/alisveris-carsilar.png', count: 4, desc: t.categoriesList.shopping.desc },
      { key: t.categoriesList.bosphorus.title, rawKey: "Boğaz Turları & Yat", targetCategory: "1. Boğaz & Tekne Deneyimleri", iconPath: '/icons/categories/bogaz-yatturlari.png', count: 7, desc: t.categoriesList.bosphorus.desc },
      { key: t.categoriesList.culture.title, rawKey: "Kültürel Miras", targetCategory: "12. Mistik, İnanç & Çok Kültürlü Miras Rotaları", iconPath: '/icons/categories/kulturel-miras.png', count: 5, desc: t.categoriesList.culture.desc },
      { key: t.categoriesList.hamam.title, rawKey: "Türk Hamamı & Spa", targetCategory: "4. Geleneksel & Kültürel Deneyimler", iconPath: '/icons/categories/turk-hamami-spa.png', count: 4, desc: t.categoriesList.hamam.desc },
      { key: t.categoriesList.photo.title, rawKey: "Fotoğraf & Kostüm", targetCategory: "7. Fotoğrafçılık & Sosyal Medya Çekimleri", iconPath: '/icons/categories/fotograf-kostum.png', count: 5, desc: t.categoriesList.photo.desc },
      { key: t.categoriesList.transfer.title, rawKey: "Özel VIP Transfer", targetCategory: "6. Ulaşım, Transfer & Şehir Kartları", iconPath: '/icons/categories/ozel-vip-transfer.png', count: 2, desc: t.categoriesList.transfer.desc },
      { key: t.categoriesList.restaurants.title, rawKey: "Önerdiğimiz Restoranlar", targetCategory: "Önerdiğimiz Restoranlar", iconPath: '/icons/categories/onerdigimiz-restoranlar.png', count: 20, desc: t.categoriesList.restaurants.desc },
      { key: t.categoriesList.aesthetic?.title || "Medikal Estetik & Güzellik", rawKey: "14. Medikal Estetik & Güzellik", targetCategory: "14. Medikal Estetik & Güzellik", iconPath: '/icons/categories/aesthetic-beauty.png', count: 12, desc: t.categoriesList.aesthetic?.desc || "Nişantaşı & Şişli'nin seçkin kliniklerinde medikal estetik, saç ekimi & cilt bakımı" },
      { key: t.categoriesList.invest.title, rawKey: "İstanbul'da Yatırım", iconPath: '/icons/categories/invest.png', count: 20, desc: t.categoriesList.invest.desc, tab: 'invest' }
    ];`;
code = code.replace(categoryShowcasePattern, newCategoryShowcase);

const buttonStylePattern = /className="btn-3d p-4 sm:p-5 flex flex-col items-center text-center justify-between gap-3 min-h-\[155px\] sm:min-h-\[170px\] group relative cursor-pointer"/g;
const newButtonStyle = `className="p-4 sm:p-5 flex flex-col items-center text-center justify-between gap-3 min-h-[155px] sm:min-h-[170px] group relative cursor-pointer bg-black/10 backdrop-blur-[3px] rounded-[24px] border border-white/30 shadow-[0_16px_32px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-4px_6px_rgba(0,0,0,0.6)] transition-all duration-300 hover:bg-black/15 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.8),inset_0_-6px_8px_rgba(0,0,0,0.7)]"`;
code = code.replace(buttonStylePattern, newButtonStyle);

code = code.replace(/scale-\[0\.85\]/g, "scale-[1.2]");
code = code.replace(/w-10 h-10 sm:w-12 sm:h-12 text-amber-500/g, "w-14 h-14 sm:w-16 sm:h-16 text-amber-500");

fs.writeFileSync("src/components/guest/guest-concierge-view.tsx", code, "utf8");
