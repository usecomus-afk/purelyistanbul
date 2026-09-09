"use client";

import { useState } from 'react';
import { 
  Scale, 
  ArrowLeft, 
  Landmark, 
  Car, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BrandMark } from '@/components/brand-mark';

export default function AdilAlisverisPolitikasiPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "purelyİstanbul'a şikayet edersem, işletme beni bulabilir mi?",
      a: "Hayır. purelyİstanbul'un adillik politikasında turist kimliği %100 korunur. İşletme sadece 'Bir misafir x sorununu bildirdi' bilgisini öğrenir. Adınız, telefonunuz veya e-postanız asla işletmeyle paylaşılmaz."
    },
    {
      q: "7 gün sonra işletme cevap vermezse ne oluyor?",
      a: "İşletmenin sessiz kalması kabul edilmez. 7 gün sonunda işletme doğrudan 'Alışveriş Rehberi & Uyarı Panosu'nda kamuya açık olarak yayınlanır ve resmi kurumlara (CİMER/Ticaret Bakanlığı/TUDES) ihbar edilir."
    },
    {
      q: "İşletme uyarı sayfasından nasıl çıkarılır?",
      a: "Yazılı başvuru yaparak purelyİstanbul ile resmi temas kurması gerekir. Mağdur misafirin zararını telafi ettiğini belgelerse uyarı kaldırılabilir. Ancak tekrar şikayet gelirse kalıcı kara listeye alınır."
    },
    {
      q: "Sahte veya asılsız şikayet yaparsam ne olur?",
      a: "purelyİstanbul tüm başvuruları fiş, fatura, konum ve makbuzlarla inceler. Kanıtı olmayan şikayetler reddedilir. Sahte bildirimde bulunan hesaplar sistemden sınırlandırılır."
    },
    {
      q: "purelyİstanbul'da ilanı olmayan bir esnaftan dolandırıldıysam?",
      a: "Fark etmez. purelyİstanbul'un misyonu gereği, o işletme de kanıtlar doğrultusunda Alışveriş Rehberi'nde uyarılır ve resmi kurumlara ihbarda bulunulur."
    },
    {
      q: "Taksi dolandırıcılığı için ne yapmalıyım?",
      a: "Taksi plakasını ve fişi sisteme yükleyin. purelyİstanbul bu durumu İBB-TUDES sistemi üzerinden online resmi ihbar kaydına geçirir ve şoför hakkında cezai işlem başlatılmasını sağlar."
    },
    {
      q: "Şikayet açtıktan ne kadar süre sonra sonuç alırım?",
      a: "Ortalama 10-14 gün. (Araştırma 1-2 gün + işletmenin cevap süresi 7 gün + kamuya açıklanma ve resmi ihbar süreci)."
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
              <Image src="/icons/xenios-adil-alisveris.png" alt="Adil Alışveriş" fill className="object-contain" />
            </div>
            <span>purelyİstanbul Adil Alışveriş Politikası</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Policy Header Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 text-white p-6 rounded-3xl shadow-xl border border-amber-500/30 space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider">
                Şeffaflık & Adalet Taahhütü
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-serif">
                purelyİstanbul Adil Alışveriş Politikası
              </h1>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                İstanbul'da her turist adil, güvenilir ve şeffaf bir alışveriş deneyimi yaşamalıdır. purelyİstanbul, haksız uygulamalar ve kötü niyetli işletmelerden sizi korur.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 shrink-0 hidden sm:flex items-center justify-center">
              <Image src="/icons/xenios-adil-alisveris.png" alt="Adil Alışveriş" width={48} height={48} className="object-contain" />
            </div>
          </div>
        </div>

        {/* 1. Şikayet Nasıl Yapılır? */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">1</span>
            <span>Şikayet Nasıl Yapabilirsin?</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-zinc-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-amber-50 text-zinc-800 font-bold border-b border-zinc-200">
                  <th className="p-2.5">Kanıt Türü</th>
                  <th className="p-2.5">Nedir?</th>
                  <th className="p-2.5">Örnek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-600">
                <tr>
                  <td className="p-2.5 font-bold text-zinc-900">Fatura / Fiş</td>
                  <td className="p-2.5">İşletmeden aldığın ödeme belgesi</td>
                  <td className="p-2.5">Restoran fişi, tur makbuzu, ürün faturası</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-zinc-900">Ekran Görüntüsü</td>
                  <td className="p-2.5">Telefon, app veya web ekran görüntüsü</td>
                  <td className="p-2.5">Yanlış fiyat, ödeme onayı, konuşma</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-zinc-900">Konum Bilgisi</td>
                  <td className="p-2.5">İşletmenin harita konumu veya adresi</td>
                  <td className="p-2.5">Google Maps linki, sokak adı</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-zinc-900">Taksi Plakası</td>
                  <td className="p-2.5">Taksi dolandırıcılığı yaşandıysa</td>
                  <td className="p-2.5">Sarı plaka numarası (Örn: 34 TAA 01)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. purelyİstanbul Ne Yapacak? 7 Günlük Süreç */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">2</span>
            <span>purelyİstanbul Ne Yapacak? (7 Günlük İnceleme ve Yaptırım Akışı)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <strong className="text-zinc-900 font-bold block">Adım 3: Araştırma (1-2 Gün)</strong>
              <p className="text-zinc-600">Kanıtların doğruluğu, piyasa rayiçleri ve olayın ciddiyeti incelenir.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <strong className="text-zinc-900 font-bold block">Adım 4: İşletmeye Bildirim (Gün 2-3)</strong>
              <p className="text-zinc-600">İşletmeye resmi e-posta gönderilir: 'Bir hata mı yapıldı? Turisti telafi etmeyi kabul ediyor musunuz?'</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <BadgeAlert className="w-4 h-4" />
              <span>Adım 6: Kamuya Açıklanma (8. Gün Sonrası Örnek Kayıt)</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-300 bg-black/50 p-3 rounded-xl border border-zinc-800 space-y-1">
              <p><span className="text-amber-400">⚠️ UYARI:</span> Turist Mağduriyeti Kaydı</p>
              <p><span className="text-zinc-400">İşletme:</span> Örnek Restoran, Fatih, İstanbul</p>
              <p><span className="text-zinc-400">Sorun:</span> Fatura 250 TL, müşteriden 450 TL tahsil etme</p>
              <p><span className="text-zinc-400">purelyİstanbul Kararı:</span> İşletme 7 gün içinde telafi etmedi ➔ Kamuya Uyarı Panosunda Yayınlandı</p>
            </div>
          </div>
        </div>

        {/* 3. Kurumsal Bildirimler */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">3</span>
            <span>Kurumsal Bildirimler (Resmi Devlet Kurumları)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
              <strong className="text-zinc-900 font-bold flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-red-600" />
                <span>CİMER (Cumhurbaşkanlığı İletişim)</span>
              </strong>
              <p className="text-zinc-500">Turist dolandırıcılığı, sahte acenteler ve esnaf usulsüzlükleri Kültür & Turizm ve Ticaret Bakanlığı'na sevk edilir.</p>
            </div>

            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
              <strong className="text-zinc-900 font-bold flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-600" />
                <span>İBB TUDES (Toplu Ulaşım Hizmetleri)</span>
              </strong>
              <p className="text-zinc-500">Taksi plakasıyla bildirilen fazla ücret, taksimetre açmama ve güzergah uzatma şikayetleri doğrudan cezai işleme alınır.</p>
            </div>
          </div>
        </div>

        {/* SSS */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Sık Sorulan Sorular (SSS)</span>
          </h2>

          <div className="space-y-2 text-xs">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-zinc-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-3.5 text-left font-bold text-zinc-900 bg-zinc-50 hover:bg-amber-50/50 flex items-center justify-between transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </button>
                {openFaq === idx && (
                  <div className="p-3.5 text-zinc-600 bg-white border-t border-zinc-200 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <Link
            href="/complaints"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-lg transition"
          >
            <span>Şikayet Bildir & İnceleme Başlat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </main>
    </div>
  );
}
