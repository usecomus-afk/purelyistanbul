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

const CHECKIN_I18N: Record<Language, {
  title: string;
  kbsBadge: string;
  kbsDesc: string;
  scanTitle: string;
  scanSubtitle: string;
  scanningBtn: string;
  scanBtn: string;
  orText: string;
  manualLink: string;
  reviewNotice: string;
  retakeBtn: string;
  scannedPhotoTitle: string;
  scannedPhotoDesc: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  docTypeLabel: string;
  docPassport: string;
  docTckn: string;
  docNationalId: string;
  docNumberLabel: string;
  docNumberPlaceholder: string;
  nationalityLabel: string;
  birthDateLabel: string;
  backBtn: string;
  savingBtn: string;
  confirmBtn: string;
  successTitle: string;
  successDesc: string;
  guestLabel: string;
  roomNoLabel: string;
  docLabel: string;
  closeBtn: string;
  toastScanned: string;
  toastCheckManual: string;
  toastScanError: string;
  toastMissingFields: string;
  toastSuccess: string;
  toastSubmitError: string;
}> = {
  tr: {
    title: "Online Check-in & Kimlik Teyidi",
    kbsBadge: "Resmi EGM Kimlik Bildirim Sistemi (KBS) Uyumu",
    kbsDesc: "Resepsiyonda beklemeden odanıza geçebilmeniz için pasaport veya kimliğinizi kameranızla çekip saniyeler içinde check-in yapabilirsiniz.",
    scanTitle: "Kamera ile Pasaport / Kimlik Çekin",
    scanSubtitle: "Otomatik OCR & EGM KBS Belge Okuyucu",
    scanningBtn: "Pasaport Taranıyor...",
    scanBtn: "Kamera ile Pasaport Tara",
    orText: "veya",
    manualLink: "bilgileri manuel girmek için tıklayın",
    reviewNotice: "Kimlik bilgileriniz okundu. Lütfen kontrol edip onaylayınız.",
    retakeBtn: "Yeniden Çek",
    scannedPhotoTitle: "Taranan Pasaport Fotoğrafı",
    scannedPhotoDesc: "✓ OCR ile metinler başarıyla ayrıştırıldı",
    firstNameLabel: "Ad",
    firstNamePlaceholder: "Adınız",
    lastNameLabel: "Soyad",
    lastNamePlaceholder: "Soyadınız",
    docTypeLabel: "Belge Türü",
    docPassport: "Pasaport",
    docTckn: "T.C. Kimlik Kartı",
    docNationalId: "Ulusal Kimlik Kartı",
    docNumberLabel: "Belge No",
    docNumberPlaceholder: "Pasaport veya TCKN No",
    nationalityLabel: "Uyruk (3 Harfli Kod)",
    birthDateLabel: "Doğum Tarihi",
    backBtn: "Geri",
    savingBtn: "Kaydediliyor...",
    confirmBtn: "Kimliği Onayla ve Check-in Yap",
    successTitle: "Check-in Başarıyla Tamamlandı!",
    successDesc: "Bilgileriniz otel resepsiyonuna ve EGM KBS sistemine iletildi. Anahtarınızı resepsiyondan doğrudan alabilirsiniz.",
    guestLabel: "Misafir:",
    roomNoLabel: "Oda No:",
    docLabel: "Pasaport / Kimlik:",
    closeBtn: "Kapat ve Deneyimleri Keşfet",
    toastScanned: "Pasaport başarıyla tarandı ve bilgiler ayrıştırıldı.",
    toastCheckManual: "Görsel alındı, lütfen bilgileri kontrol edip eksikleri tamamlayınız.",
    toastScanError: "Görsel işlenirken bir hata oluştu, lütfen manuel doldurunuz.",
    toastMissingFields: "Lütfen Ad, Soyad ve Pasaport/Kimlik numaranızı eksiksiz giriniz.",
    toastSuccess: "Dijital check-in ve kimlik bildirimi onaylandı.",
    toastSubmitError: "Kayıt gönderilemedi."
  },
  en: {
    title: "Online Check-in & ID Verification",
    kbsBadge: "Official Identity Notification System (KBS) Compliance",
    kbsDesc: "Scan your passport or national ID with your camera to complete check-in in seconds and skip the reception queue.",
    scanTitle: "Scan Passport / ID with Camera",
    scanSubtitle: "Automated OCR & Official Document Reader",
    scanningBtn: "Scanning Document...",
    scanBtn: "Scan Passport with Camera",
    orText: "or",
    manualLink: "click here to enter details manually",
    reviewNotice: "Your identity details have been scanned. Please review and confirm.",
    retakeBtn: "Retake",
    scannedPhotoTitle: "Scanned Document Photo",
    scannedPhotoDesc: "✓ Text extracted via OCR",
    firstNameLabel: "First Name",
    firstNamePlaceholder: "First Name",
    lastNameLabel: "Last Name",
    lastNamePlaceholder: "Last Name",
    docTypeLabel: "Document Type",
    docPassport: "Passport",
    docTckn: "Turkish ID Card",
    docNationalId: "National ID Card",
    docNumberLabel: "Document Number",
    docNumberPlaceholder: "Passport or ID Number",
    nationalityLabel: "Nationality (ISO 3-Letter)",
    birthDateLabel: "Date of Birth",
    backBtn: "Back",
    savingBtn: "Saving...",
    confirmBtn: "Confirm Identity & Check-in",
    successTitle: "Check-in Completed Successfully!",
    successDesc: "Your details have been securely transmitted to reception. You may collect your room key directly at the front desk.",
    guestLabel: "Guest:",
    roomNoLabel: "Room No:",
    docLabel: "Passport / ID:",
    closeBtn: "Close & Explore Experiences",
    toastScanned: "Passport scanned and details extracted.",
    toastCheckManual: "Image captured. Please review and complete any missing fields.",
    toastScanError: "Could not process image automatically, please fill in manually.",
    toastMissingFields: "Please enter your First Name, Last Name, and Document Number.",
    toastSuccess: "Digital check-in and identity verification confirmed.",
    toastSubmitError: "Could not submit check-in."
  },
  ar: {
    title: "تسجيل الدخول الإلكتروني وتأكيد الهوية",
    kbsBadge: "متوافق مع نظام تسجيل الهوية الرسمي (KBS)",
    kbsDesc: "قم بتصوير جواز السفر أو الهوية بكاميرا هاتفك لإتمام تسجيل الدخول خلال ثوانٍ دون الانتظار في الاستقبال.",
    scanTitle: "تصوير جواز السفر / الهوية بالكاميرا",
    scanSubtitle: "قارئ المستندات الذكي التلقائي OCR",
    scanningBtn: "جاري مسح الجواز...",
    scanBtn: "مسح جواز السفر بالكاميرا",
    orText: "أو",
    manualLink: "انقر هنا لإدخال البيانات يدوياً",
    reviewNotice: "تمت قراءة بيانات الهوية. يرجى المراجعة والتأكيد.",
    retakeBtn: "إعادة التصوير",
    scannedPhotoTitle: "صورة جواز السفر الممسوحة",
    scannedPhotoDesc: "✓ تم استخراج البيانات بنجاح",
    firstNameLabel: "الاسم الأول",
    firstNamePlaceholder: "الاسم الأول",
    lastNameLabel: "اسم العائلة",
    lastNamePlaceholder: "اسم العائلة",
    docTypeLabel: "نوع الوثيقة",
    docPassport: "جواز سفر",
    docTckn: "الهوية التركية",
    docNationalId: "بطاقة الهوية الوطنية",
    docNumberLabel: "رقم الوثيقة",
    docNumberPlaceholder: "رقم جواز السفر أو الهوية",
    nationalityLabel: "الجنسية (رمز من 3 أحرف)",
    birthDateLabel: "تاريخ الميلاد",
    backBtn: "رجوع",
    savingBtn: "جاري الحفظ...",
    confirmBtn: "تأكيد الهوية وتسجيل الدخول",
    successTitle: "تم تسجيل الدخول بنجاح!",
    successDesc: "تم إرسال بياناتك بأمان إلى استقبال الفندق. يمكنك استلام مفتاح غرفتك مباشرة من الاستقبال.",
    guestLabel: "النزيل:",
    roomNoLabel: "رقم الغرفة:",
    docLabel: "جواز السفر / الهوية:",
    closeBtn: "إغلاق واستكشاف التجارب",
    toastScanned: "تم مسح جواز السفر واستخراج البيانات بنجاح.",
    toastCheckManual: "تم استلام الصورة، يرجى مراجعة البيانات وإكمال الحقول.",
    toastScanError: "تعذر معالجة الصورة تلقائياً، يرجى إدخال البيانات يدوياً.",
    toastMissingFields: "يرجى إدخال الاسم الأول واسم العائلة ورقم الوثيقة بالكامل.",
    toastSuccess: "تم تأكيد تسجيل الدخول الإلكتروني والهوية.",
    toastSubmitError: "تعذر إرسال التسجيل."
  },
  ru: {
    title: "Онлайн-регистрация и проверка паспорта",
    kbsBadge: "Официальная система регистрации гостей (KBS)",
    kbsDesc: "Сфотографируйте паспорт или удостоверение личности камерой телефона, чтобы пройти регистрацию за несколько секунд без очереди на ресепшн.",
    scanTitle: "Сфотографируйте паспорт / ID",
    scanSubtitle: "Автоматическое распознавание документов OCR",
    scanningBtn: "Сканирование паспорта...",
    scanBtn: "Сканировать паспорт камерой",
    orText: "или",
    manualLink: "нажмите здесь для ручного ввода",
    reviewNotice: "Данные считаны. Пожалуйста, проверьте и подтвердите.",
    retakeBtn: "Переснять",
    scannedPhotoTitle: "Фото документа",
    scannedPhotoDesc: "✓ Данные успешно распознаны",
    firstNameLabel: "Имя",
    firstNamePlaceholder: "Ваше имя",
    lastNameLabel: "Фамилия",
    lastNamePlaceholder: "Ваша фамилия",
    docTypeLabel: "Тип документа",
    docPassport: "Загранпаспорт",
    docTckn: "Турецкий ID",
    docNationalId: "Национальное удостоверение",
    docNumberLabel: "Номер документа",
    docNumberPlaceholder: "Номер паспорта или ID",
    nationalityLabel: "Гражданство (3 буквы ISO)",
    birthDateLabel: "Дата рождения",
    backBtn: "Назад",
    savingBtn: "Сохранение...",
    confirmBtn: "Подтвердить и зарегистрироваться",
    successTitle: "Регистрация успешно завершена!",
    successDesc: "Ваши данные переданы на ресепшн отеля. Вы можете сразу получить ключ от номера на стойке регистрации.",
    guestLabel: "Гость:",
    roomNoLabel: "Номер комнаты:",
    docLabel: "Паспорт / ID:",
    closeBtn: "Закрыть и перейти к впечатлениям",
    toastScanned: "Паспорт успешно отсканирован.",
    toastCheckManual: "Фото получено, пожалуйста, проверьте и дополните данные.",
    toastScanError: "Не удалось распознать фото автоматически, заполните данные вручную.",
    toastMissingFields: "Пожалуйста, введите имя, фамилию и номер документа.",
    toastSuccess: "Онлайн-регистрация успешно подтверждена.",
    toastSubmitError: "Ошибка отправки данных."
  },
  de: {
    title: "Online Check-in & Ausweisprüfung",
    kbsBadge: "Offizielles Meldesystem (KBS) Konformität",
    kbsDesc: "Scannen Sie Ihren Reisepass oder Personalausweis mit Ihrer Kamera, um den Check-in in Sekunden ohne Wartezeit an der Rezeption abzuschließen.",
    scanTitle: "Reisepass / Ausweis mit Kamera scannen",
    scanSubtitle: "Automatischer OCR-Dokumentenscanner",
    scanningBtn: "Dokument wird gescannt...",
    scanBtn: "Reisepass mit Kamera scannen",
    orText: "oder",
    manualLink: "hier klicken, um Daten manuell einzugeben",
    reviewNotice: "Ihre Ausweisdaten wurden erfasst. Bitte prüfen und bestätigen.",
    retakeBtn: "Neu aufnehmen",
    scannedPhotoTitle: "Gescanntes Dokumentenfoto",
    scannedPhotoDesc: "✓ Text erfolgreich per OCR erkannt",
    firstNameLabel: "Vorname",
    firstNamePlaceholder: "Vorname",
    lastNameLabel: "Nachname",
    lastNamePlaceholder: "Nachname",
    docTypeLabel: "Dokumententyp",
    docPassport: "Reisepass",
    docTckn: "Türkischer Personalausweis",
    docNationalId: "Personalausweis",
    docNumberLabel: "Dokumentennummer",
    docNumberPlaceholder: "Pass- oder Ausweisnummer",
    nationalityLabel: "Staatsangehörigkeit (3-Buchstaben-Code)",
    birthDateLabel: "Geburtsdatum",
    backBtn: "Zurück",
    savingBtn: "Wird gespeichert...",
    confirmBtn: "Ausweis bestätigen & Einchecken",
    successTitle: "Check-in erfolgreich abgeschlossen!",
    successDesc: "Ihre Daten wurden an die Hotelrezeption übermittelt. Sie können Ihren Zimmerschlüssel direkt am Empfang abholen.",
    guestLabel: "Gast:",
    roomNoLabel: "Zimmernr.:",
    docLabel: "Reisepass / Ausweis:",
    closeBtn: "Schließen & Erlebnisse entdecken",
    toastScanned: "Reisepass erfolgreich gescannt.",
    toastCheckManual: "Bild aufgenommen, bitte prüfen und ergänzen Sie die Angaben.",
    toastScanError: "Bild konnte nicht automatisch verarbeitet werden, bitte manuell ausfüllen.",
    toastMissingFields: "Bitte geben Sie Vorname, Nachname und Dokumentennummer ein.",
    toastSuccess: "Digitaler Check-in erfolgreich bestätigt.",
    toastSubmitError: "Registrierung konnte nicht gesendet werden."
  },
  fr: {
    title: "Enregistrement en Ligne & Vérification d'Identité",
    kbsBadge: "Conformité au Système Officiel de Déclaration d'Identité (KBS)",
    kbsDesc: "Scannez votre passeport ou carte d'identité avec votre appareil photo pour vous enregistrer en quelques secondes sans attendre à la réception.",
    scanTitle: "Scanner Passeport / Identité avec la Caméra",
    scanSubtitle: "Lecteur de documents OCR automatisé",
    scanningBtn: "Numérisation en cours...",
    scanBtn: "Scanner le Passeport",
    orText: "ou",
    manualLink: "cliquez ici pour saisir les informations manuellement",
    reviewNotice: "Vos informations d'identité ont été lues. Veuillez vérifier et confirmer.",
    retakeBtn: "Reprendre",
    scannedPhotoTitle: "Photo du document numérisé",
    scannedPhotoDesc: "✓ Texte extrait avec succès via OCR",
    firstNameLabel: "Prénom",
    firstNamePlaceholder: "Votre prénom",
    lastNameLabel: "Nom de famille",
    lastNamePlaceholder: "Votre nom",
    docTypeLabel: "Type de document",
    docPassport: "Passeport",
    docTckn: "Carte d'identité turque",
    docNationalId: "Carte nationale d'identité",
    docNumberLabel: "Numéro de document",
    docNumberPlaceholder: "Numéro de passeport ou d'identité",
    nationalityLabel: "Nationalité (Code 3 lettres)",
    birthDateLabel: "Date de naissance",
    backBtn: "Retour",
    savingBtn: "Enregistrement...",
    confirmBtn: "Confirmer l'identité & S'enregistrer",
    successTitle: "Enregistrement terminé avec succès !",
    successDesc: "Vos informations ont été transmises à la réception. Vous pouvez récupérer votre clé directement à l'accueil.",
    guestLabel: "Client :",
    roomNoLabel: "Chambre N° :",
    docLabel: "Passeport / ID :",
    closeBtn: "Fermer & Explorer les Expériences",
    toastScanned: "Passeport numérisé avec succès.",
    toastCheckManual: "Image reçue, veuillez vérifier et compléter les informations.",
    toastScanError: "Erreur de lecture automatique, veuillez remplir manuellement.",
    toastMissingFields: "Veuillez saisir votre prénom, nom et numéro de document.",
    toastSuccess: "Enregistrement numérique confirmé.",
    toastSubmitError: "Impossible d'envoyer l'enregistrement."
  }
};

