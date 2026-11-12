'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2, Trash2, Save, X, Eye, EyeOff, Wand2 } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

type HotelAccount = {
  uid: string;
  email?: string;
  displayName?: string;
  hotelId?: string;
  disabled: boolean;
  lastSignIn?: string;
};

interface Props {
  hotel: { id: string; name: string; contactEmail?: string; managerName?: string };
  onClose: () => void;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!*+-';
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/** Konaklama partneri (otel) yönetim paneli giriş bilgilerini listeler / günceller / siler. */
export function HotelCredentialsModal({ hotel, onClose }: Props) {
  const [accounts, setAccounts] = useState<HotelAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState(hotel.contactEmail || '');
  const [displayName, setDisplayName] = useState(hotel.managerName || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await authFetch('/api/admin/hotel-users');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setLoadError(data.error || `Hesaplar yüklenemedi (HTTP ${res.status}).`);
        setAccounts([]);
        return;
      }
      setAccounts((data.accounts as HotelAccount[]).filter((a) => a.hotelId === hotel.id));
    } catch {
      setLoadError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [hotel.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Parola en az 8 karakter olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/hotel-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, hotelId: hotel.id, displayName: displayName || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || `Kaydedilemedi (HTTP ${res.status}).`);
        return;
      }
      toast.success(data.created ? 'Giriş hesabı oluşturuldu.' : 'Giriş bilgileri güncellendi; eski oturumlar kapatıldı.');
      setPassword('');
      setShowPw(false);
      load();
    } catch {
      toast.error('Sunucuya bağlanılamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (acc: HotelAccount) => {
    if (!acc.email || !window.confirm(`${acc.email} hesabı silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      const res = await authFetch('/api/admin/hotel-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || `Silinemedi (HTTP ${res.status}).`);
        return;
      }
      toast.success('Hesap silindi.');
      load();
    } catch {
      toast.error('Sunucuya bağlanılamadı.');
    }
  };

  const inputCls =
    'w-full min-h-[44px] rounded-xl border border-zinc-300 bg-white px-3 text-base sm:text-sm text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Giriş bilgileri">
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white text-zinc-900 shadow-xl">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200 sticky top-0 bg-white">
          <div className="min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-1.5"><KeyRound className="w-4 h-4 text-amber-600 shrink-0" /> Panel Giriş Bilgileri</h3>
            <p className="text-xs text-zinc-600 truncate">{hotel.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-zinc-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Mevcut hesaplar</h4>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-zinc-600"><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…</div>
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs p-3 flex items-center justify-between gap-2">
                <span className="min-w-0 break-words">{loadError}</span>
                <button type="button" onClick={load} className="font-bold underline shrink-0 min-h-[44px] cursor-pointer">Tekrar dene</button>
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-zinc-600">Bu otel için kayıtlı giriş hesabı bulunamadı.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a) => (
                  <li key={a.uid} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 min-w-0">
                    <button type="button" onClick={() => { setEmail(a.email || ''); setDisplayName(a.displayName || ''); }} className="min-w-0 text-left cursor-pointer">
                      <span className="block text-xs font-semibold truncate">{a.email}</span>
                      <span className="block text-[11px] text-zinc-600 truncate">
                        {a.displayName || 'İsimsiz'} · Son giriş: {a.lastSignIn ? new Date(a.lastSignIn).toLocaleString('tr-TR') : 'yok'}
                      </span>
                    </button>
                    <button type="button" onClick={() => handleDelete(a)} aria-label={`${a.email} hesabını sil`} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-red-700 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={handleSave} className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">Giriş bilgisi oluştur / güncelle</h4>
            <label className="block text-xs font-medium text-zinc-700">E-posta
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1`} autoComplete="off" />
            </label>
            <label className="block text-xs font-medium text-zinc-700">Yetkili adı (opsiyonel)
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`${inputCls} mt-1`} maxLength={120} />
            </label>
            <label className="block text-xs font-medium text-zinc-700">Yeni parola (en az 8 karakter)
              <div className="mt-1 flex gap-2">
                <input type={showPw ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Parolayı gizle' : 'Parolayı göster'} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-zinc-300 cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => { setPassword(generatePassword()); setShowPw(true); }} aria-label="Güçlü parola üret" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-zinc-300 cursor-pointer">
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </label>
            <p className="text-[11px] text-zinc-600">Güncellemede eski oturumlar kapatılır; otel yeni parola ile yeniden giriş yapar. Yönetici/pilot e-postaları değiştirilemez.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="min-h-[44px] px-4 rounded-xl border border-zinc-300 text-xs font-semibold cursor-pointer">Kapat</button>
              <button type="submit" disabled={saving} className="min-h-[44px] px-5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
