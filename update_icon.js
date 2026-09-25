const fs = require("fs");
let code = fs.readFileSync("src/components/guest/guest-concierge-view.tsx", "utf8");

// Change iconPath from .png to .svg for fotograf
code = code.replace(/iconPath: '\/icons\/categories\/fotograf-kostum\.png'/g, "iconPath: '/icons/categories/fotograf-kostum.svg'");

// Remove Camera conditional rendering
const cameraPattern = /\{cat\.iconPath\.includes\('fotograf'\) \? \([\s\S]*?<Camera className=[\s\S]*?<\/div>\s*\) : \(\s*<div/g;
code = code.replace(cameraPattern, "<div");

// Also remove the closing `}` for the ternary that was at the end of the div
const divClosePattern = /maskPosition: 'center'\s*\}\}\s*\/>\s*\)}/g;
code = code.replace(divClosePattern, "maskPosition: 'center'\n                          }}\n                        />");

fs.writeFileSync("src/components/guest/guest-concierge-view.tsx", code, "utf8");
