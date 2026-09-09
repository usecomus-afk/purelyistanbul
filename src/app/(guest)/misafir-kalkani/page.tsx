"use client";

import { useState } from 'react';
import { 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  ArrowLeft, 
  MapPin, 
  PhoneCall, 
  Building2, 
  CreditCard,
  Landmark,
  ShieldCheck,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandMark } from '@/components/brand-mark';

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
    <div className="min-h-screen bg-[#f8f6f0] pb-24 text-zinc-900">
      <header className="bg-white border-b border-amber-200/60 p-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-zinc-700 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BrandMark size={34} showText={true} />
          </div>

          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-300/60 text-xs font-bold text-red-900">
            <div className="w-4 h-4 relative shrink-0">
              <Image src="/icons/xenios-misafir-kalkani.png" alt="Kalkan" fill className="object-contain" />
            </div>
            <span>purelyİstanbul Misafir Kalkanı</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white p-6 rounded-3xl shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white text-amber-900 font-bold text-[10px] uppercase tracking-wider">
              Turist Güvenlik Rehberi
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold font-serif">
                purelyİstanbul Misafir Kalkanı & İstanbul Seyahat Rehberi
              </h1>
              <p className="text-xs text-white/90 leading-relaxed max-w-2xl">
                İstanbul'da güvenli seyahat etmeniz için 9 yaygın sokak tuzağı, yasal sağlık haklarınız, resmi İstanbulkart & MüzeKart biletleri ve acil durum rehberleri.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-2 border border-white/20 shrink-0 hidden sm:flex items-center justify-center">
              <Image src="/icons/xenios-misafir-kalkani.png" alt="Kalkan" width={48} height={48} className="object-contain" />
            </div>
          </div>
        </div>

        {/* ISTANBULKART & MUZEKART MODULLERI (Same Page) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-red-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-16 w-24 rounded-xl bg-red-500/5 p-1 border border-red-200 flex items-center justify-center overflow-hidden">
                <Image 
                  src="/icons/istanbulkart.png" 
                  alt="Resmi İstanbulkart & Ulaşım" 
                  width={80} 
                  height={52} 
                  className="object-contain drop-shadow-xs" 
                />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Resmi İstanbulkart & Ulaşım</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Metro, tramvay, vapur, Marmaray ve otobüslerde geçerli tek resmi toplu taşıma kartı. Biletmatik cihazlarından veya online temin edebilirsiniz.
              </p>
            </div>

            <a
              href="https://www.istanbulkart.istanbul"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>İstanbulkart Resmi Portalı</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-16 w-24 rounded-xl bg-amber-500/5 p-1 border border-amber-200 flex items-center justify-center overflow-hidden">
                <Image 
                  src="/icons/muzekart.png" 
                  alt="Resmi MüzeKart & Biletler" 
                  width={80} 
                  height={52} 
                  className="object-contain drop-shadow-xs" 
                />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Resmi MüzeKart & Biletler</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                T.C. Kültür ve Turizm Bakanlığı'na bağlı 300'den fazla müze ve ören yerinde sıra beklemeden geçerli resmi giriş kartı.
              </p>
            </div>

            <a
              href="https://muze.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>MüzeKart Satın Al / İncele</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 9 Hayati Tuzak ve Güvenlik Rehberi */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold font-serif text-zinc-900">
            Yaygın Sokak Tuzakları & Hukuki Koruma Rehberi
          </h2>

          <div className="space-y-3">
            {shieldTopics.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenTrap(openTrap === item.id ? null : item.id)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-zinc-900 bg-zinc-50/80 hover:bg-amber-50/50 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {item.id}
                    </span>
                    <span>{item.title}</span>
                  </div>
                  {openTrap === item.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>

                {openTrap === item.id && (
                  <div className="p-5 space-y-3.5 text-xs text-zinc-700 bg-white border-t border-zinc-200 leading-relaxed">
                    <div className="space-y-1">
                      <strong className="text-red-700 block font-bold">⚠️ Karşılaşılan Sorun:</strong>
                      <p>{item.problem}</p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-amber-700 block font-bold">🛑 Olası Riskler:</strong>
                      <p>{item.risk}</p>
                    </div>

                    <div className="space-y-1 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                      <strong className="text-emerald-800 block font-bold">✅ Misafirin Yapması Gerekenler:</strong>
                      <p className="text-emerald-950">{item.action}</p>
                    </div>

                    <div className="space-y-1 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                      <strong className="text-zinc-800 block font-bold">📜 Türkiye'de Hukuk Nasıl İşler?:</strong>
                      <p className="text-zinc-600">{item.law}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center p-1 border border-red-200">
              <Image src="/icons/sos-emergency.png" alt="SOS Acil" width={20} height={20} className="object-contain" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Resmi Acil & Destek Hatları</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
              <span className="text-zinc-500 block text-[10px]">Acil Çağrı Merkezi</span>
              <strong className="text-red-600 text-sm font-mono">112</strong>
            </div>
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
              <span className="text-zinc-500 block text-[10px]">Turizm Polisi</span>
              <strong className="text-blue-600 text-sm font-mono">+90 212 527 45 03</strong>
            </div>
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
              <span className="text-zinc-500 block text-[10px]">İBB Beyaz Masa</span>
              <strong className="text-zinc-800 text-sm font-mono">153</strong>
            </div>
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
              <span className="text-zinc-500 block text-[10px]">Zabıta İhbar</span>
              <strong className="text-amber-800 text-sm font-mono">153</strong>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
