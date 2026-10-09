// Generates native app icons (Android + iOS) from assets/app-icon-source.png
// Usage: node scripts/generate-app-icon.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'app-icon-source.png');
const BG = { r: 255, g: 117, b: 31, alpha: 1 }; // #FF751F
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const densities = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

// Logo scaled on an orange square (legacy / iOS icons)
async function onOrange(size, scale) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SRC).flatten({ background: BG }).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }]);
}

// Black glyph on transparent background (adaptive foreground)
async function glyphOnly(size, scale) {
  const inner = Math.round(size * scale);
  const { data, info } = await sharp(SRC).flatten({ background: BG }).resize(inner, inner)
    .raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
    out[j] = out[j + 1] = out[j + 2] = 0;
    out[j + 3] = 255 - data[i]; // red channel: 255 on orange, ~0 on black
  }
  const glyph = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, gravity: 'center' }]);
}

(async () => {
  for (const [d, f] of Object.entries(densities)) {
    const dir = path.join(RES, `mipmap-${d}`);
    const legacy = Math.round(48 * f);
    const adaptive = Math.round(108 * f);

    await (await onOrange(legacy, 0.95)).png().toFile(path.join(dir, 'ic_launcher.png'));

    const circle = Buffer.from(`<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}"/></svg>`);
    const roundBase = await (await onOrange(legacy, 0.85)).png().toBuffer();
    await sharp(roundBase).composite([{ input: circle, blend: 'dest-in' }]).png().toFile(path.join(dir, 'ic_launcher_round.png'));

    await (await glyphOnly(adaptive, 0.65)).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
    await sharp({ create: { width: adaptive, height: adaptive, channels: 4, background: BG } })
      .png().toFile(path.join(dir, 'ic_launcher_background.png'));
  }

  // iOS: 1024x1024, no alpha channel (App Store requirement)
  const ios = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
  await (await onOrange(1024, 1)).flatten({ background: BG }).removeAlpha().png().toFile(ios);

  // Keep a copy for @capacitor/assets style workflows
  fs.copyFileSync(ios, path.join(ROOT, 'assets', 'icon.png'));

  console.log('App icons generated.');
})().catch((e) => { console.error(e); process.exit(1); });
