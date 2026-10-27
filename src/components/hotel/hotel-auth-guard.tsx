"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { XeniosStore } from '@/lib/store';
import { hotelLogin, onHotelSession, purgeLegacySavedPasswords, sendHotelPasswordReset } from '@/lib/hotel-auth';
import { LuxuryPortalIcon } from '@/components/hotel/luxury-portal-icon';
import {
  Lock,
  Building2,
  KeyRound,
  Mail,
  CheckCircle2,
  X,
  Send,
  DoorOpen,
  UserPlus,
  Phone,
  MapPin,
  Users,
  UserCheck,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const ACCOMMODATION_BUSINESS_TYPES = [
  'Butik Otel & Konak',
  'Mülk Yönetim Şirketi (PMC) / Kısa Dönem Daireler',
  'Apart Otel & Suit Rezidans',
  'Şehir Oteli',
  'Tarihi Konak / Yalı',
  'Diğer Konaklama İşletmesi',
];

const ISTANBUL_DISTRICTS = [
  'Fatih (Sultanahmet / Tarihi Yarımada)',
  'Beyoğlu (Galata / Karaköy / Taksim / Cihangir)',
  'Beşiktaş (Ortaköy / Bebek / Akaretler)',
  'Şişli (Nişantaşı / Bomonti / Mecidiyeköy)',
  'Kadıköy (Moda / Bağdat Caddesi)',
  'Üsküdar / Boğaz Hattı',
  'Sarıyer / Tarabya',
  'Diğer İstanbul Bölgesi',
];

export function HotelAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [hotelEmailOrUser, setHotelEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Registration ("Üye Ol") Form State
  const [regPropertyName, setRegPropertyName] = useState('');
  const [regBusinessType, setRegBusinessType] = useState(ACCOMMODATION_BUSINESS_TYPES[0]);
  const [regCapacity, setRegCapacity] = useState('');
  const [regDistrict, setRegDistrict] = useState(ISTANBUL_DISTRICTS[0]);
  const [regAddress, setRegAddress] = useState('');
  const [regAuthorizedPerson, setRegAuthorizedPerson] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regWantsPartner, setRegWantsPartner] = useState(false);
  const [regError, setRegError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSubmitted, setRegSubmitted] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const hotels = XeniosStore.getHotels();
  const activeHotelId = XeniosStore.getActiveHotelId();
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    purgeLegacySavedPasswords();

    // Yalnızca e-posta hatırlanır; parola ASLA saklanmaz.
    if (typeof window !== 'undefined') {
      const isRemembered = localStorage.getItem('xenios_hotel_remember_me') === 'true';
      if (localStorage.getItem('xenios_hotel_remember_me') !== null) {
        setRememberMe(isRemembered);
      }
      const savedUser = localStorage.getItem('xenios_hotel_saved_user');
      if (savedUser) {
        setHotelEmailOrUser(savedUser);
      }
    }

    // GERÇEK oturum: Firebase Authentication + rol claim'i. localStorage bayrağı yetki vermez.
    const unsubscribe = onHotelSession((session) => {
      setIsAuth(!!session);
      // Eski bileşenlerin okuduğu yerel bayrağı gerçek oturumla eşitle.
      if (XeniosStore.isHotelPortalLoggedIn() !== !!session) {
        XeniosStore.setHotelPortalLoggedIn(!!session);
      }
      // Otel yöneticisi yalnızca kendi oteline bağlıdır.
      if (session?.role === 'hotel_manager' && session.hotelId && XeniosStore.getActiveHotelId() !== session.hotelId) {
        XeniosStore.setActiveHotelId(session.hotelId);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const input = hotelEmailOrUser.trim().toLowerCase();
    const result = await hotelLogin(input, password, rememberMe);

    if (result.ok) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('xenios_app_role', 'hotel');
        if (rememberMe) {
          localStorage.setItem('xenios_hotel_remember_me', 'true');
          localStorage.setItem('xenios_hotel_saved_user', hotelEmailOrUser.trim());
        } else {
          localStorage.removeItem('xenios_hotel_remember_me');
          localStorage.removeItem('xenios_hotel_saved_user');
        }
      }
      setPassword('');
      toast.success(`${currentHotel.name} Yönetim Paneline giriş yapıldı!`, {
        description: `Hoş geldiniz, ${hotelEmailOrUser.trim()}`
      });
      setError('');
    } else {
      setError(result.error);
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (
      !regPropertyName.trim() ||
      !regBusinessType.trim() ||
      !regCapacity.trim() ||
      !regDistrict.trim() ||
      !regAddress.trim() ||
      !regAuthorizedPerson.trim() ||
      !regPhone.trim() ||
      !regEmail.trim()
    ) {
      const msg = 'Lütfen tüm zorunlu alanları eksiksiz doldurunuz.';
      setRegError(msg);
      toast.error(msg);
      return;
    }

    const capNum = Number(regCapacity);
    if (Number.isNaN(capNum) || capNum < 1) {
      const msg = 'Lütfen geçerli bir kapasite (oda / birim sayısı) giriniz.';
      setRegError(msg);
      toast.error(msg);
      return;
    }

    if (!regWantsPartner) {
      const msg = 'Lütfen "PurelyIstanbul partneri olmak istiyorum" kutucuğunu işaretleyiniz.';
      setRegError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmittingReg(true);
    try {
      await XeniosStore.submitHotelPartnerApplication({
        propertyName: regPropertyName.trim(),
        businessType: regBusinessType.trim(),
        capacity: capNum,
        locationDistrict: regDistrict.trim(),
        locationAddress: regAddress.trim(),
        authorizedPerson: regAuthorizedPerson.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        website: regWebsite.trim() || undefined,
        wantsToBePartner: true,
      });
      setRegSubmitted(true);
      toast.success('Başvurunuz iletildi');
    } catch (err: any) {
      const msg = err?.message || 'Başvuru gönderilirken bir hata oluştu.';
      setRegError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const resetRegistrationForm = () => {
    setRegPropertyName('');
    setRegBusinessType(ACCOMMODATION_BUSINESS_TYPES[0]);
    setRegCapacity('');
    setRegDistrict(ISTANBUL_DISTRICTS[0]);
    setRegAddress('');
    setRegAuthorizedPerson('');
    setRegPhone('');
    setRegEmail('');
    setRegWebsite('');
    setRegWantsPartner(false);
    setRegError('');
    setRegSubmitted(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      toast.error('Lütfen geçerli bir yönetici e-posta adresi girin.');
      return;
    }

    setIsResetting(true);
    const ok = await sendHotelPasswordReset(forgotEmail);
    setIsResetting(false);
    if (!ok) {
      toast.error('Şifre sıfırlama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin.');
      return;
    }
    setForgotSent(true);
    toast.success('Şifre sıfırlama bağlantısı gönderildi!');
  };

  if (isAuth === null) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F1E7] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-8 h-8 rounded-full border-2 border-[#8E7252] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    const hotelNameUpper = (currentHotel?.name || 'OLD CITY HERITAGE HOTEL ISTANBUL').toUpperCase();

    return (
      <div className="min-h-[100dvh] w-full text-[#221F1C] flex flex-col justify-between relative overflow-x-clip">
        {/* Global Fixed Background — Subtle Sepia / Warm-Tinted Soft-Focus Istanbul Mosque Silhouette */}
        <div className="fixed -top-[70px] -bottom-[50px] left-0 right-0 z-0 pointer-events-none overflow-hidden bg-[#F6F1E7]">
          <Image
            src="/images/light-mosque-bg.jpg"
            alt="Historic Istanbul Mosque Silhouette"
            fill
            priority
            quality={90}
            unoptimized
            className="object-cover object-center scale-[1.01] blur-[2px] sepia-[0.18] saturate-[0.88] brightness-[1.01] contrast-[0.98]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F0]/68 via-[#F5EFE6]/14 to-transparent" />
        </div>

        {/* Luxury Header Matching Hotel Page 1:1 */}
        <header className="pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-2 px-3.5 sm:px-4 w-full relative z-40">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-3">
            <h1 className="font-luxury-serif text-[18px] sm:text-[21px] tracking-[0.14em] font-normal text-[#141414] uppercase text-center leading-[1.28] select-none mt-0.5">
              {hotelNameUpper.endsWith(' ISTANBUL') ? (
                <>
                  {currentHotel.name.slice(0, -9)}
                  <br />
                  ISTANBUL
                </>
              ) : (
                currentHotel.name
              )}
            </h1>

            {/* Clean Neomorphic Top Bar Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EFE8]/92 backdrop-blur-md border border-white/90 shadow-[0_8px_22px_rgba(36,28,18,0.12),inset_0_1px_2px_rgba(255,255,255,0.95)]">
              <a
                href={`/stay/${encodeURIComponent(currentHotel?.id || 'hotel-1')}/TEST`}
                onClick={(e) => {
                  e.preventDefault();
                  const targetHotelId = currentHotel?.id || 'hotel-1';
                  XeniosStore.setActiveHotelSession(targetHotelId, 'TEST');
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem('xenios_app_role', 'guest');
                      sessionStorage.setItem('purely_splash_v6_played', 'true');
                      sessionStorage.setItem('purely_splash_played', 'true');
                    } catch {}
                    window.location.href = `/stay/${encodeURIComponent(targetHotelId)}/TEST`;
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium text-[#2C2824] hover:bg-black/5 transition cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5 text-[#8E7252]" />
                <span>Misafir Ekranı</span>
              </a>

              <div className="w-[1px] h-3.5 bg-[#D5CBB8]" />

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAE3D5]/90 border border-[#D4C9B8]/70 text-[#221F1C]">
                <Building2 className="w-3.5 h-3.5 text-[#8E7252]" />
                <span className="text-[11px] font-medium tracking-tight">Yönetim Paneli</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Centered Luxury Login / Registration Card */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
          <div className="luxury-service-card max-w-md w-full rounded-[26px] p-5 sm:p-7 space-y-4 animate-in zoom-in-95 relative">
            {/* Mode Switcher Tabs: Giriş Yap vs Üye Ol */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#EDE5D7] border border-[#D4C9B8]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setRegError('');
                }}
                className={`py-2 px-3 rounded-xl font-luxury-sans text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-[#1D2025] text-[#F5EFE6] shadow-xs'
                    : 'text-[#5C4938] hover:text-[#141414]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Yönetim Girişi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setRegSubmitted(false);
                }}
                className={`py-2 px-3 rounded-xl font-luxury-sans text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-[#8E7252] text-white shadow-xs'
                    : 'text-[#5C4938] hover:text-[#141414]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Üye Ol</span>
              </button>
            </div>

            {authMode === 'login' ? (
              <>
                <div className="text-center space-y-1.5 flex flex-col items-center">
                  <LuxuryPortalIcon id="login-crest" className="w-16 h-16" />
                  <h2 className="font-luxury-serif text-[19px] sm:text-[21px] font-semibold tracking-[0.08em] uppercase text-[#141414]">
                    YÖNETİM GİRİŞİ
                  </h2>
                  <p className="font-luxury-sans text-[12px] text-[#5C4938] font-medium">
                    {currentHotel.name}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3.5 font-luxury-sans text-xs">
                  {error && (
                    <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-[#8B2626] font-medium animate-in fade-in text-[11.5px] leading-relaxed">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#2C251E] text-[12px] block">
                      Yönetici E-Posta / Kullanıcı Adı
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={hotelEmailOrUser}
                        onChange={(e) => setHotelEmailOrUser(e.target.value)}
                        placeholder="manager@purelyistanbul.com"
                        className="w-full p-3 pl-9 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl font-medium text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] shadow-[inset_0_1px_2px_rgba(36,28,18,0.06)] text-xs transition"
                      />
                      <Mail className="w-4 h-4 text-[#8E7252] absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[#2C251E] text-[12px] block">
                        Yetkili Şifresi
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(true);
                          setForgotSent(false);
                          setForgotEmail(hotelEmailOrUser.includes('@') ? hotelEmailOrUser : '');
                        }}
                        className="text-[11.5px] font-bold text-black hover:text-zinc-800 hover:underline cursor-pointer transition"
                      >
                        Şifremi Unuttum?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 pl-9 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl font-mono text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] shadow-[inset_0_1px_2px_rgba(36,28,18,0.06)] text-xs transition"
                      />
                      <Lock className="w-4 h-4 text-[#8E7252] absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#8E7252] cursor-pointer"
                      />
                      <span className="text-[11.5px] font-medium text-[#3D3226]">
                        Beni Hatırla (Yönetim Masası Olarak Başlat)
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#1D2025] hover:bg-[#2C3038] text-[#F5EFE6] border border-[#8E7252]/45 font-luxury-sans font-semibold rounded-xl shadow-[0_8px_18px_rgba(29,32,37,0.20)] text-xs tracking-[0.02em] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#C9AE82]" />
                    <span>{isLoading ? 'Giriş Yapılıyor...' : 'Yönetim Paneline Giriş Yap'}</span>
                  </button>

                  {/* Üye Ol CTA Button right below Login */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setRegSubmitted(false);
                      }}
                      className="w-full py-3 bg-[#FAF8F4] hover:bg-[#F1EAE0] text-[#2C251E] border-[1.5px] border-[#8E7252] font-luxury-sans font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <UserPlus className="w-4 h-4 text-[#8E7252]" />
                      <span>Üye Ol (Konaklama Partneri Başvurusu)</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* =======================================================
                 ÜYE OL / KONAKLAMA PARTNERİ BAŞVURU FORMU
              ======================================================= */
              <div className="space-y-4 font-luxury-sans text-xs">
                <div className="text-center space-y-1">
                  <h2 className="font-luxury-serif text-[18px] sm:text-[20px] font-semibold tracking-[0.06em] uppercase text-[#141414]">
                    KONAKLAMA PARTNERİ ÜYELİK FORMU
                  </h2>
                  <p className="text-[11.5px] text-[#5C4938]">
                    Tesisinizi PurelyIstanbul dijital konsiyerj ve kanal yönetimi ağına kaydetmek için formu doldurunuz.
                  </p>
                </div>

                {regSubmitted ? (
                  <div className="p-5 rounded-2xl bg-[#EBF3ED] border border-[#9BBCA4] text-center space-y-3.5 animate-in zoom-in-95">
                    <div className="w-14 h-14 rounded-full bg-white border border-[#9BBCA4] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">
                        Başvurunuz iletildi
                      </h3>
                      <p className="text-xs text-[#2D5A40] leading-relaxed">
                        <strong>{regPropertyName}</strong> ({regBusinessType} • {regCapacity} Birim) için PurelyIstanbul partnerlik başvurunuz başarıyla alındı ve yönetim onay ekranına düştü.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetRegistrationForm();
                          setAuthMode('login');
                        }}
                        className="flex-1 py-2.5 px-4 bg-[#1D2025] hover:bg-[#2C3038] text-[#F5EFE6] rounded-xl font-semibold text-xs cursor-pointer transition"
                      >
                        Yönetim Girişine Dön
                      </button>
                      <button
                        type="button"
                        onClick={resetRegistrationForm}
                        className="py-2.5 px-4 bg-white hover:bg-[#FAF8F4] text-[#2C251E] border border-[#C4B8A4] rounded-xl font-semibold text-xs cursor-pointer transition"
                      >
                        Yeni Başvuru
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    {regError && (
                      <div className="p-2.5 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-[#8B2626] font-medium text-[11.5px]">
                        {regError}
                      </div>
                    )}

                    {/* 1. Tesis Adı */}
                    <div className="space-y-1">
                      <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                        Tesis / İşletme Adı *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regPropertyName}
                          onChange={(e) => setRegPropertyName(e.target.value)}
                          placeholder="Örn: Galata Heritage Boutique Hotel"
                          className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                        />
                        <Building2 className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                      </div>
                    </div>

                    {/* 2. Konaklama İşletme Tipi & 3. Kapasite */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                          Konaklama İşletme Tipi *
                        </label>
                        <select
                          required
                          value={regBusinessType}
                          onChange={(e) => setRegBusinessType(e.target.value)}
                          className="w-full p-2.5 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#8E7252] text-xs"
                        >
                          {ACCOMMODATION_BUSINESS_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                          Kapasite (Birim/Oda) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            max={2000}
                            required
                            value={regCapacity}
                            onChange={(e) => setRegCapacity(e.target.value)}
                            placeholder="Örn: 18"
                            className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                          />
                          <Users className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                        </div>
                      </div>
                    </div>

                    {/* 4. Tesisin Yeri (Bölge & Açık Konum) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                          Tesisin Yeri (İlçe / Bölge) *
                        </label>
                        <select
                          required
                          value={regDistrict}
                          onChange={(e) => setRegDistrict(e.target.value)}
                          className="w-full p-2.5 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#8E7252] text-xs"
                        >
                          {ISTANBUL_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                          Tesisin Açık Adresi / Konumu *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={regAddress}
                            onChange={(e) => setRegAddress(e.target.value)}
                            placeholder="Mahalle, Sokak, No — İstanbul"
                            className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                          />
                          <MapPin className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                        </div>
                      </div>
                    </div>

                    {/* 5. Yetkili Kişi */}
                    <div className="space-y-1">
                      <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                        Yetkili Kişi (Ad Soyad & Görevi) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regAuthorizedPerson}
                          onChange={(e) => setRegAuthorizedPerson(e.target.value)}
                          placeholder="Örn: Mehmet Kaya — İşletme Sahibi / Genel Müdür"
                          className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                        />
                        <UserCheck className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                      </div>
                    </div>

                    {/* 6. Standart İletişim Bilgileri (Telefon/WhatsApp, E-Posta, Web) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                          Telefon / WhatsApp *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="+90 532 000 00 00"
                            className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                          />
                          <Phone className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                          Kurumsal E-Posta *
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="info@oteliniz.com"
                            className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                          />
                          <Mail className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#2C251E] text-[11.5px] block">
                        Web Sitesi / Instagram (İsteğe Bağlı)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regWebsite}
                          onChange={(e) => setRegWebsite(e.target.value)}
                          placeholder="https://www.oteliniz.com"
                          className="w-full p-2.5 pl-8 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                        />
                        <Globe className="w-3.5 h-3.5 text-[#8E7252] absolute left-2.5 top-3" />
                      </div>
                    </div>

                    {/* 7. Zorunlu Checkbox: PurelyIstanbul partneri olmak istiyorum */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF8F4] border border-[#C4B8A4] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        required
                        checked={regWantsPartner}
                        onChange={(e) => setRegWantsPartner(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded accent-[#8E7252] cursor-pointer shrink-0"
                      />
                      <span className="text-[11.5px] font-semibold text-[#2C251E] leading-snug">
                        PurelyIstanbul partneri olmak istiyorum
                      </span>
                    </label>

                    {/* 8. Gönder Butonu */}
                    <button
                      type="submit"
                      disabled={isSubmittingReg}
                      className="w-full py-3.5 bg-[#1D2025] hover:bg-[#2C3038] text-[#F5EFE6] border border-[#8E7252]/45 font-luxury-sans font-semibold rounded-xl shadow-[0_8px_18px_rgba(29,32,37,0.20)] text-xs tracking-[0.02em] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-[#C9AE82]" />
                      <span>{isSubmittingReg ? 'Gönderiliyor...' : 'Gönder'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="w-full py-2 text-[#5C4938] hover:text-[#141414] font-semibold text-xs inline-flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Giriş Ekranına Dön</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="pt-2.5 text-center border-t border-[#DFD6C7]">
              <a
                href={`/stay/${encodeURIComponent(currentHotel?.id || 'hotel-1')}/TEST`}
                onClick={(e) => {
                  e.preventDefault();
                  const targetHotelId = currentHotel?.id || 'hotel-1';
                  XeniosStore.setActiveHotelSession(targetHotelId, 'TEST');
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem('xenios_app_role', 'guest');
                      sessionStorage.setItem('purely_splash_v6_played', 'true');
                      sessionStorage.setItem('purely_splash_played', 'true');
                    } catch {}
                    window.location.href = `/stay/${encodeURIComponent(targetHotelId)}/TEST`;
                  }
                }}
                className="font-luxury-sans text-xs text-[#5C4938] hover:text-[#141414] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>← Misafir Ekranına Geri Dön</span>
              </a>
            </div>
          </div>
        </main>

        {/* Bottom Spacer for Safe Area */}
        <div className="h-[max(1rem,env(safe-area-inset-bottom,0px))]" />

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-[#141210]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="luxury-service-card rounded-[26px] max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 text-[#1A1A1A] relative">
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EDE6DA] hover:bg-[#E2D8C7] border border-[#C4B8A4] text-[#2C251E] flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>

              {!forgotSent ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 font-luxury-sans text-xs">
                  <div className="text-center space-y-1.5 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] border border-[#C9AE82] text-[#8E7252] flex items-center justify-center shadow-inner">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="font-luxury-serif text-[18px] font-semibold tracking-[0.04em] uppercase text-black">
                      Şifre Sıfırlama Talebi
                    </h3>
                    <p className="text-black font-medium text-xs leading-relaxed">
                      {currentHotel.name} yetkili hesabınıza ait e-posta adresinizi giriniz.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-black block">Kayıtlı Yönetici E-Postası</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="manager@purelyistanbul.com"
                      className="w-full p-3 bg-[#FAF8F4]/95 border border-[#C4B8A4] rounded-xl text-[#1A1A1A] placeholder:text-[#8A7B69] focus:outline-none focus:border-[#8E7252] text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-[#1D2025] hover:bg-[#2C3038] text-[#F5EFE6] border border-[#8E7252]/45 font-semibold rounded-xl shadow-md text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-[#C9AE82]" />
                    <span>{isResetting ? 'İletiliyor...' : 'Sıfırlama Bağlantısı Gönder'}</span>
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-2 font-luxury-sans">
                  <div className="w-14 h-14 rounded-full bg-[#EBF3ED] border border-[#9BBCA4] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-luxury-serif text-[18px] font-bold uppercase tracking-[0.04em] text-black">
                      Talep Başarıyla İletildi
                    </h3>
                    <p className="text-xs text-black font-semibold leading-relaxed">
                      <strong className="text-black font-bold">{forgotEmail}</strong> adresine (hesap kayıtlıysa) şifre sıfırlama talimatı gönderildi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setPassword('');
                    }}
                    className="w-full py-2.5 bg-[#1D2025] hover:bg-[#2C3038] text-[#F5EFE6] border border-[#8E7252]/45 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Giriş Ekranına Dön
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
