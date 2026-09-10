import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

const TUZAKLAR = [
  "Sokak Tuzakları & Ayakkabı Boyacısı Hilesi",
  "Sarı Taksi Dolandırıcılıkları (Tırnakçılık & Taksimetre Açmama)",
  "Restoran & Gece Kulübü Şişirilmiş Hesaplar",
  "Sahte Polis / Sivil Denetim Tuzağı",
  "Kapalıçarşı Sahte Marka & Sahte Antika Satışları",
  "Türkiye'de Hastane Acil Durumları & Turist Sağlık Hakları",
  "Turistler İçin 112 Acil Yardım Arama Prosedürü",
  "Turistler İçin Hukuki Riskler (Yapılmaması Gerekenler)",
  "İstanbul'da Turistlerin Dikkatli Olması Gereken Bölgeler",
];

export default function MisafirKalkaniPage() {
  return (
    <LegalPageShell
      eyebrow="Şartlar ve Ayarlar — Etik Değerlerimiz"
      title="purelyistanbul Misafir Kalkanı & Adil Alışveriş Politikası"
      intro="İstanbul'da her misafir adil, güvenilir ve şeffaf bir seyahat yaşamalıdır. purelyistanbul.com, haksız kazanç, fahiş fiyat ve kötü niyetli işletmelere karşı misafir haklarını aktif bir şekilde korur."
    >
      <section>
        <h2>Şikayet ve Kanıt Bildirimi</h2>
        <p>
          İstanbul seyahatiniz sırasında haksız fiyat, fahiş hesap veya usulsüz bir tutumla
          karşılaştığınızda; deneyim detayınızı ve fatura, fiş, taksi plakası ya da konum gibi
          kanıtları purelyistanbul.com sistemine yükleyerek hemen şikayet kaydı açabilirsiniz.
        </p>
      </section>

      <section>
        <h2>Şikayetiniz Sonrası purelyistanbul.com Ne Yapar? (7 Günlük İnceleme ve Yaptırım Akışı)</h2>
        <ul>
          <li>
            <strong>Adım 1 — Araştırma (1–2 Gün):</strong> Tarafınızdan iletilen kanıtların
            doğruluğu, piyasa rayiçleri ve olayın ciddiyeti hukuk ve operasyon ekibimizce
            incelenir.
          </li>
          <li>
            <strong>Adım 2 — İşletmeye Bildirim (2–3. Gün):</strong> İlgili işletmeye resmi
            bildirim gönderilerek durumu açıklaması istenir. İşletmeden makul bir açıklama yapması
            veya yaşatılan mağduriyeti derhal telafi etmesi talep edilir. Telafi tutarı,
            belirttiğiniz IBAN bilgilerine purelyistanbul.com güvencesiyle aktarılır. İşletmenin
            uzlaşmaması durumunda, şikayet diğer turist misafirlerin dikkat etmesi amacıyla
            purelyistanbul.com platformundaki Uyarı Panosu'nda kamuoyuna ilan edilir.
          </li>
          <li>
            <strong>Adım 3 — Kurumsal Bildirimler (Resmi Devlet Kurumları):</strong> CİMER
            (Cumhurbaşkanlığı İletişim Merkezi) üzerinden turist dolandırıcılığı, kayıt dışı sahte
            acenteler ve esnaf usulsüzlükleri ilgili Bakanlıklara (Kültür ve Turizm Bakanlığı,
            Ticaret Bakanlığı) sevk edilir; İBB TUDES (Toplu Ulaşım Hizmetleri Müdürlüğü)
            üzerinden taksi plakasıyla bildirilen fazla ücret, taksimetre açmama, yolcu seçme veya
            güzergah uzatma ihlalleri doğrudan cezai işlem için İBB yetkililerine iletilir.
          </li>
        </ul>
      </section>

      <section>
        <h2>İstanbul'da Karşılaşılabilecek Yaygın Tuzaklar ve Yasal Haklarınız</h2>
        <p>purelyistanbul.com, misafirlerini şehirdeki risklere karşı önceden eğitir ve bilinçlendirir:</p>
        <ul>
          {TUZAKLAR.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Resmi Acil &amp; Destek Hatları</h2>
        <ul>
          <li>Acil Çağrı Merkezi: 112</li>
          <li>İBB Beyaz Masa: 153</li>
          <li>Turizm Polisi: +90 (212) 527 45 03</li>
          <li>Zabıta İhbar: 153</li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
