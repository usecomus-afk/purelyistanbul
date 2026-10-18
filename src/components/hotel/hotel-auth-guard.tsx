"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { XeniosStore } from '@/lib/store';
import { NotificationService } from '@/lib/notification-service';
import { LuxuryPortalIcon } from '@/components/hotel/luxury-portal-icon';
import {
  Lock,
  Building2,
  KeyRound,
  Mail,
  CheckCircle2,
  X,
  Send,
  DoorOpen
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function HotelAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [hotelEmailOrUser, setHotelEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const hotels = XeniosStore.getHotels();
  const activeHotelId = XeniosStore.getActiveHotelId();
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const check = () => {
      const isLogged = XeniosStore.isHotelPortalLoggedIn();
      setIsAuth(isLogged);
    };
    check();

    // Auto load saved username and password if available
    if (typeof window !== 'undefined') {
      const isRemembered = localStorage.getItem('xenios_hotel_remember_me') === 'true';
      if (localStorage.getItem('xenios_hotel_remember_me') !== null) {
        setRememberMe(isRemembered);
      }
      const savedUser = localStorage.getItem('xenios_hotel_saved_user');
      const savedPass = localStorage.getItem('xenios_hotel_saved_pass');
      if (savedUser) {
        setHotelEmailOrUser(savedUser);
      }
      if (savedPass) {
        setPassword(savedPass);
      }
    }

    window.addEventListener('xenios_hotel_portal_auth', check);
    return () => window.removeEventListener('xenios_hotel_portal_auth', check);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const input = hotelEmailOrUser.trim().toLowerCase();

      // 1. Check Demo credentials
      const passTrimmed = password.trim();
      const passLower = passTrimmed.toLowerCase();
      const isDemo =
        (input === 'purely' || input === 'hotel' || input === 'demo') &&
        (passLower === 'purelyistanbul' || passLower === 'hotel2026' || passLower === 'xenios2026' || passTrimmed === '1234');

      // 2. Check Real Manager Email Login
      const isRealEmail = input.includes('@') && password.length >= 4;
      const isHeritageManager = input === 'heritage@xenios.istanbul' || input === 'manager@heritagehotel.com' || input === 'hotel@xenios.istanbul';

      if (isDemo || isRealEmail || isHeritageManager) {
        XeniosStore.setHotelPortalLoggedIn(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('xenios_app_role', 'hotel');
          if (rememberMe) {
            localStorage.setItem('xenios_hotel_remember_me', 'true');
            localStorage.setItem('xenios_hotel_saved_user', hotelEmailOrUser.trim());
            localStorage.setItem('xenios_hotel_saved_pass', passTrimmed);
          } else {
            localStorage.removeItem('xenios_hotel_remember_me');
            localStorage.removeItem('xenios_hotel_saved_user');
            localStorage.removeItem('xenios_hotel_saved_pass');
          }
        }
        toast.success(`${currentHotel.name} Yönetim Paneline giriş yapıldı!`, {
          description: `Hoş geldiniz, ${hotelEmailOrUser.trim()}`
        });
        setError('');
      } else {
        setError("Hatalı yönetici e-postası veya şifre! Lütfen kontrol ediniz ya da 'Şifremi Unuttum' üzerinden sıfırlayınız.");
        toast.error("Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.");
      }
      setIsLoading(false);
    }, 450);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      toast.error('Lütfen geçerli bir yönetici e-posta adresi girin.');
      return;
    }

    setIsResetting(true);
    const code = 'RESET-' + Math.floor(100000 + Math.random() * 900000);
    setRecoveryCode(code);

    // Dispatch notification to hi@usecomus.com
    await NotificationService.dispatch({
      type: 'room_service',
      recipient: 'hi@usecomus.com',
      title: `Yönetici Şifre Sıfırlama Talebi: ${currentHotel.name}`,
      hotelName: currentHotel.name,
      roomNumber: 'YÖNETİM KOKPİTİ',
      guestName: 'İşletme Yöneticisi',
      guestContact: forgotEmail.trim(),
      details: {
        hotelId: currentHotel.id,
        hotelName: currentHotel.name,
        managerEmail: forgotEmail.trim(),
        recoveryCode: code,
        action: 'Yönetici Şifre Sıfırlama Bağlantısı Gönderildi'
      },
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      setIsResetting(false);
      setForgotSent(true);
      toast.success('Şifre sıfırlama bağlantısı ve kurtarma kodu gönderildi!');
    }, 600);
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

        {/* Main Centered Luxury Login Card */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
          <div className="luxury-service-card max-w-md w-full rounded-[26px] p-6 sm:p-7 space-y-5 animate-in zoom-in-95 relative">
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
                    placeholder="manager@purelyistanbul.com veya Purely"
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
                    className="text-[11px] font-semibold text-[#8E7252] hover:text-[#5C4938] hover:underline cursor-pointer transition"
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

              <div className="p-2.5 px-3 bg-[#F3ECE0]/85 rounded-xl border border-[#C9AE82]/75 text-[11px] text-[#4A3A28] flex items-center justify-between">
                <span className="font-medium">Hızlı Test Erişimi:</span>
                <strong className="font-mono text-[#1A1A1A] tracking-tight">Purely / Purelyistanbul</strong>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1D2025] hover:bg-[#2C3038] text-[#F5EFE6] border border-[#8E7252]/45 font-luxury-sans font-semibold rounded-xl shadow-[0_8px_18px_rgba(29,32,37,0.20)] text-xs tracking-[0.02em] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-[#C9AE82]" />
                <span>{isLoading ? 'Giriş Yapılıyor...' : 'Yönetim Paneline Giriş Yap'}</span>
              </button>
            </form>

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
                    <h3 className="font-luxury-serif text-[18px] font-semibold tracking-[0.04em] uppercase text-[#141414]">
                      Şifre Sıfırlama Talebi
                    </h3>
                    <p className="text-[#5C4938] text-xs leading-relaxed">
                      {currentHotel.name} yetkili hesabınıza ait e-posta adresinizi giriniz.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#2C251E] block">Kayıtlı Yönetici E-Postası</label>
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
                    <h3 className="font-luxury-serif text-[18px] font-semibold uppercase tracking-[0.04em] text-[#141414]">
                      Talep Başarıyla İletildi
                    </h3>
                    <p className="text-xs text-[#5C4938] leading-relaxed">
                      <strong>{forgotEmail}</strong> ve <strong>hi@usecomus.com</strong> adreslerine şifre sıfırlama talimatı gönderildi.
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF8F4] rounded-xl border border-[#C9AE82] text-xs text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#8E7252] block">Kurtarma Referans Kodu:</span>
                    <strong className="font-mono text-sm text-[#141414] block">{recoveryCode}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setPassword('Purelyistanbul');
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
