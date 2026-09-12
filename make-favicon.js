const sharp = require('sharp');
const fs = require('fs');

async function createFavicon() {
  const size = 512;
  const radius = 128; // 25% rounded (squircle/oval like iOS)

  const roundedCorners = Buffer.from(
    `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`
  );

  const input = 'public/logo.png';
  
  const buffer = await sharp(input)
    .resize(size, size)
    .composite([{
      input: roundedCorners,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  fs.writeFileSync('public/icon.png', buffer);
  fs.writeFileSync('src/app/icon.png', buffer);
  fs.writeFileSync('public/apple-icon.png', buffer);
  
  // also create a 32x32 favicon.ico just in case
  await sharp(buffer).resize(32, 32).toFile('public/favicon.ico');
  
  console.log("Favicons created successfully!");
}

createFavicon().catch(console.error);
