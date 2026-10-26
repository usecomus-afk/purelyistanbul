"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Trash2, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";

interface HotelOption {
  id: string;
  name: string;
}

interface HotelAccount {
  uid: string;
  email?: string;
  displayName?: string;
  hotelId?: string;
  disabled: boolean;
  lastSignIn?: string;
}

/**
 * Yönetici güvenlik paneli:
 *  1) Yönetici parolasını yenileme (mevcut parola doğrulamalı)
 *  2) Otel yöneticisi hesapları (Firebase Authentication) oluşturma / parola sıfırlama / silme
 */
export function AdminSecurityPanel({ hotels }: { hotels: HotelOption[] }) {
  // ---- Parola yenile ----
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const pwProblem = (() => {
    if (!newPw) return "";
    if (newPw.length < 10) return "En az 10 karakter olmalı.";
    if (!/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) return "En az bir harf ve bir rakam içermeli.";
    if (confirmPw && newPw !== confirmPw) return "Parolalar eşleşmiyor.";
    return "";
  })();
  const canSubmitPw = !!currentPw && !!newPw && !!confirmPw && !pwProblem && newPw === confirmPw && !pwBusy;

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPw) return;
    setPwBusy(true);
    try {
      const res = await authFetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success("Yönetici parolası yenilendi. Bir sonraki girişte yeni parolayı kullanın.");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(data.error || "Parola yenilenemedi.");
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setPwBusy(false);
    }
  };

  // ---- Otel hesapları ----
  const [accounts, setAccounts] = useState<HotelAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [acctEmail, setAcctEmail] = useState("");
  const [acctPw, setAcctPw] = useState("");
  const [acctName, setAcctName] = useState("");
  const [acctHotel, setAcctHotel] = useState("");
  const [acctBusy, setAcctBusy] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/hotel-users");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setAccounts(data.accounts || []);
      else toast.error(data.error || "Otel hesapları yüklenemedi.");
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const hotelName = (id?: string) => hotels.find((h) => h.id === id)?.name || id || "-";

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acctEmail || !acctHotel || acctPw.length < 8) {
      toast.error("E-posta, otel ve en az 8 karakterli parola gerekli.");
      return;
    }
    setAcctBusy(true);
    try {
      const res = await authFetch("/api/admin/hotel-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acctEmail, password: acctPw, hotelId: acctHotel, displayName: acctName || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(data.created ? "Otel hesabı oluşturuldu." : "Otel hesabı güncellendi (parola/otel).");
        setAcctEmail("");
        setAcctPw("");
        setAcctName("");
        loadAccounts();
      } else {
        toast.error(data.error || "İşlem başarısız.");
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setAcctBusy(false);
    }
  };

  const removeAccount = async (email?: string) => {
    if (!email) return;
    if (!window.confirm(`${email} hesabı silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      const res = await authFetch("/api/admin/hotel-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success("Hesap silindi.");
        loadAccounts();
      } else {
        toast.error(data.error || "Hesap silinemedi.");
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#C8C4B0]">
        <div className="text-xs uppercase tracking-widest text-[#3B6D11]">Hesap &amp; Erişim Güvenliği</div>
        <h1 className="comus-serif text-3xl sm:text-4xl font-light text-[#2C2C1A]">
          Ayarlar &amp; <em className="italic text-[#3B6D11]">Güvenlik</em>
        </h1>
      </div>

      {/* PAROLA YENİLE */}
      <form onSubmit={submitPassword} className="comus-card space-y-4 max-w-xl">
        <div className="flex items-center gap-2 border-b border-[#C8C4B0]/60 pb-3">
          <KeyRound className="w-4 h-4 text-[#C1622F]" />
          <h2 className="text-sm font-semibold text-[#2C2C1A]">Yönetici Parolasını Yenile</h2>
        </div>
        <div>
          <label className="comus-label">Mevcut Parola</label>
          <input type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="comus-input" />
        </div>
        <div>
          <label className="comus-label">Yeni Parola</label>
          <input type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="comus-input" />
          <p className="text-[11px] mt-1 text-[#6B6B55]">En az 10 karakter, en az bir harf ve bir rakam.</p>
        </div>
        <div>
          <label className="comus-label">Yeni Parola (Tekrar)</label>
          <input type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="comus-input" />
          {pwProblem && <p className="text-[11px] mt-1 text-[#B3261E]">{pwProblem}</p>}
        </div>
        <button type="submit" disabled={!canSubmitPw} className="comus-btn-primary disabled:opacity-50 cursor-pointer">
          {pwBusy ? "Kaydediliyor..." : "Parolayı Yenile"}
        </button>
      </form>

      {/* OTEL HESAPLARI */}
      <div className="comus-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#C8C4B0]/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3B6D11]" />
            <h2 className="text-sm font-semibold text-[#2C2C1A]">Otel Yönetici Hesapları</h2>
          </div>
          <button type="button" onClick={loadAccounts} disabled={loading} className="text-xs flex items-center gap-1 text-[#6B6B55] cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
          </button>
        </div>

        <form onSubmit={submitAccount} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="comus-label">Otel</label>
            <select value={acctHotel} onChange={(e) => setAcctHotel(e.target.value)} className="comus-input">
              <option value="">Otel seçin...</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="comus-label">E-posta</label>
            <input type="email" value={acctEmail} onChange={(e) => setAcctEmail(e.target.value)} placeholder="yonetici@otel.com" className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Ad Soyad (opsiyonel)</label>
            <input type="text" value={acctName} onChange={(e) => setAcctName(e.target.value)} className="comus-input" />
          </div>
          <div>
            <label className="comus-label">Parola (min. 8 karakter)</label>
            <input type="password" autoComplete="new-password" value={acctPw} onChange={(e) => setAcctPw(e.target.value)} className="comus-input" />
          </div>
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#6B6B55]">Aynı e-posta varsa parolası ve oteli güncellenir. Otel yöneticisi yalnızca kendi otelinin verisini görür.</span>
            <button type="submit" disabled={acctBusy} className="comus-btn-primary flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
              <UserPlus className="w-4 h-4" />
              {acctBusy ? "Kaydediliyor..." : "Hesap Oluştur / Güncelle"}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[#6B6B55] border-b border-[#C8C4B0]/60">
                <th className="py-2 pr-3 font-medium">E-posta</th>
                <th className="py-2 pr-3 font-medium">Otel</th>
                <th className="py-2 pr-3 font-medium">Son Giriş</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-[#6B6B55]">
                    {loading ? "Yükleniyor..." : "Henüz otel hesabı yok."}
                  </td>
                </tr>
              )}
              {accounts.map((a) => (
                <tr key={a.uid} className="border-b border-[#C8C4B0]/30">
                  <td className="py-2 pr-3">
                    {a.email}
                    {a.disabled && <span className="ml-2 text-[#B3261E]">(devre dışı)</span>}
                  </td>
                  <td className="py-2 pr-3">{hotelName(a.hotelId)}</td>
                  <td className="py-2 pr-3 text-[#6B6B55]">{a.lastSignIn ? new Date(a.lastSignIn).toLocaleString("tr-TR") : "-"}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => removeAccount(a.email)} className="text-[#B3261E] cursor-pointer" aria-label={`${a.email} hesabını sil`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
