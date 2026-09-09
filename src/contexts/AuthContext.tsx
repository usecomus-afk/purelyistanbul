"use client";

/**
 * Purely Istanbul Marketplace — gerçek Firebase Authentication context'i.
 *
 * Mevcut uygulamadaki `XeniosStore` tabanlı sahte/localStorage oturumundan
 * BAĞIMSIZDIR ve onu değiştirmez; sadece yeni marketplace modülü bu context'i
 * kullanır. `src/lib/firebase.ts`'teki tekil auth/db örneğini kullanır.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  ensureUserProfile,
  recordLegalConsent,
  submitHostApplication,
  switchActiveRole,
  touchLastActive,
  watchOwnHostApplication,
  watchUserProfile
} from '@/lib/marketplace/firestore';
import type { HostApplication, UserProfile } from '@/lib/marketplace/types';

export interface RequiredConsents {
  userAgreementVersion: string;
  privacyPolicyVersion: string;
  distanceSalesAgreementVersion: string;
  preInfoFormVersion: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  hostApplication: HostApplication | null;
  loading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    consents: RequiredConsents;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Misafir -> host geçişi: rol hemen açılmaz, başvuru admin onayına düşer. */
  requestHostMode: (params: {
    applicantName: string;
    applicantPhone?: string;
    businessType: 'individual' | 'company';
    taxId?: string;
    about: string;
  }) => Promise<void>;
  /** Sadece roles.host === true olduğunda 'host' seçilebilir. */
  setActiveRole: (role: 'guest' | 'host') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hostApplication, setHostApplication] = useState<HostApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setHostApplication(null);
      return;
    }
    const unsubProfile = watchUserProfile(user.uid, setProfile);
    const unsubApp = watchOwnHostApplication(user.uid, setHostApplication);
    touchLastActive(user.uid).catch(() => {});
    return () => {
      unsubProfile();
      unsubApp();
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      hostApplication,
      loading,
      async signUp({ email, password, displayName, phone, consents }) {
        if (!auth) throw new Error('Firebase Authentication yapılandırılmamış.');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await ensureUserProfile({ uid: cred.user.uid, email, displayName, phone });
        await recordLegalConsent({
          uid: cred.user.uid,
          context: 'registration',
          documents: consents
        });
      },
      async signIn(email, password) {
        if (!auth) throw new Error('Firebase Authentication yapılandırılmamış.');
        await signInWithEmailAndPassword(auth, email, password);
      },
      async logout() {
        if (!auth) return;
        await signOut(auth);
      },
      async resetPassword(email) {
        if (!auth) throw new Error('Firebase Authentication yapılandırılmamış.');
        await sendPasswordResetEmail(auth, email);
      },
      async requestHostMode(params) {
        if (!user || !profile) throw new Error('Önce giriş yapmalısınız.');
        await submitHostApplication({
          uid: user.uid,
          applicantName: params.applicantName,
          applicantEmail: profile.email,
          applicantPhone: params.applicantPhone,
          businessType: params.businessType,
          taxId: params.taxId,
          about: params.about
        });
      },
      async setActiveRole(role) {
        if (!user || !profile) throw new Error('Önce giriş yapmalısınız.');
        if (role === 'host' && !profile.roles.host) {
          throw new Error('Host modu için başvurunuzun admin tarafından onaylanması gerekiyor.');
        }
        await switchActiveRole(user.uid, role);
      }
    }),
    [user, profile, hostApplication, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return ctx;
}
