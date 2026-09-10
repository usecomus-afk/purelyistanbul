import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function GizlilikBildirimiPage() {
  return (
    <LegalPageShell eyebrow="Şartlar ve Ayarlar" title="Gizlilik Bildirimi">
      <p className="text-ink-muted">
        purelyistanbul.com, misafirlerinin, anlaşmalı ev sahiplerinin (host) ve yerel deneyim
        ortaklarının kişisel verilerini 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve
        uluslararası veri koruma ilkeleri çerçevesinde korur.
      </p>

      <section>
        <h2>Toplanan Bilgiler</h2>
        <p>
          Rezervasyon ve transfer operasyonlarının yürütülmesi amacıyla kimlik ve iletişim
          bilgileri (ad, soyad, e-posta, telefon numarası) toplanır.
        </p>
      </section>

      <section>
        <h2>comus AI ve "Beni Tanı" Veri İşleme Rızası</h2>
        <p>
          purelyistanbul.com ile çalışan host'ların mülklerinde veya anlaşmalı butik otellerde
          konaklayan misafirlerimizin, comus AI üzerinden kendi dillerinde kişiselleştirilmiş
          rehberlik alabilmesi için sunduğu isteğe bağlı veriler (seyahat tarzı, bütçe aralığı,
          ilgi alanları ile gıda/sağlık alerjileri: kuruyemiş, laktoz, gluten, deniz ürünleri vb.)
          yalnızca misafirin açık onayıyla, anlık güvenli öneriler sunmak üzere işlenir. Bu veriler
          üçüncü şahıslara veya reklam ağlarına kesinlikle aktarılmaz.
        </p>
      </section>

      <section>
        <h2>Şikayet ve Tüketici Hakları Verileri</h2>
        <p>
          Haksız kazanç ve dolandırıcılık bildirimlerinde sisteme yüklenen fiş, fatura, taksi
          plakası veya görsel kanıtlar, yalnızca inceleme süreci ve gerekirse resmi makamlara
          (CİMER, TUDES) bildirim amacıyla muhafaza edilir.
        </p>
      </section>

      <section>
        <h2>Veri Güvenliği</h2>
        <p>
          purelyistanbul.com, rezervasyon süreçlerinin ifası haricinde hiçbir kişisel veriyi
          ticari amaçla satmaz veya üçüncü taraflarla paylaşmaz.
        </p>
      </section>
    </LegalPageShell>
  );
}
