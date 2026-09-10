import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

const TUZAKLAR = [
  {
    title: "Sokak Tuzakları & Ayakkabı Boyacısı Hilesi",
    desc: "Yolda yürürken önünüzden geçen bir ayakkabı boyacısı aniden fırçasını yere düşürür. Siz iyi niyetle fırçayı alıp verdiğinizde, boyacı teşekkür etmek bahanesiyle hemen ayakkabınızı boyamaya başlar. Ancak işlem bittiğinde sizden fahiş bir ücret talep eder. Bu klasik bir turist tuzağıdır; fırça düşüren kişilere tepki vermeden yolunuza devam etmelisiniz."
  },
  {
    title: "Sarı Taksi Dolandırıcılıkları (Tırnakçılık & Taksimetre Açmama)",
    desc: "Bazı kötü niyetli taksiciler taksimetre açmayı reddedip önceden yüksek bir sabit fiyat isteyebilir. Ayrıca 'tırnakçılık' adı verilen yöntemle, ödeme yaparken verdiğiniz 500 TL veya 200 TL'lik banknotu el çabukluğuyla 50 TL veya 20 TL ile değiştirerek eksik para verdiğinizi iddia edebilirler. Taksimetreyi her zaman açtırın, mümkünse BiTaksi veya Uber kullanın ve para verirken değerini sesli olarak (örn: 'Buyrun 500 Lira') söyleyerek teslim edin."
  },
  {
    title: "Restoran & Gece Kulübü Şişirilmiş Hesaplar",
    desc: "Özellikle Taksim, İstiklal Caddesi ve Sultanahmet civarında yanınıza yaklaşan iyi giyimli biri sizinle sohbet kurup bir şeyler içmeye davet eder. Sizi yönlendirdiği mekanda masanıza oturan kişilerin söyledikleri içkiler adisyonunuza astronomik fiyatlarla (binlerce euro) yansıtılır ve ödemeden çıkmanıza izin verilmez. Asla sokakta tanıştığınız yabancıların davetiyle mekanlara gitmeyin ve menüde fiyatları görmeden sipariş vermeyin."
  },
  {
    title: "Sahte Polis / Sivil Denetim Tuzağı",
    desc: "Sivil giyimli kişiler yanınıza gelip cüzdan şeklinde sahte bir polis rozeti göstererek pasaportunuzu veya cüzdanınızı sahte para kontrolü bahanesiyle aramak isteyebilir. Bu sırada el çabukluğuyla nakit paranızı çalarlar. Gerçek Türk polisi sokak ortasında turistlerin cüzdanındaki parayı saymaz. Böyle bir durumda üniformalı polis çağırmalarını isteyin veya en yakın karakola gitmeyi teklif edin."
  },
  {
    title: "Kapalıçarşı Sahte Marka & Sahte Antika Satışları",
    desc: "Otantik halı, takı veya tarihi eser adı altında size sahte objeler yüksek fiyatlardan satılmaya çalışılabilir. Unutmayın ki, Türkiye'den orijinal tarihi eser niteliği taşıyan herhangi bir objeyi yurtdışına çıkarmak yasaktır ve ağır cezai yaptırımları vardır. Kıymetli eşya alımlarınızı yalnızca resmi sertifikalı mağazalardan yapın."
  },
  {
    title: "Türkiye'de Hastane Acil Durumları & Turist Sağlık Hakları",
    desc: "Özel hastaneler turistlerden yüksek muayene ücretleri talep edebilir. Ancak bilinmelidir ki, hayati tehlike arz eden (kalp krizi, ağır yaralanmalı trafik kazası, bilinç kaybı vb.) acil durumlarda, özel hastaneler de dahil olmak üzere Türkiye'deki tüm hastanelerde ilk acil müdahale yasalar gereği ücretsizdir. Beklenmedik durumlar için seyahat sağlık sigortanızı her zaman hazır bulundurun."
  },
  {
    title: "Turistler İçin 112 Acil Yardım Arama Prosedürü",
    desc: "Türkiye'de Polis, Ambulans, İtfaiye, Orman Yangını ve Sahil Güvenlik gibi tüm acil durumlar için tek bir çağrı numarası kullanılır: 112. Numarayı aradığınızda operatörler İngilizce dahil olmak üzere yabancı dil bilmektedir. Sakin kalarak konumunuzu ve acil durumun türünü net bir şekilde aktarmanız yeterlidir."
  },
  {
    title: "Turistler İçin Hukuki Riskler (Yapılmaması Gerekenler)",
    desc: "Sokaklarda açıktan alkol tüketmek halk arasında hoş karşılanmayabilir ve bazı durumlarda kabahat sayılır. İzinsiz drone uçurmak (özellikle Boğaziçi bölgesi, tarihi yarımada, askeri alanlar çevresinde) yasaktır ve cihazınıza el konulabilir. Türk Lirası'na veya Türkiye Cumhuriyeti'nin kurucu değerlerine ve devlet büyüklerine hakaret etmek ciddi bir suçtur. Güvenliğiniz için pasaportunuzun veya resmi kimliğinizin bir kopyasını her zaman yanınızda taşıyın."
  },
  {
    title: "İstanbul'da Turistlerin Dikkatli Olması Gereken Bölgeler",
    desc: "İstanbul genel olarak son derece güvenli bir şehirdir. Ancak gece geç saatlerde Tarlabaşı, Aksaray'ın arka sokakları ve İstiklal Caddesi'nin tenha ara sokaklarında daha dikkatli olunmalıdır. Kapalıçarşı, Mısır Çarşısı, Sultanahmet Meydanı ve kalabalık tramvay hatlarında yankesiciliğe karşı çantanızı her zaman önünüzde kapalı tutun."
  }
];

export default function MisafirKalkaniPage() {
  return (
    <LegalPageShell
      eyebrow="Destek — Etik Değerlerimiz"
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
        <div className="space-y-6 mt-6">
          {TUZAKLAR.map((t, idx) => (
            <div key={idx} className="bg-sand-bg/50 p-5 rounded-2xl border border-sand-border">
              <h3 className="text-base font-semibold text-ink mb-2">{t.title}</h3>
              <p className="text-[14px] text-ink-muted leading-relaxed m-0">{t.desc}</p>
            </div>
          ))}
        </div>
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
