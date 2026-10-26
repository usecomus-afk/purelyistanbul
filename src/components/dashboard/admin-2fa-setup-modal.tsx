"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Shield, KeyRound, QrCode, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";

interface Admin2FASetupModalProps {
  email: string;
  password: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function Admin2FASetupModal({
  email,
  password,
  isOpen,
  onClose,
  onSuccess,
}: Admin2FASetupModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [setupSecret, setSetupSecret] = useState<string>("");
  const [otpauth, setOtpauth] = useState<string>("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setTotpCode("");
    setLoading(true);

    authFetch(`/api/admin-2fa?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success && !data.isEnabled) {
          setQrDataUrl(data.qrDataUrl || "");
          setSetupSecret(data.setupSecret || "");
          setOtpauth(data.otpauth || "");
        } else if (data.isEnabled) {
          toast.info("Google Authenticator zaten bu hesap için aktif.");
          onClose();
        } else {
          setError(data.error || "2FA kurulum bilgileri alınamadı.");
        }
      })
      .catch(() => {
        setLoading(false);
        setError("Sunucuya bağlanılamadı.");
      });
  }, [isOpen, email, onClose]);

  const handleCopy = () => {
    if (!setupSecret) return;
    navigator.clipboard.writeText(setupSecret);
    setCopied(true);
    toast.success("Gizli anahtar panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      setError("Lütfen Google Authenticator uygulamasındaki 6 haneli kodu eksiksiz girin.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await authFetch("/api/admin-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          secret: setupSecret,
          token: totpCode,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        toast.success("Google Authenticator başarıyla aktifleştirildi!");
        onSuccess();
      } else {
        setError(data.error || "Kod doğrulanamadı.");
      }
    } catch {
      setSubmitting(false);
      setError("Doğrulama sırasında bir hata oluştu.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] border border-[#C8C4B0] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#E8F0E4] text-[#2D5A1E] border border-[#C2D8B8]">
              <Shield className="w-3.5 h-3.5" />
              <span>Google Authenticator (2FA) Kurulumu</span>
            </div>
            <h3 className="comus-serif text-2xl font-semibold text-[#2C2C1A] tracking-tight">
              Yönetici Hesabınızı Güvenceye Alın
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B6B55] hover:text-[#2C2C1A] p-1 rounded-lg hover:bg-black/5 transition"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-[#6B6B55] animate-pulse">
            Güvenli QR kod ve anahtar hazırlanıyor...
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-xs text-[#6B6B55] space-y-1 leading-relaxed">
              <p>
                <strong>1. Adım:</strong> Telefonunuzdaki <strong>Google Authenticator</strong> (veya 1Password, Authy) uygulamasını açın.
              </p>
              <p>
                <strong>2. Adım:</strong> <strong>&ldquo;+&rdquo;</strong> butonuna basıp aşağıdaki QR kodu kameranızla tarayın.
              </p>
            </div>

            {/* QR Kod Alanı */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#C8C4B0]/80 shadow-xs">
              {qrDataUrl ? (
                <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                  <Image
                    src={qrDataUrl}
                    alt="Google Authenticator QR Kodu"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-[#6B6B55]">
                  QR Kod üretilemedi
                </div>
              )}

              {setupSecret && (
                <div className="mt-3 w-full max-w-sm pt-2 border-t border-[#E8E6DF] text-center">
                  <span className="text-[11px] text-[#8C8C73] block mb-1">
                    QR taranamıyorsa manuel kurulum anahtarı:
                  </span>
                  <div className="flex items-center justify-center gap-2 bg-[#F3F1EC] px-3 py-1.5 rounded-lg border border-[#DCD9CE]">
                    <code className="font-mono text-xs font-semibold text-[#2C2C1A] tracking-wider select-all">
                      {setupSecret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-[#6B6B55] hover:text-[#3B6D11] transition p-1"
                      title="Anahtarı kopyala"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Doğrulama Formu */}
            <form onSubmit={handleVerifyAndActivate} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#2C2C1A] mb-1">
                  <strong>3. Adım:</strong> Google Authenticator&apos;da üretilen 6 Haneli Kod
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="örn: 123456"
                  className="w-full text-center tracking-[0.3em] font-mono font-bold text-xl rounded-xl border border-[#C8C4B0] bg-white px-4 py-2.5 text-[#2C2C1A] focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/30 focus:border-[#3B6D11]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#C8C4B0] text-xs font-semibold text-[#6B6B55] hover:bg-black/5 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting || totpCode.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-[#3B6D11] hover:bg-[#2F570D] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submitting ? "Doğrulanıyor..." : "Doğrula ve Etkinleştir"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
