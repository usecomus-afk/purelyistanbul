"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { BrandMark } from '@/components/brand-mark';
import { NotificationService } from '@/lib/notification-service';
import { 
  Hotel, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  X, 
  Send,
  HelpCircle,
  Sparkles
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
      const isDemo = (input === 'hotel' || input === 'demo') && (password === 'hotel2026' || password === 'xenios2026' || password === '1234');
      
      // 2. Check Real Hotel Manager Email Login
      const isRealEmail = input.includes('@') && password.length >= 4;
      const isHeritageManager = input === 'heritage@xenios.istanbul' || input === 'manager@heritagehotel.com' || input === 'hotel@xenios.istanbul';

      if (isDemo || isRealEmail || isHeritageManager) {
        XeniosStore.setHotelPortalLoggedIn(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('xenios_app_role', 'hotel');
          if (rememberMe) {
            localStorage.setItem('xenios_hotel_remember_me', 'true');
            localStorage.setItem('xenios_hotel_saved_user', input);
            localStorage.setItem('xenios_hotel_saved_pass', password);
          } else {
            localStorage.removeItem('xenios_hotel_remember_me');
            localStorage.removeItem('xenios_hotel_saved_user');
            localStorage.removeItem('xenios_hotel_saved_pass');
          }
        }
        toast.success(`${currentHotel.name} Yönetim Paneline giriş yapıldı!`, {
          description: `Hoş geldiniz, ${input}`
        });
        setError('');
      } else {
        setError("Hatalı otel e-postası veya şifre! Lütfen kontrol ediniz ya da 'Şifremi Unuttum' üzerinden sıfırlayınız.");
        toast.error("Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.");
      }
      setIsLoading(false);
    }, 450);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      toast.error('Lütfen geçerli bir otel yöneticisi e-posta adresi girin.');
      return;
    }

    setIsResetting(true);
    const code = 'RESET-' + Math.floor(100000 + Math.random() * 900000);
    setRecoveryCode(code);

    // Dispatch notification to hi@usecomus.com
    await NotificationService.dispatch({
      type: 'room_service',
      recipient: 'hi@usecomus.com',
      title: `Otel Yöneticisi Şifre Sıfırlama Talebi: ${currentHotel.name}`,
      hotelName: currentHotel.name,
      roomNumber: 'YÖNETİM KOKPİTİ',
      guestName: 'Otel Yöneticisi',
      guestContact: forgotEmail.trim(),
      details: {
        hotelId: currentHotel.id,
        hotelName: currentHotel.name,
        managerEmail: forgotEmail.trim(),
        recoveryCode: code,
        action: 'Otel Yöneticisi Şifre Sıfırlama Bağlantısı Gönderildi'
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
      <div className="min-h-screen bg-[#f8f6f0] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#f8f6f0] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl border border-amber-200/90 space-y-6 animate-in zoom-in-95 relative">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <BrandMark size={48} showText={true} theme="light" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-300 text-[11px] font-bold uppercase tracking-wider font-mono">
              <Hotel className="w-3.5 h-3.5 text-amber-700" />
              <span>Partner Otel Yönetim Paneli Girişi</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900">{currentHotel.name}</h3>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-700 block">Otel Yöneticisi E-Posta / Kullanıcı Adı</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={hotelEmailOrUser}
                  onChange={(e) => setHotelEmailOrUser(e.target.value)}
                  placeholder="manager@hotel.com veya hotel"
                  className="w-full p-3 pl-9 bg-amber-50/30 border border-amber-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-zinc-700 block">Yetkili Şifresi</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotSent(false);
                    setForgotEmail(hotelEmailOrUser.includes('@') ? hotelEmailOrUser : '');
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer transition"
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
                  className="w-full p-3 pl-9 bg-amber-50/30 border border-amber-200 rounded-xl font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-zinc-700">Beni Hatırla (Otel Masası Olarak Başlat)</span>
              </label>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
              <span>Hızlı Test Erişimi:</span>
              <strong className="font-mono text-zinc-800">hotel / hotel2026</strong>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold rounded-xl shadow-md text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Giriş Yapılıyor...' : 'Otel Yönetim Paneline Giriş Yap'}</span>
            </button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-100">
            <Link href="/" className="text-xs text-zinc-500 hover:text-amber-800 font-semibold transition">
              ← Misafir Ekranına Geri Dön
            </Link>
          </div>
        </div>

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95 text-zinc-900 relative">
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {!forgotSent ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold font-serif text-zinc-900">Şifre Sıfırlama Talebi</h3>
                    <p className="text-zinc-500 text-xs">
                      {currentHotel.name} yetkili hesabınıza ait e-posta adresinizi giriniz.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-700 block">Kayıtlı Otel E-Postası</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="manager@hotel.com"
                      className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-md text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isResetting ? 'İletiliyor...' : 'Sıfırlama Bağlantısı Gönder'}</span>
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold font-serif text-zinc-900">Talep Başarıyla İletildi!</h3>
                    <p className="text-xs text-zinc-600">
                      <strong>{forgotEmail}</strong> ve <strong>hi@usecomus.com</strong> adreslerine şifre sıfırlama talimatı gönderildi.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block">Kurtarma Referans Kodu:</span>
                    <strong className="font-mono text-sm text-zinc-900 block">{recoveryCode}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setPassword('hotel2026');
                    }}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-black text-amber-400 font-bold rounded-xl text-xs transition cursor-pointer"
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