export function OnlineCheckinModal({ hotel, roomNumber, lang, onClose }: OnlineCheckinModalProps) {
  const t = getT(lang);
  const ui = CHECKIN_I18N[lang] || CHECKIN_I18N.en;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<'UPLOAD' | 'CAMERA' | 'REVIEW' | 'SUCCESS'>('UPLOAD');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      stopCameraStream();
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

  const compressImageDataUrl = (rawDataUrl: string, maxDimension = 1600): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width || 1200;
          let height = img.height || 900;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            resolve(rawDataUrl);
          }
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });
  };

  const runOcrOnBase64Image = async (base64Image: string, mimeType: string = 'image/jpeg') => {
    setIsProcessingOcr(true);
    try {
      const compressedBase64 = await compressImageDataUrl(base64Image, 1600);
      setPreviewImage(compressedBase64);

      const response = await fetch('/api/kbs/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compressedBase64,
          mimeType: 'image/jpeg'
        })
      });

      const data = await response.json();
      const rec = data.record || data.parsedData;
      if (data.success && rec && (rec.first_name || rec.last_name || rec.document_number)) {
        setFirstName(rec.first_name || '');
        setLastName(rec.last_name || '');
        setDocumentNumber(rec.document_number || '');
        setNationality(rec.nationality || 'TUR');
        setBirthDate(rec.birth_date || '');
        setGender(rec.gender || 'MALE');
        setDocumentType(rec.document_type || 'PASSPORT');

        toast.success(ui.toastScanned);
        setStep('REVIEW');
      } else {
        toast.info(ui.toastCheckManual);
        setStep('REVIEW');
      }
    } catch (error) {
      console.error('OCR Processing Error:', error);
      toast.error(ui.toastScanError);
      setStep('REVIEW');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const startLiveCamera = async (preferredFacing: 'environment' | 'user' = cameraFacing) => {
    stopCameraStream();
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        streamRef.current = stream;
        setCameraFacing(preferredFacing);
        setStep('CAMERA');
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
        return;
      } catch (err) {
        console.warn('Live getUserMedia unavailable or denied, falling back to native camera input:', err);
      }
    }
    // Fallback to native file input if getUserMedia is blocked or unsupported
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCaptureShutter = async () => {
    const video = videoRef.current;
    if (!video) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
      return;
    }

    const rawW = video.videoWidth || 1280;
    const rawH = video.videoHeight || 720;
    const maxDim = 1600;
    let targetW = rawW;
    let targetH = rawH;
    if (targetW > maxDim || targetH > maxDim) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCameraStream();
    setStep('UPLOAD');
    await runOcrOnBase64Image(capturedDataUrl, 'image/jpeg');
  };

  const handleCameraClick = () => {
    startLiveCamera('environment');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Reset value immediately so selecting or shooting another photo always fires onChange
    event.target.value = '';

    stopCameraStream();
    setStep('UPLOAD');
    setIsProcessingOcr(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        await runOcrOnBase64Image(base64Image, file.type || 'image/jpeg');
      };
      reader.onerror = () => {
        toast.error(ui.toastScanError);
        setIsProcessingOcr(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File Reader Error:', error);
      toast.error(ui.toastScanError);
      setStep('REVIEW');
      setIsProcessingOcr(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!firstName || !lastName || !documentNumber) {
      toast.error(ui.toastMissingFields);
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
        try {
          const { FirestoreService } = await import('@/lib/firestore-service');
          await FirestoreService.addRequest({
            hotelId: hotel.id,
            hotelName: hotel.name,
            roomNumber: roomNumber,
            serviceKey: 'kbs_checkin',
            serviceTitle: ui.title,
            notes: `${firstName.toUpperCase()} ${lastName.toUpperCase()} · ${documentType}: ${documentNumber.toUpperCase()} (${nationality})`,
            status: 'pending',
            department: 'Resepsiyon / Ön Büro (KBS)',
            stage: 'pending',
            priority: 'standart',
          });
        } catch {}

        setStep('SUCCESS');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(ui.toastSuccess);
      } else {
        throw new Error(ui.toastSubmitError);
      }
    } catch (err: any) {
      toast.error(err.message || ui.toastSubmitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const captureBtnLabel =
    lang === 'tr'
      ? 'Fotoğrafı Çek ve Oku'
      : lang === 'ar'
      ? 'التقاط الصورة والمسح'
      : lang === 'ru'
      ? 'Сделать фото и сканировать'
      : lang === 'de'
      ? 'Foto aufnehmen & scannen'
      : lang === 'fr'
      ? 'Prendre la photo & scanner'
      : 'Take Photo & Scan';

  const galleryBtnLabel =
    lang === 'tr'
      ? 'Galeriden / Telefon Kamerasından Seç'
      : lang === 'ar'
      ? 'اختر من المعرض / كاميرا الهاتف'
      : lang === 'ru'
      ? 'Выбрать из галереи / камеры'
      : lang === 'de'
      ? 'Aus Galerie / Telefonkamera wählen'
      : lang === 'fr'
      ? 'Choisir depuis la galerie / appareil'
      : 'Choose from Gallery / Phone Camera';

  const alignHintLabel =
    lang === 'tr'
      ? 'Kimlik veya Pasaportunuzu Çerçeveye Hizalayın'
      : lang === 'ar'
      ? 'قم بمحاذاة الهوية أو جواز السفر داخل الإطار'
      : lang === 'ru'
      ? 'Поместите паспорт или ID в рамку'
      : lang === 'de'
      ? 'Ausweis oder Reisepass im Rahmen ausrichten'
      : lang === 'fr'
      ? 'Alignez votre pièce d’identité dans le cadre'
      : 'Align your ID Card or Passport inside the frame';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCameraStream();
          onClose();
        }
      }}
    >
      <div 
        className="luxury-service-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Gizli Kamera / Dosya Seçici Inputlar */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileChange} 
        />
        <input 
          type="file" 
          ref={galleryInputRef} 
          accept="image/*" 
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
                {ui.title}
              </h2>
              <p className="font-luxury-sans text-[11px] text-[#5C4938]">
                {hotel.name} • {t.room} {roomNumber}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-luxury-sans text-xs">

          {step === 'CAMERA' && (
            <div className="space-y-3.5 text-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-[#C5A059] shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => setIsCameraReady(true)}
                  className="w-full h-full object-cover"
                />
                {/* Kimlik / Pasaport Hizalama Çerçevesi */}
                <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-[#E6C786]/90 rounded-xl flex flex-col justify-between p-2.5">
                  <div className="mx-auto px-3 py-1 rounded-full bg-black/65 text-[#FAF8F4] text-[10px] font-bold tracking-wide">
                    {alignHintLabel}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#E6C786]/90 uppercase">
                    <span>T.C. KİMLİK / PASSPORT</span>
                    <span>MRZ / OCR</span>
                  </div>
                </div>
              </div>

              {/* Deklanşör (Fotoğraf Çekme Tuşu) ve Kamera Kontrolleri */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setStep('UPLOAD');
                  }}
                  className="px-3.5 py-3 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition cursor-pointer"
                >
                  {ui.backBtn}
                </button>

                <button
                  type="button"
                  onClick={handleCaptureShutter}
                  disabled={isProcessingOcr}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] active:scale-[0.98] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{captureBtnLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => startLiveCamera(cameraFacing === 'environment' ? 'user' : 'environment')}
                  title="Kamerayı Çevir"
                  className="px-3.5 py-3 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (galleryInputRef.current) {
                    galleryInputRef.current.value = '';
                    galleryInputRef.current.click();
                  }
                }}
                className="text-[11px] text-[#7D5E2A] font-bold underline hover:text-[#141414] cursor-pointer"
              >
                {galleryBtnLabel}
              </button>
            </div>
          )}

          {step === 'UPLOAD' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-[#FAF8F4]/90 border border-[#C4B8A4] text-left space-y-1.5">
                <div className="flex items-center gap-2 text-[#7D5E2A] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#8E7252]" />
                  <span>{ui.kbsBadge}</span>
                </div>
                <p className="text-[11px] text-[#3D352E] leading-relaxed">
                  {ui.kbsDesc}
                </p>
              </div>

              {/* Upload & Scan Actions */}
              <div className="p-6 border-2 border-dashed border-[#C4B8A4] rounded-2xl bg-[#FAF8F4]/70 flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#C4B8A4] text-[#8E7252] flex items-center justify-center shadow-xs">
                  {isProcessingOcr ? (
                    <Loader2 className="w-7 h-7 stroke-[1.6] animate-spin" />
                  ) : (
                    <Camera className="w-7 h-7 stroke-[1.6]" />
                  )}
                </div>
                <div>
                  <strong className="font-luxury-serif text-sm font-bold text-[#141414] block">{ui.scanTitle}</strong>
                  <span className="text-[10px] text-[#5C4938]">{ui.scanSubtitle}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full pt-1">
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    disabled={isProcessingOcr}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingOcr ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{ui.scanningBtn}</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>{ui.scanBtn}</span>
                      </>
                    )}
                  </button>

                  {!isProcessingOcr && (
                    <button
                      type="button"
                      onClick={() => {
                        if (galleryInputRef.current) {
                          galleryInputRef.current.value = '';
                          galleryInputRef.current.click();
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#5C4938] font-bold text-xs transition cursor-pointer"
                    >
                      {galleryBtnLabel}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-[#5C4938]">
                {ui.orText}{' '}
                <button
                  onClick={() => setStep('REVIEW')}
                  className="text-[#7D5E2A] font-bold underline hover:text-[#141414] cursor-pointer"
                >
                  {ui.manualLink}
                </button>
              </div>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-[#FAF8F4] rounded-2xl border border-[#C4B8A4] text-[#141414] text-[11px] flex items-center justify-between font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8E7252] shrink-0" />
                  <span>{ui.reviewNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="text-[10px] text-[#7D5E2A] font-bold underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> {ui.retakeBtn}
                </button>
              </div>

              {previewImage && (
                <div className="p-2 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] flex items-center gap-3">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-[#EFE8DA] relative shrink-0 border border-[#C4B8A4]">
                    <img 
                      src={previewImage} 
                      alt={ui.scannedPhotoTitle} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-[#5C4938] min-w-0">
                    <strong className="text-[#141414] block truncate">{ui.scannedPhotoTitle}</strong>
                    <span className="text-[10px] text-[#7D5E2A] block font-semibold">{ui.scannedPhotoDesc}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ui.firstNameLabel}</label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder={ui.firstNamePlaceholder}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-[16px] sm:text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ui.lastNameLabel}</label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder={ui.lastNamePlaceholder}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-[16px] sm:text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ui.docTypeLabel}</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-[16px] sm:text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  >
                    <option value="PASSPORT">{ui.docPassport}</option>
                    <option value="TCKN">{ui.docTckn}</option>
                    <option value="NATIONAL_ID">{ui.docNationalId}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ui.docNumberLabel}</label>
                  <input
                    type="text"
                    value={documentNumber}
                    placeholder={ui.docNumberPlaceholder}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-mono font-bold text-[#141414] text-[16px] sm:text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ui.nationalityLabel}</label>
                  <input
                    type="text"
                    value={nationality}
                    placeholder="TUR, DEU, USA..."
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-[16px] sm:text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5C4938] block mb-1">{ui.birthDateLabel}</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#C4B8A4] rounded-xl font-bold text-[#141414] text-[16px] sm:text-xs focus:ring-2 focus:ring-[#8E7252]/40 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('UPLOAD')}
                  className="w-1/3 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-[#141414] font-bold text-xs transition cursor-pointer"
                >
                  {ui.backBtn}
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
                      <span>{ui.savingBtn}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{ui.confirmBtn}</span>
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
                <h3 className="font-luxury-serif text-lg font-bold text-[#141414]">{ui.successTitle}</h3>
                <p className="text-xs text-[#5C4938] mt-1">
                  {ui.successDesc}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#C4B8A4] text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ui.guestLabel}</span>
                  <strong className="text-[#141414]">{firstName} {lastName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ui.roomNoLabel}</span>
                  <strong className="text-[#141414]">{roomNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4938]">{ui.docLabel}</span>
                  <strong className="text-[#7D5E2A] font-mono">{documentNumber}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                {ui.closeBtn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


