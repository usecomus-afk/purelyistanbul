"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { 
  CreditCard, 
  ArrowLeft,
  Send,
  CheckCircle2,
  Mail,
  User,
  Phone,
  Building2,
  MapPin,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { BrandMark } from '@/components/brand-mark';
import Image from 'next/image';

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
    <div className="min-h-screen bg-[#f8f6f0] pb-24 text-zinc-900">
      {/* Header */}
      <header className="bg-white border-b border-amber-200/60 p-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-zinc-700 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <BrandMark size={34} showText={true} />
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-300/60 text-xs font-bold text-amber-900">
            <span>Hakem Masası</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* Mission Statement Hero Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-100/40 to-amber-50/70 p-6 rounded-3xl border border-amber-300 shadow-sm space-y-3 relative overflow-hidden text-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-900 font-serif font-bold">İstanbul'un Misafirleri Başımızın Tacıdır</span>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl">
                İstanbul'da karşılaştığınız şüpheli, fahiş fiyatlı veya aldatıcı alışverişleri platformumuza bildirin. 
                purelyİstanbul olarak işletmeyle resmi iletişime geçerek hatanın telafisini ve haksız tahsil edilen farkın 
                <strong className="text-zinc-900"> doğrudan hesabınıza iadesini</strong> talep ediyoruz. 
                İyi niyet göstermeyen ve 30 gün içinde telafi etmeyen işletmeleri sonraki misafirleri korumak için 
                <strong className="text-zinc-900"> Uyarı Panosu'nda</strong> paylaşıyoruz.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 p-2 border border-amber-300/80 shrink-0 hidden sm:flex items-center justify-center">
              <Image src="/icons/bad-experience.png" alt="Mağduriyet İnceleme" width={48} height={48} unoptimized className="object-contain" />
            </div>
          </div>
        </div>

        {/* Mağduriyet Bildirim Formu */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-5">
          {submittedCode ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  Takip Kodu: {submittedCode}
                </span>
                <h3 className="text-lg font-bold font-serif text-zinc-900 mt-2">
                  Hakem Bildiriminiz Başarıyla Kaydedildi!
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
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
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Yeni Bildirim Oluştur
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition"
                >
                  Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="border-b border-amber-100 pb-3">
                <h2 className="text-base font-bold font-serif text-zinc-900">Mağduriyet Bildirim Formu</h2>
                <p className="text-xs text-zinc-500">
                  Lütfen yaşadığınız olayı, ödediğiniz tutarı ve işletme bilgilerini mümkün olduğunca net giriniz.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">Şikayet Edilen İşletme / Taksici Adı *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Örn: Sultanahmet Balıkçısı / 34 TAA 00 Plakalı Taksi"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/40 text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">Hizmet / İşletme Kategorisi *</label>
                  <select
                    value={businessCategory}
                    onChange={(e: any) => setBusinessCategory(e.target.value)}
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 cursor-pointer"
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
                  <label className="font-semibold text-zinc-700 block">Olayın Geçtiği Konum / Semt</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Örn: Kapalıçarşı Nuruosmaniye Kapısı"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">İşletme E-posta / İletişim (Varsa)</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="İşletmenin faturadaki e-postası veya telefonu"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>
              </div>

              {/* Amount Section */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  <span>Ödeme ve Haksız Kazanç Tutarı</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-600 block">Sizden Alınan Tutar *</label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Örn: 4800"
                      className="w-full p-2 bg-white border border-amber-200 rounded-xl font-mono font-bold text-zinc-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-600 block">Piyasa / Makul Değer</label>
                    <input
                      type="number"
                      value={amountExpected}
                      onChange={(e) => setAmountExpected(e.target.value)}
                      placeholder="Örn: 1500"
                      className="w-full p-2 bg-white border border-amber-200 rounded-xl font-mono text-zinc-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-600 block">Para Birimi</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-200 rounded-xl font-bold text-zinc-900 cursor-pointer"
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
                <label className="font-semibold text-zinc-700 block">Olayın Detaylı Açıklaması *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ne zaman oldu? Menüde fiyat yazıyor muydu? Taksici taksimetreyi açtı mı? Ürün sahte mi çıktı? Lütfen tüm detayları anlatınız..."
                  className="w-full h-28 p-3 bg-amber-50/30 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/40 text-zinc-900"
                />
              </div>

              {/* Contact & Refund Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-100">
                {/* 1. Misafir Adı */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>

                {/* 2. Misafir E-posta Adresi (Yeni Eklenen Özel Satır) */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-amber-700" />
                    <span>E-posta Adresiniz *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="adiniz@ornek.com (İade ve dosya takibi için)"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900"
                  />
                </div>

                {/* 3. Misafir Telefon / WhatsApp */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Telefon / WhatsApp Numaranız *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+90 ... veya uluslararası numaranız"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl font-mono text-zinc-900"
                  />
                </div>

                {/* 4. İade IBAN */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">
                    İade İçin IBAN / Kart / PayPal
                  </label>
                  <input
                    type="text"
                    value={refundIban}
                    onChange={(e) => setRefundIban(e.target.value)}
                    placeholder="TR00 0000 0000 ... veya Banka / Hesap Sahibi"
                    className="w-full p-2.5 bg-amber-50/30 border border-amber-200 rounded-xl font-mono text-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 rounded-2xl font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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
