const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public', 'images', 'experiences');

async function optimizeImages() {
  console.log('Starting aggresive image optimization for fast loading...');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.size > 150 * 1024) { // Only resize if > 150KB
      console.log(`Shrinking ${file}...`);
      const tempPath = filePath + '.tmp';
      try {
        await sharp(filePath)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 60 })
          .toFile(tempPath);
          
        fs.renameSync(tempPath, filePath);
      } catch (err) {
        console.error(`Failed ${file}:`, err);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  }
  console.log('Finished aggressive optimization.');
}
optimizeImages();
