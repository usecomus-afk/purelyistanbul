import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function OrtaklarYardimPage() {
  return (
    <LegalPageShell
      eyebrow="Ortaklar İçin"
      title="Ortaklar İçin Yardım Sayfası"
      intro="Deneyim ortaklarımızın ve ev sahiplerimizin purelyistanbul.com standartlarında hizmet sunabilmesi için hazırlanan operasyonel kılavuz."
    >
      <section>
        <h2>Kategori Standartları</h2>
        <p>
          10 ana kategoride (Kültürel Miras, Türk Hamamı &amp; Spa, Restoranlar, VIP Transfer vb.)
          hizmet sunan sağlayıcılar için belirlenen kalite, hijyen ve şeffaf fiyatlandırma
          kriterleri.
        </p>
      </section>

      <section>
        <h2>purelyistanbul Misafir Kalkanı Uyumu</h2>
        <p>Ortakların adil fiyat politikasına tam uyumu, taksimetre ve menü fiyatı taahhütleri.</p>
      </section>

      <section>
        <h2>comus AI Entegrasyonu</h2>
        <p>
          Konaklama host'ları ve otellerin misafirlerine comus AI rehberlik altyapısını nasıl
          sunacağı ve "Beni Tanı" tercih eşleştirmelerinin işleyişi.
        </p>
      </section>

      <section>
        <h2>Ödeme ve Hakediş Döngüsü</h2>
        <p>Haftalık şeffaf ödeme takvimi ve faturalandırma rehberi.</p>
      </section>
    </LegalPageShell>
  );
}
