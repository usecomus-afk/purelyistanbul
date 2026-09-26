const fs = require("fs");
const data = JSON.parse(fs.readFileSync("src/data/experiences.json", "utf8"));
const filteredData = data.filter(item => {
    if (!item.category) return true;
    if (item.category.startsWith("5.") || 
        item.category.startsWith("8.") || 
        item.category.startsWith("10.") || 
        item.category.startsWith("13.")) {
        return false;
    }
    return true;
});
fs.writeFileSync("src/data/experiences.json", JSON.stringify(filteredData, null, 2), "utf8");
