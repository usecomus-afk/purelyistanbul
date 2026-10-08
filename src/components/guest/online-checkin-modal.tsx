"use client";

import { useState, useRef, useEffect } from 'react';
import { Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  FileText, 
  User, 
  Globe, 
  Calendar,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface OnlineCheckinModalProps {
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  onClose: () => void;
}

export function OnlineCheckinModal({ hotel, roomNumber, lang, onClose }: OnlineCheckinModalProps) {
  const t = getT(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'UPLOAD' | 'REVIEW' | 'SUCCESS'>('UPLOAD');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState<'PASSPORT' | 'TCKN' | 'NATIONAL_ID'>('PASSPORT');
  const [documentNumber, setDocumentNumber] = useState('');
  const [nationality, setNationality] = useState('TUR');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'UNKNOWN'>('MALE');

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingOcr(true);

    try {
      // 1. Görseli Base64'e çevir
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        setPreviewImage(base64Image);

        // 2. Canlı OCR API'sine İstek At
        const response = await fetch('/api/kbs/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            mimeType: file.type
          })
        });

        const data = await response.json();
        const rec = data.record || data.parsedData;
        if (data.success && rec) {
          // 3. Form alanlarını GERÇEK OCR çıktısıyla doldur
          setFirstName(rec.first_name || '');
          setLastName(rec.last_name || '');
          setDocumentNumber(rec.document_number || '');
          setNationality(rec.nationality || 'TUR');
          setBirthDate(rec.birth_date || '1990-01-01');
          setGender(rec.gender || 'MALE');
          setDocumentType(rec.document_type || 'PASSPORT');

          toast.success('Pasaport başarıyla tarandı ve bilgiler ayrıştırıldı.');
          setStep('REVIEW');
        } else {
          toast.info('Görsel alındı, lütfen bilgileri kontrol edip eksikleri tamamlayınız.');
          setStep('REVIEW');
        }
        setIsProcessingOcr(false);
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      toast.error('Görsel işlenirken bir hata oluştu, lütfen manuel doldurunuz.');
      setStep('REVIEW');
      setIsProcessingOcr(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!firstName || !lastName || !documentNumber) {
      toast.error('Lütfen Ad, Soyad ve Pasaport/Kimlik numaranızı eksiksiz giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/kbs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          room_number: roomNumber,
          first_name: firstName,
          last_name: lastName,
          document_type: documentType,
          document_number: documentNumber,
          nationality,
          birth_date: birthDate || '1990-01-01',
          gender,
          document_image_url: previewImage || undefined
        })
      });

      if (res.ok) {
        setStep('SUCCESS');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Dijital check-in ve kimlik bildirimi onaylandı.');
      } else {
        throw new Error('Kayıt gönderilemedi.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Gizli Kamera / Dosya Seçici Input (capture="environment") */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileChange} 
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center p-1.5 shadow-xs">
              <Image 
                src="/icons/kbs-online-checkin.png" 
                alt="KBS Check-in" 
                width={32} 
                height={32} 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-serif text-zinc-900 dark:text-slate-100">
                Online Check-in & Kimlik Teyidi
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-slate-400">
                {hotel.name} • Oda {roomNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">

          {step === 'UPLOAD' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-200/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Resmi EGM Kimlik Bildirim Sistemi (KBS) Uyumu</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-slate-400 leading-relaxed">
                  Resepsiyonda beklemeden odanıza geçebilmeniz için pasaport veya kimliğinizi kameranızla çekip saniyeler içinde check-in yapabilirsiniz.
                </p>
              </div>

              {/* Upload & Scan Actions */}
              <div className="p-6 border-2 border-dashed border-amber-300 rounded-3xl bg-amber-50/30 flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <strong className="text-xs text-zinc-800 dark:text-slate-200 block">Kamera ile Pasaport / Kimlik Çekin</strong>
                  <span className="text-[10px] text-zinc-500 dark:text-slate-400">Otomatik OCR & EGM KBS Belge Okuyucu</span>
                </div>

                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={isProcessingOcr}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingOcr ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pasaport Taranıyor...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>📸 Kamera ile Pasaport Tara</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-zinc-400">
                veya{' '}
                <button
                  onClick={() => setStep('REVIEW')}
                  className="text-amber-700 font-bold underline hover:text-amber-800 cursor-pointer"
                >
                  bilgileri manuel girmek için tıklayın
                </button>
              </div>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kimlik bilgileriniz okundu. Lütfen kontrol edip onaylayınız.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="text-[10px] text-amber-800 font-bold underline flex items-center gap-1 hover:text-amber-950 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> Yeniden Çek
                </button>
              </div>

              {previewImage && (
                <div className="p-2 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-zinc-200 relative shrink-0 border border-zinc-300">
                    <img 
                      src={previewImage} 
                      alt="Taranan Belge" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-slate-400 min-w-0">
                    <strong className="text-zinc-800 dark:text-slate-200 block truncate">Taranan Pasaport Fotoğrafı</strong>
                    <span className="text-[10px] text-emerald-600 block font-medium">✓ OCR ile metinler başarıyla ayrıştırıldı</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 block mb-1">Ad (First Name)</label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder="Adınız"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 block mb-1">Soyad (Last Name)</label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder="Soyadınız"
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 block mb-1">Belge Türü</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="PASSPORT">Pasaport (Passport)</option>
                    <option value="TCKN">T.C. Kimlik Kartı</option>
                    <option value="NATIONAL_ID">Ulusal Kimlik Kartı (National ID)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 block mb-1">Belge No</label>
                  <input
                    type="text"
                    value={documentNumber}
                    placeholder="Pasaport veya TCKN No"
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-mono font-bold text-zinc-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 block mb-1">Uyruk (ISO 3-Letter)</label>
                  <input
                    type="text"
                    value={nationality}
                    placeholder="TUR, DEU, USA..."
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-slate-400 block mb-1">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('UPLOAD')}
                  className="w-1/3 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kimliği Onayla ve Check-in Yap</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-slate-100">Check-in Başarıyla Tamamlandı!</h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
                  Bilgileriniz otel resepsiyonuna ve EGM KBS sistemine iletildi. Anahtarınızı resepsiyondan doğrudan alabilirsiniz.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-slate-400">Misafir:</span>
                  <strong className="text-zinc-900 dark:text-slate-100">{firstName} {lastName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-slate-400">Oda No:</span>
                  <strong className="text-zinc-900 dark:text-slate-100">{roomNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-slate-400">Pasaport / Kimlik:</span>
                  <strong className="text-zinc-900 dark:text-slate-100 font-mono">{documentNumber}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Kapat ve Deneyimleri Keşfet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
