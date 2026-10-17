/**
 * Yüklenen görseli tarayıcıda küçültüp data-URL'e çevirir. Panelden yüklenen ikon ve
 * ilan görselleri localStorage + Firestore (belge başına ~1 MB sınır) içinde saklandığı
 * için boyut kontrollü tutulmalıdır.
 */
export function fileToResizedDataUrl(
  file: File,
  options: { maxSize: number; mime?: "image/png" | "image/jpeg" | "image/webp"; quality?: number }
): Promise<string> {
  const { maxSize, mime = "image/jpeg", quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Lütfen bir görsel dosyası seçin."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Görsel açılamadı."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Görsel işlenemedi."));
          return;
        }
        if (mime === "image/jpeg") {
          // JPEG saydamlığı desteklemez: beyaz zemin
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mime, quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
