"use client";

import { useState } from 'react';
import { LuxuryCategoryIcon } from '@/components/guest/luxury-category-icon';
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function MisafirKalkaniPage() {
  const [openTrap, setOpenTrap] = useState<number | null>(1);

  const shieldTopics = [
    {
      id: 1,
      title: "Sokak Tuzakları & Ayakkabı Boyacısı Hilesi",
      problem: "Yanınıza arkadaşça yaklaşıp 'özel bir bar' teklif edenler, fırçasını bilerek düşüren ayakkabı boyacıları veya sahte Osmanlı antikası satıcıları.",
      risk: "Gece kulüplerinde tartışmak fiziksel saldırıya veya fahiş hesap gaspına dönüşebilir. Sahte antika satın almak havalimanında tarihi eser kaçakçılığı şüphesiyle gözaltına yol açabilir.",
      action: "Fırça düşerse yürümeye devam edin. Yabancılardan gelen bar davetlerini kabul etmeyin. Dolandırıldıysanız tartışmayın, fiş alın ve doğrudan Turizm Polisine gidin.",
      law: "TCK madde 157-158 dolandırıcılık suçunu düzenler. Sahte tarihi eser satmak dolandırıcılık, gerçeğini izinsiz satmak kaçakçılıktır."
    },
    {
      id: 2,
      title: "Sarı Taksi Dolandırıcılıkları (Tırnakçılık & Taksimetre)",
      problem: "Taksimetreyi açmayıp sabit fahiş ücret istemek, yolu kasıtlı uzatmak veya 500 TL verdiğinizde hızla 50 TL ile değiştirip eksik para verdiğinizi iddia etmek.",
      risk: "Otoyol kenarında agresif şoförle tartışmak tehlikelidir. Bagajınız bagajdayken bilmediğiniz yerde mahsur kalabilirsiniz.",
      action: "Rotanızı telefonunuzun GPS'inden izleyin. Binmeden önce plakanın net fotoğrafını çekin. Taksimetre açılmazsa derhal inin. Parayı verirken banknotu açıkça sesli söyleyin.",
      law: "İBB TUDES mevzuatına göre taksimetre açmamak ve fazla ücret almak ağır para cezası ve ruhsat iptali gerektirir."
    },
    {
      id: 3,
      title: "Restoran & Gece Kulübü Şişirilmiş Hesaplar",
      problem: "Fiyatların yazmadığı menü verilmesi, söylenmeyen fahiş 'kuver' ve sipariş edilmeyen içecekler için binlerce lira istenmesi.",
      risk: "Ödeme yapılmazsa korumaların fiziksel tehdidi veya ATM'ye kadar zorla götürme riski (Gasp suçu).",
      action: "Fiyatların basılı olduğu menüyü görmeden sipariş vermeyin. Şişirilmiş hesap gelirse ayrıntılı adisyon isteyin. Tehdit edilirse 112 Polisi arayıp gasp edildiğinizi söyleyin.",
      law: "Tüketici Koruma Kanunu gereği tüm işletmeler girişlerinde ve masalarda net, onaylı fiyat listesi bulundurmak zorundadır."
    },
    {
      id: 4,
      title: "Sahte Polis / Sivil Denetim Tuzağı",
      problem: "Sokakta rozet gösterip 'sivil polis' olduğunu söyleyerek sahte uyuşturucu/para bahanesiyle cüzdan ve pasaportunuzu talep edenler.",
      risk: "Cüzdanınızı verirseniz el çabukluğuyla dövizleriniz ve kartlarınız çalınır veya pasaportunuz sahtesiyle değiştirilebilir.",
      action: "Asla cüzdanınızı sokakta vermeyin. 'Yalnızca en yakın resmi karakolda (Karakol) veya 112 çağırarak işlem yaparım' deyin. Dolandırıcılar hemen uzaklaşacaktır.",
      law: "Polis kimliği olmadan sivil şahısların arama yapması yasadışıdır."
    },
    {
      id: 5,
      title: "Kapalıçarşı Sahte Marka & Sahte Antika Satışları",
      problem: "Pazarlıkla 'gerçek tasarım çanta' veya 'el dokuma ipek halı' satılması; sonradan seri üretim sahte ürün olduğunun anlaşılması.",
      risk: "Maddi kaybın yanı sıra ülkeniz gümrüğünde sahte ürün cezası veya tarihi eser şüphesiyle havalimanında durdurulma riski.",
      action: "Daima ürün açıklamasını ('%100 İpek Halı') açıkça belirten resmi fiş/fatura talep edin. Şüphelenirseniz pazardaki Zabıta veya Turizm Polisine gidin.",
      law: "Fikri Mülkiyet Kanunu ihlalidir ve sözleşme hile nedeniyle yasal olarak geçersizdir."
    },
    {
      id: 6,
      title: "Türkiye'de Hastane Acil Durumları & Turist Sağlık Hakları",
      problem: "Aniden hastalanan turistin 'Özel sigortam yok, tedavi ederler mi veya peşinat ödeyemezsem kapıdan çevrilir miyim?' paniği.",
      risk: "Hayati tehlikesi olan gerçek acil durumlarda hastanelerin ücret talep edebileceği yanılgısıyla doktora gitmekten çekinmek.",
      action: "Gerçek acil durumda derhal 112'yi arayın veya en yakın Acil Servise gidin. Pasaportunuzu verin. Sigortayı tehlike geçtikten sonra halledin.",
      law: "T.C. Anayasası ve Sağlık Bakanlığı yönetmeliklerine göre tüm kamu ve özel hastaneler acil hastalara peşinat veya kredi kartı sormaksızın anında ücretsiz müdahale etmekle yükümlüdür."
    },
    {
      id: 7,
      title: "Turistler İçin 112 Acil Yardım Aramak",
      problem: "Türkçe bilmediği için 112 operatörüne derdini anlatamayacağı korkusuyla ambulans çağırmamak.",
      risk: "Yanlış veya geciken konum tarifi nedeniyle ambulansın gecikmesi.",
      action: "112'yi arayın. İngilizce, Almanca, Rusça veya Arapça konuşun. Önce sokak tabelası veya GPS koordinatıyla yerinizi söyleyin. Telefonu kapatmayın.",
      law: "112 merkezlerinde yabancı dillerde tercüman masaları bulunmaktadır ve yardım sağlamak yasal zorunluluktur."
    },
    {
      id: 8,
      title: "Turistler İçin Hukuki Riskler (Yapılmaması Gerekenler)",
      problem: "Turistlerin kendi ülkelerindeki kuralların aynen geçerli olduğunu veya dokunulmazlıkları olduğunu düşünmeleri.",
      risk: "Tarihi eser kaçakçılığı, devlete/Atatürk'e hakaret veya izinsiz drone uçurma nedeniyle tutuklanma ve sınır dışı edilme.",
      action: "Sokaktan taş, fosil, eski sikke almayın. Huzuru bozan sarhoşluktan kaçının. Askeri ve kamu binaları yakınında izinsiz drone uçurmayın.",
      law: "'Kanunu bilmemek mazeret sayılmaz' ilkesi geçerlidir. İhlaller TCK kapsamında kovuşturulur."
    },
    {
      id: 9,
      title: "İstanbul'da Turistlerin Dikkatli Olması Gereken Bölgeler",
      problem: "Gece yürüyüşlerinde tenha veya arka sokaklara girilmesi.",
      risk: "İstiklal Caddesi arkasındaki Tarlabaşı, gece geç saatte Aksaray otogar çevresi ve Fatih'in ışıksız ara sokakları.",
      action: "Gece ana aydınlatılmış caddeleri kullanın. Taksi yerine toplu taşıma veya güvenilir otel transferini tercih edin.",
      law: "İstanbul genelinde MOBESE kamera ağı ve Sultanahmet, Taksim, Kapalıçarşı Turizm Polisi Merkezleri 24 saat görev yapmaktadır."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EA] pb-24 text-[#141414]">
      <header className="bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#D8CBB8] p-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] flex items-center justify-center text-[#141414] transition shadow-2xs">
              <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
            </Link>
            <div>
              <h1 className="font-luxury-serif text-[16px] sm:text-[18px] font-semibold tracking-[0.12em] uppercase text-[#141414] leading-tight">
                OLD CITY HERITAGE HOTEL
              </h1>
              <span className="font-luxury-serif text-[11px] font-medium tracking-[0.22em] uppercase text-[#5C4938] block">
                ISTANBUL · MİSAFİR KALKANI
              </span>
            </div>
          </div>

          <div className="font-luxury-sans flex items-center gap-1.5 bg-[#FAF8F4] px-3 py-1.5 rounded-full border border-[#C4B8A4] text-xs font-bold text-[#7D5E2A]">
            <span>Misafir Kalkanı</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        
        {/* Top Hero Card */}
        <div className="luxury-service-card p-5 sm:p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-luxury-sans px-2.5 py-0.5 rounded-full bg-[#FAF8F4] border border-[#C4B8A4] text-[#7D5E2A] font-bold text-[10px] uppercase tracking-wider">
              Turist Güvenlik Rehberi
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="font-luxury-serif text-xl sm:text-2xl font-bold text-[#141414]">
                purelyİstanbul Misafir Kalkanı & İstanbul Seyahat Rehberi
              </h1>
              <p className="font-luxury-sans text-xs text-[#221F1C] leading-relaxed max-w-2xl">
                İstanbul&apos;da güvenli seyahat etmeniz için 9 yaygın sokak tuzağı, yasal sağlık haklarınız, resmi İstanbulkart & MüzeKart biletleri ve acil durum rehberleri.
              </p>
            </div>
            <div className="shrink-0 hidden sm:flex items-center justify-center">
              <LuxuryCategoryIcon categoryKey="shield" className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* ISTANBULKART & MUZEKART MODULLERI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="luxury-service-card p-4 sm:p-5 space-y-3 flex flex-col justify-between overflow-hidden">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3.5">
                <div className="shrink-0">
                  <LuxuryCategoryIcon categoryKey="istanbulkart" className="w-16 h-16" />
                </div>
                <div className="min-w-0">
                  <span className="font-luxury-sans text-[10px] uppercase tracking-[0.14em] text-[#8C6D46] font-bold block mb-0.5">
                    Ulaşım & Toplu Taşıma
                  </span>
                  <h3 className="font-luxury-serif text-[18px] font-bold text-[#141414] leading-tight">
                    Resmi İstanbulkart & Ulaşım
                  </h3>
                </div>
              </div>
              <p className="font-luxury-sans text-xs text-[#221F1C] leading-relaxed">
                Metro, tramvay, vapur, Marmaray ve otobüslerde geçerli tek resmi toplu taşıma kartı. Biletmatik cihazlarından veya online temin edebilirsiniz.
              </p>
            </div>

            <a
              href="https://www.istanbulkart.istanbul"
              target="_blank"
              rel="noopener noreferrer"
              className="font-luxury-sans w-full py-2.5 px-4 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <span>İstanbulkart Resmi Portalı</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="luxury-service-card p-4 sm:p-5 space-y-3 flex flex-col justify-between overflow-hidden">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3.5">
                <div className="shrink-0">
                  <LuxuryCategoryIcon categoryKey="muzekart" className="w-16 h-16" />
                </div>
                <div className="min-w-0">
                  <span className="font-luxury-sans text-[10px] uppercase tracking-[0.14em] text-[#8C6D46] font-bold block mb-0.5">
                    Kültür & Müzeler
                  </span>
                  <h3 className="font-luxury-serif text-[18px] font-bold text-[#141414] leading-tight">
                    Resmi MüzeKart & Biletler
                  </h3>
                </div>
              </div>
              <p className="font-luxury-sans text-xs text-[#221F1C] leading-relaxed">
                T.C. Kültür ve Turizm Bakanlığı&apos;na bağlı 300&apos;den fazla müze ve ören yerinde sıra beklemeden geçerli resmi giriş kartı.
              </p>
            </div>

            <a
              href="https://muze.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-luxury-sans w-full py-2.5 px-4 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <span>MüzeKart Satın Al / İncele</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 9 Hayati Tuzak ve Güvenlik Rehberi */}
        <div className="space-y-3">
          <h2 className="font-luxury-serif text-lg sm:text-xl font-bold uppercase tracking-[0.04em] text-[#141414] px-1">
            Yaygın Sokak Tuzakları & Hukuki Koruma Rehberi
          </h2>

          <div className="space-y-3 font-luxury-sans">
            {shieldTopics.map((item) => (
              <div key={item.id} className="luxury-service-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenTrap(openTrap === item.id ? null : item.id)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#141414] hover:bg-[#FAF8F4]/60 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {item.id}
                    </span>
                    <span className="font-luxury-serif text-[15px] font-bold">{item.title}</span>
                  </div>
                  {openTrap === item.id ? <ChevronUp className="w-4 h-4 text-[#8E7252]" /> : <ChevronDown className="w-4 h-4 text-[#8E7252]" />}
                </button>

                {openTrap === item.id && (
                  <div className="p-4 sm:p-5 space-y-3 text-xs text-[#221F1C] bg-[#FAF8F4]/90 border-t border-[#D8CBB8] leading-relaxed">
                    <div className="space-y-1">
                      <strong className="text-[#7D5E2A] block font-bold">Karşılaşılan Sorun:</strong>
                      <p>{item.problem}</p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-[#141414] block font-bold">Olası Riskler:</strong>
                      <p>{item.risk}</p>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-xl border border-[#C4B8A4]">
                      <strong className="text-[#7D5E2A] block font-bold">Misafirin Yapması Gerekenler:</strong>
                      <p className="text-[#141414]">{item.action}</p>
                    </div>

                    <div className="space-y-1 bg-[#F7F3EA] p-3 rounded-xl border border-[#D8CBB8]">
                      <strong className="text-[#141414] block font-bold">Türkiye&apos;de Hukuk Nasıl İşler?:</strong>
                      <p className="text-[#3D352E]">{item.law}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="luxury-service-card p-5 space-y-3 font-luxury-sans">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <LuxuryCategoryIcon categoryKey="emergency" className="w-12 h-12" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#8C6D46] font-bold block">
                7/24 Resmi Destek
              </span>
              <h3 className="font-luxury-serif text-[17px] font-bold text-[#141414]">Resmi Acil & Destek Hatları</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <a href="tel:112" className="p-3 bg-[#FAF8F4] rounded-xl border border-[#C4B8A4] hover:bg-[#EFE8DA] transition">
              <span className="text-[#5C4938] block text-[10px] font-semibold">Acil Çağrı Merkezi</span>
              <strong className="font-luxury-serif text-[#141414] text-base font-bold">112</strong>
            </a>
            <a href="tel:+902125274503" className="p-3 bg-[#FAF8F4] rounded-xl border border-[#C4B8A4] hover:bg-[#EFE8DA] transition">
              <span className="text-[#5C4938] block text-[10px] font-semibold">Turizm Polisi</span>
              <strong className="font-luxury-serif text-[#7D5E2A] text-sm font-bold">+90 212 527 45 03</strong>
            </a>
            <a href="tel:153" className="p-3 bg-[#FAF8F4] rounded-xl border border-[#C4B8A4] hover:bg-[#EFE8DA] transition">
              <span className="text-[#5C4938] block text-[10px] font-semibold">İBB Beyaz Masa</span>
              <strong className="font-luxury-serif text-[#141414] text-base font-bold">153</strong>
            </a>
            <a href="tel:153" className="p-3 bg-[#FAF8F4] rounded-xl border border-[#C4B8A4] hover:bg-[#EFE8DA] transition">
              <span className="text-[#5C4938] block text-[10px] font-semibold">Zabıta İhbar</span>
              <strong className="font-luxury-serif text-[#7D5E2A] text-base font-bold">153</strong>
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
