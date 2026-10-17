"use client";

import { useState, useRef, useEffect } from 'react';
import { Hotel, Language } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { LuxuryCategoryIcon } from './luxury-category-icon';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        setPreviewImage(base64Image);

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="luxury-service-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Gizli Kamera / Dosya Seçici Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileChange} 
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#C4B8A4] flex items-center justify-between bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6]">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <LuxuryCategoryIcon categoryKey="kbs" className="w-12 h-12" />
            </div>
            <div>
              <h2 className="font-luxury-serif text-base sm:text-lg font-bold uppercase tracking-[0.04em] text-[#141414]">
                Online Check-in & Kimlik Teyidi
              </h2>
              <p className="font-luxury-sans text-[11px] text-[#5C4938]">
                {hotel.name} • Oda {roomNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-luxury-sans text-xs">

          {step === 'UPLOAD' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] text-left space-y-1.5">
                <div className="flex items-center gap-2 text-[#7D5E2A] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#8E7252]" />
                  <span>Resmi EGM Kimlik Bildirim Sistemi (KBS) Uyumu</span>
                </div>
                <p className="text-[11px] text-[#3D352E] leading-relaxed">
                  Resepsiyonda beklemeden odanıza geçebilmeniz için pasaport veya kimliğinizi kameranızla çekip saniyeler içinde check-in yapabilirsiniz.
                </p>
              </div>

              {/* Upload & Scan Actions */}
              <div className="p-6 border-2 border-dashed border-[#C4B8A4] rounded-2xl bg-[#FAF8F4]/70 flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#C4B8A4] text-[#8E7252] flex items-center justify-center shadow-xs">
                  <Camera className="w-7 h-7 stroke-[1.6]" />
                </div>
                <div>
                  <strong className="font-luxury-serif text-sm font-bold text-[#141414] block">Kamera ile Pasaport / Kimlik Çekin</strong>
                  <span className="text-[10px] text-[#5C4938]">Otomatik OCR & EGM KBS Belge Okuyucu</span>
                </div>

                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={isProcessingOcr}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingOcr ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pasaport Taranıyor...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Kamera ile Pasaport Tara</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-[#5C4938]">
                veya{' '}
                <button
                  onClick={() => setStep('REVIEW')}
                  className="text-[#7D5E2A] font-bold underline hover:text-[#141414] cursor-pointer"
                >
                  bilgileri manuel girmek için tıklayın
                </button>
              </div>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-[#141414] text-[11px] flex items-center justify-between font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8E7252] shrink-0" />
                  <span>Kimlik bilgileriniz okundu. Lütfen kontrol edip onaylayınız.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="text-[10px] text-[#7D5E2A] font-bold underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> Yeniden Çek
                </button>
              </div>

              {previewImage && (
                <div className="p-2 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] flex items-center gap-3">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-[#EFE8DA] relative shrink-0 border border-[#C4B8A4]">
                    <img 
                      src={previewImage} 
                      alt="Taranan Belge" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-[#5C4938] min-w-0">
                    <strong className="text-[#141414] block truncate">Taranan Pasaport Fotoğrafı</strong>
                    <span className="text-[10px] text-[#7D5E2A] block font-semibold">✓ OCR ile metinler başarıyla ayrıştırıldı</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Ad (First Name)</label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder="Adınız"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Soyad (Last Name)</label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder="Soyadınız"
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Belge Türü</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  >
                    <option value="PASSPORT">Pasaport (Passport)</option>
                    <option value="TCKN">T.C. Kimlik Kartı</option>
                    <option value="NATIONAL_ID">Ulusal Kimlik Kartı (National ID)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Belge No</label>
                  <input
                    type="text"
                    value={documentNumber}
                    placeholder="Pasaport veya TCKN No"
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-mono font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Uyruk (ISO 3-Letter)</label>
                  <input
                    type="text"
                    value={nationality}
                    placeholder="TUR, DEU, USA..."
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('UPLOAD')}
                  className="w-1/3 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition cursor-pointer"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              <div className="w-16 h-16 rounded-full bg-[#FAF8F4] border-[1.5px] border-[#C5A059] text-[#7D5E2A] mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">Check-in Başarıyla Tamamlandı!</h3>
                <p className="text-xs text-[#5C4938] mt-1">
                  Bilgileriniz otel resepsiyonuna ve EGM KBS sistemine iletildi. Anahtarınızı resepsiyondan doğrudan alabilirsiniz.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Misafir:</span>
                  <strong className="text-[#141414]">{firstName} {lastName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Oda No:</span>
                  <strong className="text-[#141414]">{roomNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">Pasaport / Kimlik:</span>
                  <strong className="text-[#7D5E2A] font-mono">{documentNumber}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition cursor-pointer"
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
