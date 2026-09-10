import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

const CATEGORIES = [
  "Kültürel Miras",
  "Tarih & Müzeler",
  "Türk Hamamı & Spa",
  "Macera & Doğa",
  "VIP Transfer",
  "Alışveriş & Çarşılar",
  "Sanat & Semazen",
  "Estetik & Güzellik",
  "Önerilen Restoranlar",
  "Fotoğraf & Kostüm",
];

export default function HizmetKosullariPage() {
  return (
    <LegalPageShell eyebrow="Şartlar ve Ayarlar" title="Hizmet Koşulları">
      <p className="text-ink-muted">
        purelyistanbul.com, İstanbul genelinde doğrulanmış yerel deneyimleri, rehberli turları ve
        nitelikli şehir içi servisleri misafirlerle buluşturan bağımsız bir aracı platformdur.
      </p>

      <section>
        <h2>Hizmet Kapsamı ve Yol Haritası</h2>
        <p>
          purelyistanbul.com, ilk aşamada platform trafiğini ve yerel hizmet standartlarını en üst
          seviyeye ulaştırmak amacıyla doğrudan oda/konaklama satışı yapmamaktadır. İlk etapta
          platform üzerinde yalnızca doğrulanmış şu 10 ana kategoride hizmet ve deneyim
          rezervasyonu sağlanır:
        </p>
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="italic">
          Butik konaklama tesisleri ve host portföyü için ön kayıtlar toplanmakta olup, oda
          rezervasyonları ilerleyen fazda devreye alınacaktır.
        </p>
      </section>

      <section>
        <h2>Rezervasyon ve İptal Şartları</h2>
        <p>
          Deneyim ve servis sağlayıcılarının belirlediği katılım ve iptal kuralları rezervasyon
          ekranında açıkça belirtilir. Hizmet başlangıç saatine kadar geçerli olan iptal hakları
          şeffaf bir şekilde işletilir.
        </p>
      </section>

      <section>
        <h2>Tarafların Sorumluluğu</h2>
        <p>
          purelyistanbul.com, sağlayıcıların hizmet kalitesini denetlemekle birlikte, etkinlik
          sırasında katılımcıların yerel kanunlara, tarihi eser kurallarına ve güvenlik
          talimatlarına uymasını şart koşar.
        </p>
      </section>
    </LegalPageShell>
  );
}
