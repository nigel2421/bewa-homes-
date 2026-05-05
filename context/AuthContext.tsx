'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithPopup,
  getRedirectResult,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const ADMIN_EMAILS = [
  'wamaithamukuru32@gmail.com',
  'bttykinjo@gmail.com',
  'wamaitha@bewa.co.ke',
  'betty@bewa.co.ke'
];
const SUPER_ADMIN_EMAILS = [
  'nigel2421@gmail.com'
];
const EMAIL_KEY = 'Bewa Homes_email_for_signin';
const ACTIVITY_COOKIE = 'bewa_last_activity';
const UID_COOKIE = 'bewa_uid';
const INACTIVITY_LIMIT = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

const setActivityCookie = (uid?: string) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 2); // 2 days from now
  document.cookie = `${ACTIVITY_COOKIE}=${Date.now()}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  if (uid) {
    document.cookie = `${UID_COOKIE}=${uid}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
};

const getActivityCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + ACTIVITY_COOKIE + '=([^;]+)'));
  return match ? match[2] : null;
};

const clearActivityCookies = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACTIVITY_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${UID_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'guest' | 'host' | 'admin' | 'super admin' | 'unit owner';
  tenantId?: string;
  businessName?: string;
  phoneNumber?: string;
  selectedTenantId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSelectedTenantId: (id: string | undefined) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildLocalProfile(firebaseUser: FirebaseUser, role?: UserProfile['role']): UserProfile {
  let assignedRole: UserProfile['role'] = role ?? 'guest';
  
  if (!role && firebaseUser.email) {
    if (SUPER_ADMIN_EMAILS.includes(firebaseUser.email)) {
      assignedRole = 'super admin';
    } else if (ADMIN_EMAILS.includes(firebaseUser.email)) {
      assignedRole = 'admin';
    }
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
    photoURL: firebaseUser.photoURL,
    role: assignedRole,
  };
}

async function syncWithFirestore(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const isSuperAdmin = !!firebaseUser.email && SUPER_ADMIN_EMAILS.includes(firebaseUser.email);
  const isAdmin = !!firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email);
  
  try {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      let needsUpdate = false;
      let updatedRole = data.role;

      // Force Super Admin if in the list
      if (isSuperAdmin && data.role !== 'super admin') {
        updatedRole = 'super admin';
        needsUpdate = true;
      } 
      // Force Admin if in the list and not already super admin
      else if (isAdmin && data.role !== 'admin' && data.role !== 'super admin') {
        updatedRole = 'admin';
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updated = { ...data, role: updatedRole };
        await setDoc(ref, updated, { merge: true });
        return updated;
      }
      return data;
    }
    const profile = buildLocalProfile(firebaseUser);
    await setDoc(ref, profile, { merge: true });
    return profile;
  } catch {
    return buildLocalProfile(firebaseUser);
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const setSelectedTenantId = (id: string | undefined) => {
    setUser(prev => {
      if (!prev) return null;
      if (prev.role !== 'admin' && prev.role !== 'super admin') return prev;
      
      const updated = { ...prev, selectedTenantId: id };
      if (id) {
        localStorage.setItem('selectedTenantId', id);
      } else {
        localStorage.removeItem('selectedTenantId');
      }
      return updated;
    });
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    // Fail-safe timeout to prevent indefinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth initialization safety timeout reached');
        setLoading(false);
      }
    }, 12000);

    const init = async () => {
      // 1. Handle Email-link sign-in
      if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem(EMAIL_KEY);
        if (!email) email = window.prompt('Please provide your email for confirmation');
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem(EMAIL_KEY);
          } catch (err: any) {
            console.error('Email link error:', err);
            if (isMounted) setError(err.message);
          }
        }
      }

      // 2. Handle Redirect Results
      try {
        await getRedirectResult(auth);
      } catch (err: any) {
        console.error('Redirect error:', err);
        if (isMounted) setError(err.message);
      }

      // 3. Subscribe to Auth State
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        try {
          if (firebaseUser) {
            const profile = await syncWithFirestore(firebaseUser);
            if (isMounted) {
              // Restore impersonated tenant for admins
              if (profile.role === 'admin' || profile.role === 'super admin') {
                const savedTenantId = localStorage.getItem('selectedTenantId');
                if (savedTenantId) {
                  profile.selectedTenantId = savedTenantId;
                }
              }
              setUser(profile);
              if (window.location.pathname === '/login') {
                router.push('/dashboard');
              }
            }
          } else {
            if (isMounted) {
              setUser(null);
              localStorage.removeItem('selectedTenantId');
            }
          }
        } catch (err: any) {
          console.error('Auth sync error:', err);
          if (isMounted) {
            setError(err.message);
            if (firebaseUser) setUser(buildLocalProfile(firebaseUser));
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            clearTimeout(timeoutId);
          }
        }
      });
    };

    init();

    return () => {
      isMounted = false;
      unsubscribe?.();
      clearTimeout(timeoutId);
    };
  }, [router]);

  // 4. Inactivity Tracking
  useEffect(() => {
    if (!user) return;

    // Check for inactivity on mount/user change
    const checkInactivity = () => {
      const lastActivity = getActivityCookie();
      if (lastActivity && Date.now() - Number(lastActivity) > INACTIVITY_LIMIT) {
        console.log('Session expired due to inactivity (2 days)');
        logout();
        return true;
      }
      return false;
    };

    if (checkInactivity()) return;

    // If no record but user is here, set initial activity
    if (!getActivityCookie()) {
      setActivityCookie(user.uid);
    }

    let lastUpdate = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Throttle cookie updates to once every minute to reduce overhead
      if (now - lastUpdate > 60000) {
        setActivityCookie();
        lastUpdate = now;
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    // Periodic check every 5 minutes while active
    const checkInterval = setInterval(checkInactivity, 5 * 60 * 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(checkInterval);
    };
  }, [user]);

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncWithFirestore(result.user);
      setActivityCookie(result.user.uid); // Initialize activity on login
      setUser(profile);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendEmailLink = async (email: string) => {
    // Use the production domain if we're on localhost so the link still works
    // Firebase requires the redirect URL to be listed in Authorized Domains in the console
    const origin = window.location.hostname === 'localhost'
      ? 'https://bewa.co.ke'
      : window.location.origin;
    const actionCodeSettings = {
      url: `${origin}/dashboard`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem(EMAIL_KEY, email);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      clearActivityCookies();
      localStorage.removeItem('selectedTenantId');
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const profile = await syncWithFirestore(auth.currentUser);
      setUser(prev => ({ ...profile, selectedTenantId: prev?.selectedTenantId }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, sendEmailLink, logout, refreshUser, setSelectedTenantId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
