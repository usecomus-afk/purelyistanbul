"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AGREEMENT_VERSION = "2026-09-v1";

/**
 * Marketplace giriş/kayıt sayfası — bu, ileriki adımlarda ilan listeleme
 * (Airbnb tarzı grid) ile değiştirilecek geçici bir iskele sayfasıdır.
 * Şu anki hedefi: gerçek Firebase Authentication + Firestore user profile
 * akışının uçtan uca çalıştığını göstermek.
 */
export default function MarketplaceHomePage() {
  const { user, profile, loading, signUp, signIn, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreed, setAgreed] = useState({
    userAgreement: false,
    privacyPolicy: false,
    distanceSales: false,
    preInfoForm: false
  });
  const [submitting, setSubmitting] = useState(false);

  const allAgreed = Object.values(agreed).every(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "register") {
        if (!allAgreed) {
          toast.error("Kayıt için tüm sözleşmeleri onaylamanız gerekiyor.");
          return;
        }
        await signUp({
          email,
          password,
          displayName,
          consents: {
            userAgreementVersion: AGREEMENT_VERSION,
            privacyPolicyVersion: AGREEMENT_VERSION,
            distanceSalesAgreementVersion: AGREEMENT_VERSION,
            preInfoFormVersion: AGREEMENT_VERSION
          }
        });
        toast.success("Kaydınız oluşturuldu.");
      } else {
        await signIn(email, password);
        toast.success("Giriş yapıldı.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>;
  }

  if (user && profile) {
    return (
      <div className="max-w-xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-terracotta">Purely Istanbul Marketplace</h1>
        <div className="rounded-2xl border border-sand-border bg-sand-card p-5 space-y-2">
          <p className="text-sm">Hoş geldiniz, <strong>{profile.displayName}</strong></p>
          <p className="text-xs text-ink-muted">
            Aktif rol: <span className="font-semibold">{profile.activeRole === "host" ? "İlan Sahibi" : "Misafir"}</span>
          </p>
          {profile.roles.host ? (
            <p className="text-xs text-emerald-700">
              Host onayınız aktif — komisyon oranı: %{Math.round(profile.hostProfile!.commissionRate.hostRate * 100)} pay
            </p>
          ) : (
            <Link href="/marketplace/become-a-host" className="inline-block mt-2 text-xs font-semibold text-terracotta underline">
              İlan Sahibi (Host) Moduna Geç →
            </Link>
          )}
        </div>
        <button
          onClick={() => logout()}
          className="text-xs font-semibold text-ink-muted underline"
        >
          Çıkış Yap
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold text-terracotta mb-1">Purely Istanbul</h1>
      <p className="text-sm text-ink-muted mb-6">Marketplace — {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Ad Soyad"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
          />
        )}
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm"
        />

        {mode === "register" && (
          <div className="space-y-2 text-xs text-ink-muted">
            <label className="flex items-start gap-2">
              <input type="checkbox" required checked={agreed.userAgreement}
                onChange={(e) => setAgreed((a) => ({ ...a, userAgreement: e.target.checked }))} />
              <span>Kullanıcı Sözleşmesi'ni okudum, kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" required checked={agreed.privacyPolicy}
                onChange={(e) => setAgreed((a) => ({ ...a, privacyPolicy: e.target.checked }))} />
              <span>Gizlilik Politikası'nı okudum, kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" required checked={agreed.distanceSales}
                onChange={(e) => setAgreed((a) => ({ ...a, distanceSales: e.target.checked }))} />
              <span>Mesafeli Satış Sözleşmesi'ni okudum, kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" required checked={agreed.preInfoForm}
                onChange={(e) => setAgreed((a) => ({ ...a, preInfoForm: e.target.checked }))} />
              <span>Ön Bilgilendirme Formu'nu okudum, kabul ediyorum.</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-terracotta text-white font-semibold py-2.5 text-sm disabled:opacity-60"
        >
          {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-xs font-semibold text-ink-muted underline"
      >
        {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
      </button>
    </div>
  );
}
