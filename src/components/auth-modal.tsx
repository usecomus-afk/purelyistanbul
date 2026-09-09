"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Building2, 
  ArrowRight, 
  Phone,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { XeniosStore } from '@/lib/store';
import { XeniosUser } from '@/lib/types';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'guest' | 'hotel';
}

export function AuthModal({ isOpen, onClose, defaultRole = 'guest' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'guest' | 'hotel'>(defaultRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hotelCode, setHotelCode] = useState('FATIH-HERITAGE-01');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const isRemembered = localStorage.getItem('xenios_remember_me') === 'true' || localStorage.getItem('xenios_hotel_remember_me') === 'true';
      if (localStorage.getItem('xenios_remember_me') !== null || localStorage.getItem('xenios_hotel_remember_me') !== null) {
        setRememberMe(isRemembered);
      }
      const savedUser = localStorage.getItem('xenios_hotel_saved_user') || localStorage.getItem('xenios_saved_email');
      const savedPass = localStorage.getItem('xenios_hotel_saved_pass') || localStorage.getItem('xenios_saved_pass');
      if (savedUser) setEmail(savedUser);
      if (savedPass) setPassword(savedPass);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Lütfen e-posta ve şifrenizi giriniz.");
      return;
    }

    const inputEmail = email.trim().toLowerCase();
    const userName = name.trim() || (role === 'hotel' ? 'Otel Yöneticisi' : email.split('@')[0]);
    
    const user: XeniosUser = {
      id: 'usr_' + Date.now(),
      name: userName,
      email: inputEmail,
      role: role,
      hotelCode: role === 'hotel' ? hotelCode : undefined,
      hotelName: role === 'hotel' ? 'Old City Heritage Hotel' : undefined,
      phone: phone || undefined,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=b45309`,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    XeniosStore.setUser(user);

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem('xenios_remember_me', 'true');
        localStorage.setItem('xenios_saved_email', inputEmail);
        localStorage.setItem('xenios_saved_pass', password);
        if (role === 'hotel') {
          localStorage.setItem('xenios_hotel_remember_me', 'true');
          localStorage.setItem('xenios_hotel_saved_user', inputEmail);
          localStorage.setItem('xenios_hotel_saved_pass', password);
          localStorage.setItem('xenios_app_role', 'hotel');
        }
      } else {
        localStorage.removeItem('xenios_remember_me');
        localStorage.removeItem('xenios_saved_email');
        localStorage.removeItem('xenios_saved_pass');
        if (role === 'hotel') {
          localStorage.removeItem('xenios_hotel_remember_me');
          localStorage.removeItem('xenios_hotel_saved_user');
          localStorage.removeItem('xenios_hotel_saved_pass');
        }
      }
    }

    if (mode === 'login') {
      if (role === 'hotel') {
        XeniosStore.setHotelPortalLoggedIn(true);
        toast.success("Otel Yönetim Paneline Giriş Başarılı!", {
          description: "Otel Yönetim Paneline yönlendiriliyorsunuz..."
        });
        setTimeout(() => {
          onClose();
          window.location.href = '/hotel-portal';
        }, 350);
      } else {
        toast.success(`Hoş geldiniz ${user.name}!`);
        setTimeout(() => onClose(), 350);
      }
    } else {
      toast.success("Hesabınız başarıyla oluşturuldu! Hoş geldiniz.");
      if (role === 'hotel') {
        XeniosStore.setHotelPortalLoggedIn(true);
      }
      setTimeout(() => {
        onClose();
        if (role === 'hotel') {
          window.location.href = '/hotel-portal';
        }
      }, 350);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in zoom-in-95 relative text-zinc-900 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl overflow-hidden shadow-sm border border-amber-200 p-0.5 bg-white">
            <Image
              src="/logo.png"
              alt="purelyİstanbul"
              width={48}
              height={48}
              className="object-contain w-full h-full rounded-xl"
            />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 block">
            purelyİstanbul
          </span>
          <h2 className="text-xl font-bold font-serif text-zinc-900">
            {mode === 'login' ? 'Hesabınıza Giriş Yapın' : 'Yeni Hesap Oluşturun'}
          </h2>
          <p className="text-xs text-zinc-500">
            {mode === 'login' 
              ? 'Oda hizmetleri, rezervasyonlarınız ve otel personeli için giriş yapın.' 
              : 'İstanbul misafir ayrıcalıklarından ve hızlı rezervasyondan yararlanın.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-2xl bg-zinc-100 p-1 mb-4 border border-zinc-200">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Role Switcher in Login Mode */}
        {mode === 'login' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                role === 'guest'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/40 text-amber-950'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
              }`}
            >
              <User className={`w-4 h-4 mb-1 ${role === 'guest' ? 'text-amber-700' : 'text-zinc-400'}`} />
              <div>
                <strong className="text-xs block font-bold">Misafir Girişi</strong>
                <span className="text-[10px] text-zinc-500 block">Otel & Şehir Hizmetleri</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('hotel')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                role === 'hotel'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-400 text-amber-950'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
              }`}
            >
              <Building2 className={`w-4 h-4 mb-1 ${role === 'hotel' ? 'text-amber-700' : 'text-zinc-400'}`} />
              <div>
                <strong className="text-xs block font-bold">Otel Personeli</strong>
                <span className="text-[10px] text-zinc-500 block">Oda & Talep Yönetimi</span>
              </div>
            </button>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">Ad Soyad</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Mehmet Özkan"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">Telefon Numarası</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && role === 'hotel' && (
            <div>
              <label className="text-[11px] font-bold text-zinc-700 block mb-1">Otel / Tesis Kodu</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={hotelCode}
                  onChange={(e) => setHotelCode(e.target.value)}
                  placeholder="Örn: FATIH-HERITAGE-01"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono font-bold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-zinc-700 block mb-1">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'hotel' ? "hotel@xenios.istanbul" : "misafir@gmail.com"}
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-700 block mb-1">Şifre</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
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
              <span className="text-xs font-semibold text-zinc-700">Beni Hatırla</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2 bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
          >
            <span>{mode === 'login' ? (role === 'hotel' ? 'Otel Paneline Giriş Yap' : 'Giriş Yap') : 'Hesabı Oluştur'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-zinc-100 text-center">
          <p className="text-[10px] text-zinc-400">
            purelyİstanbul 256-Bit SSL şifreleme ve KVKK güvencesiyle korunmaktadır.
          </p>
        </div>
      </div>
    </div>
  );
}
