"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";

const AGREEMENT_VERSION = "2026-09-v1";

export default function MarketplaceAccountPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-muted">Loading account...</div>}>
      <MarketplaceAccountForm />
      <MarketplaceFooter />
    </Suspense>
  );
}

function MarketplaceAccountForm() {
  const { user, profile, loading, signUp, signIn, signInWithGoogle, logout } = useAuth();
  const router = useRouter();
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
    preInfoForm: false,
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
          toast.error("Please accept all required agreements to create your account.");
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
            preInfoFormVersion: AGREEMENT_VERSION,
          },
        });
        toast.success("Your account has been created.");
        router.push("/");
      } else {
        await signIn(email, password);
        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in successfully.");
      router.push("/");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message || "Google sign-in failed.");
      }
    } finally {
      setGoogleSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-ink-muted">Loading...</div>;
  }

  if (user) {
    if (!profile) {
      return <div className="p-8 text-sm text-ink-muted">Loading account details...</div>;
    }
    return (
      <div className="max-w-xl mx-auto px-5 py-12 space-y-6">
        <h1 className="font-luxury-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink">My Account</h1>
        <div className="rounded-3xl border border-sand-border bg-white p-6 space-y-3 shadow-sm">
          <p className="text-sm">
            Welcome, <strong className="font-semibold">{profile.displayName}</strong>
          </p>
          <p className="text-xs text-ink-muted">
            Account type:{" "}
            <span className="font-semibold text-ink">
              {profile.activeRole === "host" ? "Verified Partner" : "Traveler & Guest"}
            </span>
          </p>
          {profile.roles.host ? (
            <>
              <p className="text-xs text-emerald-700 font-medium">
                Verified Partner status active — your partner payout share is{" "}
                {Math.round(profile.hostProfile!.commissionRate.hostRate * 100)}%
              </p>
              <Link
                href="/marketplace/host/listings"
                className="inline-block text-xs font-semibold text-terracotta underline"
              >
                Manage Partner Listings →
              </Link>
            </>
          ) : (
            <Link
              href="/marketplace/partner/extranet"
              className="inline-block text-xs font-semibold text-terracotta underline"
            >
              For Boutique Hotels &amp; Property Managers →
            </Link>
          )}
        </div>
        <button onClick={() => logout()} className="text-xs font-semibold text-ink-muted underline">
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <h1 className="font-luxury-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-1">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>
      <p className="text-sm text-ink-muted mb-6">Purely Istanbul — Curated City Companion</p>

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
        <span>{mode === "login" ? "Continue with Google" : "Register with Google"}</span>
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-sand-border" />
        <span className="text-[11px] text-ink-muted">or</span>
        <div className="h-px flex-1 bg-sand-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        )}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <input
          type="password"
          placeholder="Password"
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
              <span>I have read and agree to the Terms of Service.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.privacyPolicy}
                onChange={(e) => setAgreed((a) => ({ ...a, privacyPolicy: e.target.checked }))}
              />
              <span>I have read and agree to the Privacy Notice (UK GDPR &amp; KVKK).</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.distanceSales}
                onChange={(e) => setAgreed((a) => ({ ...a, distanceSales: e.target.checked }))}
              />
              <span>I have read and agree to the Marketplace Booking Terms.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                checked={agreed.preInfoForm}
                onChange={(e) => setAgreed((a) => ({ ...a, preInfoForm: e.target.checked }))}
              />
              <span>I acknowledge the Pre-Booking Disclosure Form.</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink text-white font-semibold py-2.5 text-sm disabled:opacity-60 hover:bg-terracotta transition"
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-xs font-semibold text-ink-muted underline"
      >
        {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign In"}
      </button>
    </div>
  );
}
