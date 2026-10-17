"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Building2, 
  ArrowRight, 
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { XeniosStore } from '@/lib/store';
import { XeniosUser, Language } from '@/lib/types';
import { detectBrowserLanguage } from '@/lib/i18n';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'guest' | 'hotel';
  lang?: Language;
}

const AUTH_I18N: Record<Language, {
  missingEmailPass: string;
  hotelManagerDefault: string;
  hotelLoginSuccess: string;
  hotelLoginRedirect: string;
  welcomeUser: (name: string) => string;
  accountCreated: string;
  loginHeading: string;
  registerHeading: string;
  loginSub: string;
  registerSub: string;
  loginTab: string;
  registerTab: string;
  guestLoginTitle: string;
  guestLoginDesc: string;
  hotelStaffTitle: string;
  hotelStaffDesc: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  phoneLabel: string;
  hotelCodeLabel: string;
  hotelCodePlaceholder: string;
  emailLabel: string;
  guestEmailPlaceholder: string;
  passwordLabel: string;
  rememberMe: string;
  hotelLoginBtn: string;
  loginBtn: string;
  createAccountBtn: string;
  footerSsl: string;
}> = {
  tr: {
    missingEmailPass: 'Lütfen e-posta ve şifrenizi giriniz.',
    hotelManagerDefault: 'Otel Yöneticisi',
    hotelLoginSuccess: 'Otel Yönetim Paneline Giriş Başarılı!',
    hotelLoginRedirect: 'Otel Yönetim Paneline yönlendiriliyorsunuz...',
    welcomeUser: (name) => `Hoş geldiniz ${name}!`,
    accountCreated: 'Hesabınız başarıyla oluşturuldu! Hoş geldiniz.',
    loginHeading: 'Hesabınıza Giriş Yapın',
    registerHeading: 'Yeni Hesap Oluşturun',
    loginSub: 'Oda hizmetleri, rezervasyonlarınız ve otel personeli için giriş yapın.',
    registerSub: 'İstanbul misafir ayrıcalıklarından ve hızlı rezervasyondan yararlanın.',
    loginTab: 'Giriş Yap',
    registerTab: 'Kayıt Ol',
    guestLoginTitle: 'Misafir Girişi',
    guestLoginDesc: 'Otel & Şehir Hizmetleri',
    hotelStaffTitle: 'Otel Personeli',
    hotelStaffDesc: 'Oda & Talep Yönetimi',
    fullNameLabel: 'Ad Soyad',
    fullNamePlaceholder: 'Örn: Mehmet Özkan',
    phoneLabel: 'Telefon Numarası',
    hotelCodeLabel: 'Otel / Tesis Kodu',
    hotelCodePlaceholder: 'Örn: FATIH-HERITAGE-01',
    emailLabel: 'E-Posta Adresi',
    guestEmailPlaceholder: 'misafir@gmail.com',
    passwordLabel: 'Şifre',
    rememberMe: 'Beni Hatırla',
    hotelLoginBtn: 'Otel Paneline Giriş Yap',
    loginBtn: 'Giriş Yap',
    createAccountBtn: 'Hesabı Oluştur',
    footerSsl: 'purelyİstanbul 256-Bit SSL şifreleme ve KVKK güvencesiyle korunmaktadır.'
  },
  en: {
    missingEmailPass: 'Please enter your email and password.',
    hotelManagerDefault: 'Hotel Manager',
    hotelLoginSuccess: 'Hotel Management Portal Login Successful!',
    hotelLoginRedirect: 'Redirecting to Hotel Management Portal...',
    welcomeUser: (name) => `Welcome ${name}!`,
    accountCreated: 'Your account has been created! Welcome.',
    loginHeading: 'Sign In to Your Account',
    registerHeading: 'Create a New Account',
    loginSub: 'Sign in for in-room services, reservations, and hotel staff access.',
    registerSub: 'Enjoy Istanbul guest privileges and instant booking.',
    loginTab: 'Sign In',
    registerTab: 'Register',
    guestLoginTitle: 'Guest Sign In',
    guestLoginDesc: 'Hotel & City Services',
    hotelStaffTitle: 'Hotel Staff',
    hotelStaffDesc: 'Room & Request Management',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g., Alex Mercer',
    phoneLabel: 'Phone Number',
    hotelCodeLabel: 'Hotel / Property Code',
    hotelCodePlaceholder: 'e.g., FATIH-HERITAGE-01',
    emailLabel: 'E-Mail Address',
    guestEmailPlaceholder: 'guest@gmail.com',
    passwordLabel: 'Password',
    rememberMe: 'Remember Me',
    hotelLoginBtn: 'Sign In to Hotel Portal',
    loginBtn: 'Sign In',
    createAccountBtn: 'Create Account',
    footerSsl: 'Protected by purelyIstanbul 256-Bit SSL encryption and data privacy compliance.'
  },
  ar: {
    missingEmailPass: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.',
    hotelManagerDefault: 'مدير الفندق',
    hotelLoginSuccess: 'تم تسجيل الدخول إلى لوحة إدارة الفندق بنجاح!',
    hotelLoginRedirect: 'جارٍ التوجيه إلى لوحة إدارة الفندق...',
    welcomeUser: (name) => `أهلاً بك ${name}!`,
    accountCreated: 'تم إنشاء حسابك بنجاح! أهلاً بك.',
    loginHeading: 'تسجيل الدخول إلى حسابك',
    registerHeading: 'إنشاء حساب جديد',
    loginSub: 'سجّل الدخول لخدمات الغرف والحجوزات وموظفي الفندق.',
    registerSub: 'استفد من مزايا ضيوف إسطنبول والحجز السريع.',
    loginTab: 'تسجيل الدخول',
    registerTab: 'إنشاء حساب',
    guestLoginTitle: 'دخول الضيف',
    guestLoginDesc: 'خدمات الفندق والمدينة',
    hotelStaffTitle: 'موظفو الفندق',
    hotelStaffDesc: 'إدارة الغرف والطلبات',
    fullNameLabel: 'الاسم الكامل',
    fullNamePlaceholder: 'مثال: Alex Mercer',
    phoneLabel: 'رقم الهاتف',
    hotelCodeLabel: 'رمز الفندق / المنشأة',
    hotelCodePlaceholder: 'مثال: FATIH-HERITAGE-01',
    emailLabel: 'البريد الإلكتروني',
    guestEmailPlaceholder: 'guest@gmail.com',
    passwordLabel: 'كلمة المرور',
    rememberMe: 'تذكرني',
    hotelLoginBtn: 'الدخول إلى لوحة الفندق',
    loginBtn: 'تسجيل الدخول',
    createAccountBtn: 'إنشاء الحساب',
    footerSsl: 'محمي بتشفير SSL 256-Bit ومعايير حماية البيانات من purelyİstanbul.'
  },
  ru: {
    missingEmailPass: 'Пожалуйста, введите ваш e-mail и пароль.',
    hotelManagerDefault: 'Менеджер отеля',
    hotelLoginSuccess: 'Вход в панель управления отелем выполнен!',
    hotelLoginRedirect: 'Перенаправление в панель управления отелем...',
    welcomeUser: (name) => `Добро пожаловать, ${name}!`,
    accountCreated: 'Ваш аккаунт успешно создан! Добро пожаловать.',
    loginHeading: 'Войдите в свой аккаунт',
    registerHeading: 'Создать новый аккаунт',
    loginSub: 'Войдите для доступа к услугам в номере, бронированиям и панели персонала.',
    registerSub: 'Пользуйтесь привилегиями гостей Стамбула и быстрым бронированием.',
    loginTab: 'Войти',
    registerTab: 'Регистрация',
    guestLoginTitle: 'Вход для гостей',
    guestLoginDesc: 'Услуги отеля и города',
    hotelStaffTitle: 'Персонал отеля',
    hotelStaffDesc: 'Управление номерами и заявками',
    fullNameLabel: 'Имя и фамилия',
    fullNamePlaceholder: 'Напр.: Alex Mercer',
    phoneLabel: 'Номер телефона',
    hotelCodeLabel: 'Код отеля / объекта',
    hotelCodePlaceholder: 'Напр.: FATIH-HERITAGE-01',
    emailLabel: 'Адрес эл. почты',
    guestEmailPlaceholder: 'guest@gmail.com',
    passwordLabel: 'Пароль',
    rememberMe: 'Запомнить меня',
    hotelLoginBtn: 'Войти в панель отеля',
    loginBtn: 'Войти',
    createAccountBtn: 'Создать аккаунт',
    footerSsl: 'Защищено 256-битным SSL-шифрованием и политикой конфиденциальности purelyİstanbul.'
  },
  de: {
    missingEmailPass: 'Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.',
    hotelManagerDefault: 'Hotelmanager',
    hotelLoginSuccess: 'Anmeldung im Hotel-Management-Portal erfolgreich!',
    hotelLoginRedirect: 'Weiterleitung zum Hotel-Management-Portal...',
    welcomeUser: (name) => `Willkommen ${name}!`,
    accountCreated: 'Ihr Konto wurde erfolgreich erstellt! Willkommen.',
    loginHeading: 'Melden Sie sich an',
    registerHeading: 'Neues Konto erstellen',
    loginSub: 'Melden Sie sich für Zimmerservice, Reservierungen und Hotelpersonal an.',
    registerSub: 'Genießen Sie Istanbul-Gästeprivilegien und schnelle Buchungen.',
    loginTab: 'Anmelden',
    registerTab: 'Registrieren',
    guestLoginTitle: 'Gäste-Login',
    guestLoginDesc: 'Hotel- & Stadtservices',
    hotelStaffTitle: 'Hotelpersonal',
    hotelStaffDesc: 'Zimmer- & Anfragenverwaltung',
    fullNameLabel: 'Vollständiger Name',
    fullNamePlaceholder: 'z. B. Alex Mercer',
    phoneLabel: 'Telefonnummer',
    hotelCodeLabel: 'Hotel- / Objektcode',
    hotelCodePlaceholder: 'z. B. FATIH-HERITAGE-01',
    emailLabel: 'E-Mail-Adresse',
    guestEmailPlaceholder: 'guest@gmail.com',
    passwordLabel: 'Passwort',
    rememberMe: 'Angemeldet bleiben',
    hotelLoginBtn: 'Im Hotelportal anmelden',
    loginBtn: 'Anmelden',
    createAccountBtn: 'Konto erstellen',
    footerSsl: 'Geschützt durch 256-Bit-SSL-Verschlüsselung und Datenschutzrichtlinien von purelyİstanbul.'
  },
  fr: {
    missingEmailPass: 'Veuillez saisir votre adresse e-mail et votre mot de passe.',
    hotelManagerDefault: 'Directeur d’hôtel',
    hotelLoginSuccess: 'Connexion au portail hôtelier réussie !',
    hotelLoginRedirect: 'Redirection vers le portail de gestion hôtelière...',
    welcomeUser: (name) => `Bienvenue ${name} !`,
    accountCreated: 'Votre compte a été créé avec succès ! Bienvenue.',
    loginHeading: 'Connectez-vous à votre compte',
    registerHeading: 'Créer un nouveau compte',
    loginSub: 'Connectez-vous pour les services en chambre, vos réservations et l’accès personnel.',
    registerSub: 'Profitez des privilèges clients à Istanbul et de la réservation rapide.',
    loginTab: 'Connexion',
    registerTab: 'S’inscrire',
    guestLoginTitle: 'Accès Client',
    guestLoginDesc: 'Services Hôtel & Ville',
    hotelStaffTitle: 'Personnel Hôtelier',
    hotelStaffDesc: 'Gestion Chambres & Demandes',
    fullNameLabel: 'Nom complet',
    fullNamePlaceholder: 'Ex. : Alex Mercer',
    phoneLabel: 'Numéro de téléphone',
    hotelCodeLabel: 'Code Hôtel / Établissement',
    hotelCodePlaceholder: 'Ex. : FATIH-HERITAGE-01',
    emailLabel: 'Adresse e-mail',
    guestEmailPlaceholder: 'guest@gmail.com',
    passwordLabel: 'Mot de passe',
    rememberMe: 'Se souvenir de moi',
    hotelLoginBtn: 'Accéder au portail hôtelier',
    loginBtn: 'Se connecter',
    createAccountBtn: 'Créer le compte',
    footerSsl: 'Protégé par le chiffrement SSL 256 bits et la confidentialité des données purelyİstanbul.'
  }
};

