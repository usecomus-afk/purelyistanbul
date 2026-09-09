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
  const { user, profile, loading, signUp, signIn, logout } = useAuth();
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
