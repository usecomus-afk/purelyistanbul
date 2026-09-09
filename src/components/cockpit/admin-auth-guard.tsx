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
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4 text-white relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-[#12141a] max-w-md w-full rounded-3xl p-7 sm:p-8 shadow-2xl border border-amber-500/30 space-y-6 animate-in zoom-in-95 relative z-10">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <BrandMark size={48} showText={true} theme="dark" />
            </div>
            
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilot Proje Yöneticisi PWA</span>
              </div>
              <h1 className="text-lg font-bold font-serif text-white mt-2">
                Master Operations Deck
              </h1>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                İstanbul genelinde deneyimler, partner oteller, yatırım ilanları, finansal ve yapay zekâ kontrol masası.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-300 block">Pilot E-Posta / Kullanıcı Adı</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="anilaslan@usecomus.com"
                className="w-full p-3 bg-[#171a22] border border-amber-500/30 rounded-xl font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-zinc-300 block">Güvenlik Şifresi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 bg-[#171a22] border border-amber-500/30 rounded-xl font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Pilot Masasına Güvenli Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Dedicated PWA Install Banner */}
          <div className="pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={handleInstallPwa}
              className="w-full py-2.5 px-3 bg-[#1a1d26] hover:bg-[#222733] text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilot PWA Uygulamasını Cihaza Yükle</span>
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-2">
              Sadece yetkili purelyİstanbul Pilot proje yöneticileri içindir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