export function AuthModal({ isOpen, onClose, defaultRole = 'guest', lang: propLang }: AuthModalProps) {
  const [detectedLang, setDetectedLang] = useState<Language>(() => propLang || detectBrowserLanguage());
  const activeLang = propLang || detectedLang;
  const a = AUTH_I18N[activeLang] || AUTH_I18N.en;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'guest' | 'hotel'>(defaultRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hotelCode, setHotelCode] = useState('FATIH-HERITAGE-01');
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (!propLang) {
      setDetectedLang(detectBrowserLanguage());
    }
  }, [propLang, isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
      return () => {
        window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const isRemembered = localStorage.getItem('xenios_remember_me') === 'true' || localStorage.getItem('xenios_hotel_remember_me') === 'true';
      if (localStorage.getItem('xenios_remember_me') !== null || localStorage.getItem('xenios_hotel_remember_me') !== null) {
        setRememberMe(isRemembered);
      }
      const savedUser = localStorage.getItem('xenios_hotel_saved_user') || localStorage.getItem('xenios_saved_email');
      const savedPass = localStorage.getItem('xenios_hotel_saved_pass') || localStorage.getItem('xenios_saved_pass');
      if (savedUser) setEmail(savedUser);
      if (savedPass) setPassword(savedPass);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(a.missingEmailPass);
      return;
    }

    const inputEmail = email.trim().toLowerCase();
    const userName = name.trim() || (role === 'hotel' ? a.hotelManagerDefault : email.split('@')[0]);
    
    const user: XeniosUser = {
      id: 'usr_' + Date.now(),
      name: userName,
      email: inputEmail,
      role: role,
      hotelCode: role === 'hotel' ? hotelCode : undefined,
      hotelName: role === 'hotel' ? 'Old City Heritage Hotel' : undefined,
      phone: phone || undefined,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=b45309`,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    XeniosStore.setUser(user);

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem('xenios_remember_me', 'true');
        localStorage.setItem('xenios_saved_email', inputEmail);
        localStorage.setItem('xenios_saved_pass', password);
        if (role === 'hotel') {
          localStorage.setItem('xenios_hotel_remember_me', 'true');
          localStorage.setItem('xenios_hotel_saved_user', inputEmail);
          localStorage.setItem('xenios_hotel_saved_pass', password);
          localStorage.setItem('xenios_app_role', 'hotel');
        }
      } else {
        localStorage.removeItem('xenios_remember_me');
        localStorage.removeItem('xenios_saved_email');
        localStorage.removeItem('xenios_saved_pass');
        if (role === 'hotel') {
          localStorage.removeItem('xenios_hotel_remember_me');
          localStorage.removeItem('xenios_hotel_saved_user');
          localStorage.removeItem('xenios_hotel_saved_pass');
        }
      }
    }

    if (mode === 'login') {
      if (role === 'hotel') {
        XeniosStore.setHotelPortalLoggedIn(true);
        toast.success(a.hotelLoginSuccess, {
          description: a.hotelLoginRedirect
        });
        setTimeout(() => {
          onClose();
          window.location.href = '/hotel-portal';
        }, 350);
      } else {
        toast.success(a.welcomeUser(user.name));
        setTimeout(() => onClose(), 350);
      }
    } else {
      toast.success(a.accountCreated);
      if (role === 'hotel') {
        XeniosStore.setHotelPortalLoggedIn(true);
      }
      setTimeout(() => {
        onClose();
        if (role === 'hotel') {
          window.location.href = '/hotel-portal';
        }
      }, 350);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white   rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in zoom-in-95 relative text-slate-900  flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-slate-600  transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl overflow-hidden shadow-sm border border-amber-200 p-0.5 bg-white  ">
            <Image
              src="/logo.png"
              alt="purelyİstanbul"
              width={48}
              height={48}
              className="object-contain w-full h-full rounded-xl"
            />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 block">
            purelyİstanbul
          </span>
          <h2 className="text-xl font-bold font-serif text-slate-900 ">
            {mode === 'login' ? a.loginHeading : a.registerHeading}
          </h2>
          <p className="text-xs text-slate-500 ">
            {mode === 'login' ? a.loginSub : a.registerSub}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-2xl bg-zinc-100 p-1 mb-4 border border-zinc-200">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white   text-slate-900  shadow-sm'
                : 'text-slate-500  hover:text-slate-800 '
            }`}
          >
            {a.loginTab}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white   text-slate-900  shadow-sm'
                : 'text-slate-500  hover:text-slate-800 '
            }`}
          >
            {a.registerTab}
          </button>
        </div>

        {/* Role Switcher in Login Mode */}
        {mode === 'login' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                role === 'guest'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/40 text-amber-950'
                  : 'bg-white   border-zinc-200 text-slate-600  hover:border-zinc-300'
              }`}
            >
              <User className={`w-4 h-4 mb-1 ${role === 'guest' ? 'text-amber-700' : 'text-zinc-400'}`} />
              <div>
                <strong className="text-xs block font-bold">{a.guestLoginTitle}</strong>
                <span className="text-[10px] text-slate-500  block">{a.guestLoginDesc}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('hotel')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                role === 'hotel'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-400 text-amber-950'
                  : 'bg-white   border-zinc-200 text-slate-600  hover:border-zinc-300'
              }`}
            >
              <Building2 className={`w-4 h-4 mb-1 ${role === 'hotel' ? 'text-amber-700' : 'text-zinc-400'}`} />
              <div>
                <strong className="text-xs block font-bold">{a.hotelStaffTitle}</strong>
                <span className="text-[10px] text-slate-500  block">{a.hotelStaffDesc}</span>
              </div>
            </button>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{a.fullNameLabel}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={a.fullNamePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{a.phoneLabel}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && role === 'hotel' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">{a.hotelCodeLabel}</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={hotelCode}
                  onChange={(e) => setHotelCode(e.target.value)}
                  placeholder={a.hotelCodePlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono font-bold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">{a.emailLabel}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'hotel' ? "hotel@xenios.istanbul" : a.guestEmailPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">{a.passwordLabel}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">{a.rememberMe}</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2 bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
          >
            <span>{mode === 'login' ? (role === 'hotel' ? a.hotelLoginBtn : a.loginBtn) : a.createAccountBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-zinc-100 text-center">
          <p className="text-[10px] text-zinc-400">
            {a.footerSsl}
          </p>
        </div>
      </div>
    </div>
  );
}

