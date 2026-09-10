import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function ErisilebilirlikBildirisiPage() {
  return (
    <LegalPageShell eyebrow="Şartlar ve Ayarlar" title="Erişilebilirlik Bildirisi">
      <p className="text-ink-muted">
        purelyistanbul.com, sunduğu dijital deneyimin engelsiz olmasını sağlarken, İstanbul'un
        tarihi ve coğrafi yapısına dair fiziksel erişilebilirlik koşullarını da şeffaf şekilde
        ilan eder.
      </p>

      <section>
        <h2>Dijital Arayüz</h2>
        <p>
          Web platformumuz ve comus AI etkileşim arayüzleri, ekran okuyuculara ve mobil
          erişilebilirlik standartlarına uyumludur.
        </p>
      </section>

      <section>
        <h2>Deneyim &amp; Lokasyon Şeffaflığı</h2>
        <p>
          Tarihi Yarımada, Boğaz iskeleleri, Beyoğlu ara sokakları veya Kapalıçarşı gibi basamaklı,
          yokuşlu ya da tarihi koruma altındaki asansörsüz mekanlarda gerçekleşen turlar ve hamam
          deneyimleri için hareket kısıtlılığına uygunluk durumu her etkinlik sayfasında simgelerle
          ve açık uyarılarla belirtilir.
        </p>
      </section>
    </LegalPageShell>
  );
}
