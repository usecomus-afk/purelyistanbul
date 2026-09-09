"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AGREEMENT_VERSION = "2026-09-v1";

/**
 * Giriş/kayıt + hesap özeti. Ana vitrin artık "/" (grid); bu sayfa sadece
 * kimlik doğrulama ve host durumu için kullanılır. Header'daki "Kayıt Ol"
 * butonu ?mode=register ile doğrudan kayıt formunu açar.
 */
export default function MarketplaceAccountPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>}>
      <MarketplaceAccountForm />
    </Suspense>
  );
}

function MarketplaceAccountForm() {
  const { user, profile, loading, signUp, signIn, signInWithGoogle, logout } = useAuth();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
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
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

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

  async function handleGoogleSignIn() {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Giriş yapıldı.");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message || "Google ile giriş başarısız oldu.");
      }
    } finally {
      setGoogleSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>;
  }

  if (user && profile) {
    return (
      <div className="max-w-xl mx-auto px-5 py-12 space-y-6">
        <h1 className="text-2xl font-light tracking-tight text-ink">Hesabım</h1>
        <div className="rounded-3xl border border-sand-border bg-white p-6 space-y-3 shadow-sm">
          <p className="text-sm">
            Hoş geldiniz, <strong className="font-semibold">{profile.displayName}</strong>
          </p>
          <p className="text-xs text-ink-muted">
            Aktif rol:{" "}
            <span className="font-semibold text-ink">
              {profile.activeRole === "host" ? "İlan Sahibi" : "Misafir"}
            </span>
          </p>
          {profile.roles.host ? (
            <>
              <p className="text-xs text-emerald-700 font-medium">
                Host onayınız aktif — payınız %{Math.round(profile.hostProfile!.commissionRate.hostRate * 100)}
              </p>
              <Link
                href="/marketplace/host/listings"
                className="inline-block text-xs font-semibold text-terracotta underline"
              >
                İlanlarımı Yönet →
              </Link>
            </>
          ) : (
            <Link href="/marketplace/become-a-host" className="inline-block text-xs font-semibold text-terracotta underline">
              İlan Sahibi (Host) Moduna Geç →
            </Link>
          )}
        </div>
        <button onClick={() => logout()} className="text-xs font-semibold text-ink-muted underline">
          Çıkış Yap
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <h1 className="text-2xl font-light tracking-tight text-ink mb-1">
        {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
      </h1>
      <p className="text-sm text-ink-muted mb-6">Purely Istanbul Marketplace</p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleSubmitting}
        className="w-full flex items-center justify-center gap-2.5 rounded-full border border-sand-border bg-white text-ink font-medium py-2.5 text-sm hover:bg-sand-bg transition disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
        </svg>
        <span>{mode === "login" ? "Google ile Giriş Yap" : "Google ile Kayıt Ol"}</span>
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-sand-border" />
        <span className="text-[11px] text-ink-muted">veya</span>
        <div className="h-px flex-1 bg-sand-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Ad Soyad"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        )}
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />

        {mode === "register" && (
          <div className="space-y-2 text-xs text-ink-muted pt-1">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.userAgreement}
                onChange={(e) => setAgreed((a) => ({ ...a, userAgreement: e.target.checked }))}
              />
              <span>Kullanıcı Sözleşmesi'ni okudum, kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.privacyPolicy}
                onChange={(e) => setAgreed((a) => ({ ...a, privacyPolicy: e.target.checked }))}
              />
              <span>Gizlilik Politikası'nı okudum, kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.distanceSales}
                onChange={(e) => setAgreed((a) => ({ ...a, distanceSales: e.target.checked }))}
              />
              <span>Mesafeli Satış Sözleşmesi'ni okudum, kabul ediyorum.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.preInfoForm}
                onChange={(e) => setAgreed((a) => ({ ...a, preInfoForm: e.target.checked }))}
              />
              <span>Ön Bilgilendirme Formu'nu okudum, kabul ediyorum.</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-terracotta text-white font-semibold py-2.5 text-sm disabled:opacity-60 hover:bg-terracotta/90 transition"
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
