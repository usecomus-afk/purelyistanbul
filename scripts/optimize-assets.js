const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const stat = fs.statSync(fullPath);
      
      // If unused intro gifs
      if (entry.name === 'purely-intro.gif' || entry.name === 'intro.gif') {
        console.log('Removing unused gif:', entry.name);
        fs.unlinkSync(fullPath);
        continue;
      }

      // If PNG over 100KB, resize and compress
      if (ext === '.png' && stat.size > 100 * 1024) {
        try {
          const tempPath = fullPath + '.tmp';
          const maxDim = fullPath.includes('icons') ? 256 : 600;
          await sharp(fullPath)
            .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
            .png({ compressionLevel: 9, quality: 85 })
            .toFile(tempPath);
          fs.renameSync(tempPath, fullPath);
          const newStat = fs.statSync(fullPath);
          console.log(`Shrunk ${entry.name}: ${(stat.size/1024).toFixed(0)}KB -> ${(newStat.size/1024).toFixed(0)}KB`);
        } catch (err) {
          console.error(`Error processing ${entry.name}:`, err.message);
        }
      }
    }
  }
}

async function run() {
  console.log('Optimizing public assets...');
  await processDir(path.join(__dirname, '..', 'public'));
  console.log('Optimization complete!');
}

run();
