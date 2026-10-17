"use client";

import { useState } from 'react';
import { XeniosStore } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { LuxuryCategoryIcon } from '@/components/guest/luxury-category-icon';
import { 
  CreditCard, 
  ArrowLeft,
  Send,
  CheckCircle2,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function GuestComplaintsPage() {
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<Complaint['businessCategory']>('Restoran / Kafe');
  const [location, setLocation] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [amountExpected, setAmountExpected] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [refundIban, setRefundIban] = useState('');
  const [description, setDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !amountPaid || !description || !guestEmail) {
      toast.error("Lütfen zorunlu alanları (İşletme adı, ödenen tutar, açıklama ve e-posta) doldurunuz.");
      return;
    }

    setIsSubmitting(true);

    const paid = parseFloat(amountPaid) || 0;
    const expected = parseFloat(amountExpected) || (paid * 0.4);
    const discrepancy = Math.max(0, paid - expected);

    setTimeout(() => {
      const newComp = XeniosStore.addComplaint({
        businessName,
        businessCategory,
        location: location || 'İstanbul',
        incidentDate: new Date().toISOString().split('T')[0],
        amountPaid: paid,
        amountExpected: expected,
        currency,
        discrepancyAmount: discrepancy,
        guestName: guestName || 'Misafir',
        guestEmail: guestEmail,
        guestPhone: guestPhone || '+90 532 000 00 00',
        hotelName: XeniosStore.getHotelById(XeniosStore.getActiveHotelId())?.name || 'Hotel Sultanahmet',
        roomNumber: XeniosStore.getActiveRoomId(),
        description,
        businessEmail: businessEmail || undefined,
        refundIbanOrCard: refundIban || undefined,
        status: 'under_review'
      });

      setIsSubmitting(false);
      setSubmittedCode(newComp.trackingCode);
      toast.success("Şikayet ve hakem inceleme talebiniz başarıyla oluşturuldu.");

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] pb-24 text-[#141414]">
      {/* Header */}
      <header className="bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#D8CBB8] p-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] flex items-center justify-center text-[#141414] transition shadow-2xs">
              <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
            </Link>
            <div>
              <h1 className="font-luxury-serif text-[16px] sm:text-[18px] font-semibold tracking-[0.12em] uppercase text-[#141414] leading-tight">
                OLD CITY HERITAGE HOTEL
              </h1>
              <span className="font-luxury-serif text-[11px] font-medium tracking-[0.22em] uppercase text-[#5C4938] block">
                ISTANBUL · HAKEM MASASI
              </span>
            </div>
          </div>

          <div className="font-luxury-sans flex items-center gap-2 bg-[#FAF8F4] px-3 py-1.5 rounded-full border border-[#C4B8A4] text-xs font-bold text-[#7D5E2A]">
            <span>Hakem Masası</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto p-4 space-y-5">
        
        {/* Mission Statement Hero Banner */}
        <div className="luxury-service-card p-5 sm:p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-luxury-serif text-[18px] sm:text-[20px] text-[#141414] font-bold tracking-[0.02em]">
                İstanbul&apos;un Misafirleri Başımızın Tacıdır
              </h2>

              <p className="font-luxury-sans text-xs text-[#221F1C] leading-relaxed max-w-2xl">
                İstanbul&apos;da karşılaştığınız şüpheli, fahiş fiyatlı veya aldatıcı alışverişleri platformumuza bildirin. 
                purelyİstanbul olarak işletmeyle resmi iletişime geçerek hatanın telafisini ve haksız tahsil edilen farkın 
                <strong className="text-[#7D5E2A] font-bold"> doğrudan hesabınıza iadesini</strong> talep ediyoruz. 
                İyi niyet göstermeyen ve 30 gün içinde telafi etmeyen işletmeleri sonraki misafirleri korumak için 
                <strong className="text-[#141414] font-bold"> Uyarı Panosu&apos;nda</strong> paylaşıyoruz.
              </p>
            </div>
            <div className="shrink-0 hidden sm:flex items-center justify-center">
              <LuxuryCategoryIcon categoryKey="complaint" className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Mağduriyet Bildirim Formu */}
        <div className="luxury-service-card p-5 sm:p-6 space-y-5 font-luxury-sans">
          {submittedCode ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-[#FAF8F4] border-[1.5px] border-[#C5A059] text-[#7D5E2A] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[1.75]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-[#7D5E2A] bg-[#FAF8F4] border border-[#C4B8A4] px-3 py-1 rounded-full">
                  Takip Kodu: {submittedCode}
                </span>
                <h3 className="font-luxury-serif text-xl font-bold text-[#141414] mt-2">
                  Hakem Bildiriminiz Başarıyla Kaydedildi!
                </h3>
                <p className="text-xs text-[#5C4938] max-w-md mx-auto leading-relaxed">
                  purelyİstanbul Hukuk ve Hakem heyetimiz ilgili işletmeyle resmi temas başlatacaktır. 
                  Gelişmeler girdiğiniz e-posta adresinize iletilecektir.
                </p>
              </div>

              <div className="pt-3 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmittedCode(null);
                    setBusinessName('');
                    setAmountPaid('');
                    setAmountExpected('');
                    setGuestEmail('');
                    setGuestName('');
                    setGuestPhone('');
                    setRefundIban('');
                    setDescription('');
                  }}
                  className="px-5 py-2.5 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Yeni Bildirim Oluştur
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] text-xs font-bold rounded-xl transition"
                >
                  Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="border-b border-[#D8CBB8] pb-3">
                <h2 className="font-luxury-serif text-lg font-bold uppercase tracking-[0.04em] text-[#141414]">Mağduriyet Bildirim Formu</h2>
                <p className="text-xs text-[#5C4938]">
                  Lütfen yaşadığınız olayı, ödediğiniz tutarı ve işletme bilgilerini mümkün olduğunca net giriniz.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#141414] block">Şikayet Edilen İşletme / Taksici Adı *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Örn: Sultanahmet Balıkçısı / 34 TAA 00 Plakalı Taksi"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141414] block">Hizmet / İşletme Kategorisi *</label>
                  <select
                    value={businessCategory}
                    onChange={(e: any) => setBusinessCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] cursor-pointer outline-hidden"
                  >
                    <option value="Restoran / Kafe">Restoran / Kafe / Bar</option>
                    <option value="Taksi / Ulaşım">Taksi / Transfer / Ulaşım</option>
                    <option value="Alışveriş / Halı & Deri">Alışveriş / Halı, Deri & Antika</option>
                    <option value="Tur & Acente">Tur & Seyahat Acentesi</option>
                    <option value="Gece Kulübü / Bar">Gece Kulübü / Eğlence Mekanı</option>
                    <option value="Döviz & Diğer">Döviz Bürosu & Diğer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141414] block">Olayın Geçtiği Konum / Semt</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Örn: Kapalıçarşı Nuruosmaniye Kapısı"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141414] block">İşletme E-posta / İletişim (Varsa)</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="İşletmenin faturadaki e-postası veya telefonu"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] outline-hidden"
                  />
                </div>
              </div>

              {/* Amount Section */}
              <div className="bg-[#FAF8F4]/90 p-4 rounded-2xl border border-[#C4B8A4] space-y-3">
                <h3 className="font-luxury-serif text-sm font-bold uppercase tracking-[0.04em] text-[#141414] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#8E7252]" />
                  <span>Ödeme ve Haksız Kazanç Tutarı</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#5C4938] font-semibold block">Sizden Alınan Tutar *</label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Örn: 4800"
                      className="w-full p-2 bg-white border border-[#C4B8A4] rounded-xl font-mono font-bold text-[#141414]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#5C4938] font-semibold block">Piyasa / Makul Değer</label>
                    <input
                      type="number"
                      value={amountExpected}
                      onChange={(e) => setAmountExpected(e.target.value)}
                      placeholder="Örn: 1500"
                      className="w-full p-2 bg-white border border-[#C4B8A4] rounded-xl font-mono text-[#221F1C]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#5C4938] font-semibold block">Para Birimi</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2 bg-white border border-[#C4B8A4] rounded-xl font-bold text-[#141414] cursor-pointer"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dolar ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description & Proof */}
              <div className="space-y-1">
                <label className="font-bold text-[#141414] block">Olayın Detaylı Açıklaması *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ne zaman oldu? Menüde fiyat yazıyor muydu? Taksici taksimetreyi açtı mı? Ürün sahte mi çıktı? Lütfen tüm detayları anlatınız..."
                  className="w-full h-28 p-3 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] outline-hidden"
                />
              </div>

              {/* Contact & Refund Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D8CBB8]">
                <div className="space-y-1">
                  <label className="font-bold text-[#141414] block">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141414] flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#8E7252]" />
                    <span>E-posta Adresiniz *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="adiniz@ornek.com (İade ve dosya takibi için)"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl text-[#141414] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141414] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#8E7252]" />
                    <span>Telefon / WhatsApp Numaranız *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+90 ... veya uluslararası numaranız"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-mono text-[#141414] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141414] block">
                    İade İçin IBAN / Kart / PayPal
                  </label>
                  <input
                    type="text"
                    value={refundIban}
                    onChange={(e) => setRefundIban(e.target.value)}
                    placeholder="TR00 0000 0000 ... veya Banka / Hesap Sahibi"
                    className="w-full p-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-mono text-[#141414] outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "İnceleme Başlatılıyor..." : "Şikayeti ve İade Talebini Gönder"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
