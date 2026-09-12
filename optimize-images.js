const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public', 'images', 'experiences');

async function optimizeImages() {
  console.log('Starting image optimization...');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
  
  let totalSaved = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Sadece 1.5MB'tan buyuk resimleri optimize et
    if (stat.size > 1.5 * 1024 * 1024) {
      console.log(`Optimizing ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);
      
      const tempPath = filePath + '.tmp';
      
      try {
        await sharp(filePath)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toFile(tempPath);
          
        const newStat = fs.statSync(tempPath);
        const saved = stat.size - newStat.size;
        totalSaved += saved;
        
        fs.renameSync(tempPath, filePath);
        console.log(`  -> Done. Saved ${(saved / 1024 / 1024).toFixed(2)} MB.`);
      } catch (err) {
        console.error(`  -> Failed to optimize ${file}:`, err);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }
  }
  
  console.log(`Finished! Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB.`);
}

optimizeImages();
