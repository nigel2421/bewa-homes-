'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';

export default function GoogleOneTap() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If the user is already logged in or still loading, do nothing
    if (loading || user) return;

    // Check if the Google script is loaded
    const checkScript = setInterval(() => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        setIsReady(true);
        clearInterval(checkScript);
      }
    }, 100);

    return () => clearInterval(checkScript);
  }, [loading, user]);

  useEffect(() => {
    if (!isReady || user) return;

    const google = (window as any).google;
    if (!google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google One Tap: Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables.");
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_prompt: true, // Opt-in to FedCM for better browser compatibility
        callback: async (response: any) => {
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
          } catch (error) {
            console.error("Error signing in with Google One Tap", error);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      // Add a slight delay before prompting, so the UI loads first
      setTimeout(() => {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log("One Tap is not displayed:", notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.log("One Tap was skipped by the user.");
          } else if (notification.isDismissedMoment()) {
            console.log("One Tap was dismissed by the user.");
          }
        });
      }, 1500);

    } catch (error) {
      console.error("Failed to initialize Google One Tap", error);
    }
  }, [isReady, user]);

  return null; // This component doesn't render any visible UI
}
