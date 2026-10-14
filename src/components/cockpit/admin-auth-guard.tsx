"use client";

import { useState, useEffect } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminLogin } from '@/lib/admin-auth';
import { XeniosStore } from '@/lib/store';
import { BrandMark } from '@/components/brand-mark';
import { Lock, KeyRound, ShieldCheck, ArrowRight, Sparkles, Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const check = () => {
      setIsAuth(XeniosStore.isMasterAdminLoggedIn());
    };
    check();
    window.addEventListener('xenios_master_admin_auth', check);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('xenios_master_admin_auth', check);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await adminLogin(username, password);

    if (!result.success) {
      setError(result.error || 'Hatalı yönetici e-postası veya şifre! Lütfen bilgilerinizi kontrol ediniz.');
      toast.error('Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
      return;
    }

    XeniosStore.setMasterAdminLoggedIn(true);
    XeniosStore.setHotelPortalLoggedIn(true);
    XeniosStore.setUser({
      id: 'usr-anilaslan',
      name: result.name || 'Anıl Aslan',
      email: result.email || 'anilaslan@usecomus.com',
      role: 'pilot',
      provider: 'email',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Anil%20Aslan&backgroundColor=d97706',
      createdAt: new Date().toISOString()
    });

    // Marketplace modülünün Firestore/Storage kurallarındaki isAdmin() koluna
    // (host başvuru onayı, ilan onayı) ekstra bir giriş yapmadan erişebilmek için
    // aynı oturumda Firebase Authentication'a da 'role: admin' claim'iyle giriş yapılır.
    if (result.customToken && auth) {
      try {
        await signInWithCustomToken(auth, result.customToken);
      } catch (err) {
        console.warn('Firebase admin oturumu açılamadı (cockpit erişimi etkilenmez):', err);
      }
    }

    toast.success('Pilot Proje Yöneticisi girişi başarılı!', {
      description: `Hoş geldiniz, ${result.name || 'Anıl Aslan'} (${result.email})`
    });
    setError('');
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      toast.info("Pilot PWA'yı yüklemek için tarayıcınızın menüsünden 'Ana Ekrana Ekle' seçeneğini kullanabilirsiniz.");
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      toast.success("purelyİstanbul Pilot PWA başarıyla yüklendi!");
    }
    setDeferredPrompt(null);
  };

  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#3B6D11] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] flex items-center justify-center p-4 text-[#2C2C1A] relative overflow-y-auto">
        <div className="bg-[#FFFCFA] max-w-md w-full rounded-2xl p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#C8C4B0] space-y-6 relative z-10">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <BrandMark size={44} showText={true} theme="light" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97] text-[11px] font-medium uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3B6D11]" />
                <span>Yönetici Girişi</span>
              </div>
              <h1 className="text-2xl font-light font-serif text-[#2C2C1A] mt-3">
                Purelyİstanbul <em className="italic text-[#3B6D11]">Yönetim</em> Masası
              </h1>
              <p className="text-xs text-[#6B6B55] max-w-xs mx-auto mt-1.5 leading-relaxed">
                purelyistanbul.com Web, iOS App ve PWA yönetim paneline erişmek için yönetici bilgilerinizle giriş yapın.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-medium text-[#6B6B55] uppercase tracking-wider text-[11px] block">
                Yönetici E-Posta / Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="anilaslan@usecomus.com"
                className="w-full px-3.5 py-3 bg-[#FFFCFA] border border-[#C8C4B0] rounded-xl font-normal text-[#2C2C1A] placeholder:text-[#6B6B55]/60 focus:outline-none focus:border-[#3B6D11] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#6B6B55] uppercase tracking-wider text-[11px] block">
                Güvenlik Şifresi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-3 bg-[#FFFCFA] border border-[#C8C4B0] rounded-xl font-normal text-[#2C2C1A] placeholder:text-[#6B6B55]/60 focus:outline-none focus:border-[#3B6D11] text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#3B6D11] hover:bg-[#27500A] text-white font-medium rounded-full text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Yönetim Paneline Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#C8C4B0]/60">
            <button
              type="button"
              onClick={handleInstallPwa}
              className="w-full py-2.5 px-4 bg-transparent hover:border-[#3B6D11] hover:text-[#3B6D11] text-[#6B6B55] border border-[#C8C4B0] rounded-full text-xs font-normal flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yönetici PWA Uygulamasını Cihaza Yükle</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
