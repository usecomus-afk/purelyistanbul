const fs = require("fs");
const text = fs.readFileSync("src/data/experiences.json", "utf8").replace(/^\uFEFF/, "");
const data = JSON.parse(text);

const categoryMap = {
    "1. Boğaz & Tekne Deneyimleri": "Boğaz Turları & Yat",
    "2. Tarihi Rota & Hızlı Geçiş Turları": "Tarih & Müzeler",
    "3. Gastronomi & Sokak Lezzetleri": "Gastronomi & Gurme",
    "4. Geleneksel & Kültürel Deneyimler": "Türk Hamamı & Spa",
    "11. Modern Sanat, Tasarım & Mimarlık Yürüyüşleri": "Sanat & Semazen",
    "6. Ulaşım, Transfer & Şehir Kartları": "Özel VIP Transfer",
    "7. Fotoğrafçılık & Sosyal Medya Çekimleri": "Fotoğraf & Kostüm",
    "9. Alışveriş, Stilist & Pazarlık Asistanlığı": "Alışveriş & Çarşılar",
    "12. Mistik, İnanç & Çok Kültürlü Miras Rotaları": "Kültürel Miras",
    "Önerdiğimiz Restoranlar": "Önerdiğimiz Restoranlar",
    "14. Medikal Estetik & Güzellik": "Medikal Estetik & Güzellik",
    "İstanbul'da Yatırım": "İstanbul'da Yatırım"
};

// Also we should ensure Whirling Dervishes goes to "Sanat & Semazen"
// Let's just blindly map the categories first
data.forEach(item => {
    if (categoryMap[item.category]) {
        item.category = categoryMap[item.category];
    }
    // Hardcode rule for semazen just in case
    if (item.title.toLowerCase().includes('semazen') || item.title.toLowerCase().includes('whirling')) {
        item.category = "Sanat & Semazen";
    }
});

// Also remove any categories not in the above list
const validCategories = Object.values(categoryMap);
const filteredData = data.filter(item => validCategories.includes(item.category));

fs.writeFileSync("src/data/experiences.json", JSON.stringify(filteredData, null, 2), "utf8");
console.log("Filtered count:", filteredData.length);
