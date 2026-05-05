'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  limit,
  writeBatch
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

export default function SetupPage() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('id');

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [slug, setSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkInvitation = async () => {
      if (!user?.email && !invitationId) return;

      try {
        let invData: any = null;
        let finalId = invitationId;

        // 1. Try Lookup by ID from URL if available
        if (invitationId) {
          const invRef = doc(db, 'invitations', invitationId);
          const invSnap = await getDoc(invRef);
          if (invSnap.exists() && invSnap.data().status === 'pending') {
            invData = invSnap.data();
          }
        }

        // 2. Fallback: Lookup by Email if ID not provided or no result
        if (!invData && user?.email) {
          const q = query(
            collection(db, 'invitations'),
            where('email', '==', user.email),
            where('status', '==', 'pending'),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            invData = snap.docs[0].data();
            finalId = snap.docs[0].id;
          }
        }

        if (invData) {
          setInvitation({ id: finalId, ...invData });
          setBusinessName(invData.businessName || '');
          // Suggest a slug
          setSlug((invData.businessName || '').toLowerCase().replace(/\s+/g, '-'));
        }
      } catch (err) {
        console.error('Error checking invitation:', err);
        setError('Failed to verify invitation.');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [user, invitationId]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !invitation || !acceptedLegal) return;

    setIsSubmitting(true);
    setError('');

    try {
      const batch = writeBatch(db);
      const tenantId = `t-${Date.now()}`;

      // 1. Create Tenant record
      const tenantRef = doc(db, 'tenants', tenantId);
      batch.set(tenantRef, {
        name: businessName,
        slug: slug.trim().toLowerCase(),
        ownerId: user.uid,
        contactEmail: user.email,
        createdAt: serverTimestamp(),
      });

      // 2. Update User profile
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        tenantId: tenantId,
        role: 'host',
        businessName: businessName,
        legalAcceptedAt: serverTimestamp()
      });

      // 3. Mark ALL pending invitations for this email as accepted
      // This cleans up duplicates automatically
      const q = query(
        collection(db, 'invitations'),
        where('email', '==', user.email),
        where('status', '==', 'pending')
      );
      const invSnap = await getDocs(q);
      invSnap.docs.forEach((inviteDoc) => {
        batch.update(inviteDoc.ref, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          tenantId: tenantId
        });
      });

      // 4. Commit batch
      await batch.commit();

      // 5. Refresh context and redirect
      await refreshUser();
      window.location.replace('/dashboard');
    } catch (err) {
      console.error('Setup error:', err);
      setError('An error occurred during setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Verifying your invitation...</div>;

  if (!invitation && !user?.tenantId) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ color: '#dc2626' }}>No Invitation Found</h2>
        <p>This account has not been invited to join as a tenant. Please contact your administrator.</p>
        <button onClick={() => window.location.replace('/dashboard')} className="premium-button-outline" style={{ marginTop: '2rem' }}>Back to Dashboard</button>
      </div>
    );
  }

  if (user?.tenantId) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Setup Complete</h2>
        <p>Your tenant profile is already configured.</p>
        <button onClick={() => window.location.replace('/dashboard')} className="premium-button" style={{ marginTop: '2rem' }}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '3rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--title-color)', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>Complete your Setup</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2.5rem' }}>Welcome to Bewa Homes. Let's configure your property management sub-account.</p>

        {error && <p style={{ color: '#dc2626', marginBottom: '1.5rem', background: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</p>}

        <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Majestic Stays"
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Your Unique Link Slug</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)', paddingRight: '1rem' }}>
              <span style={{ padding: '1rem', color: 'var(--muted)', borderRight: '1px solid var(--card-border)', fontSize: '0.9rem' }}>bewa.co.ke/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-luxury-stays"
                style={{ flex: 1, padding: '1rem', background: 'none', border: 'none', outline: 'none', color: 'var(--foreground)' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Only lowercase letters, numbers, and hyphens.</p>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <label style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={acceptedLegal}
                onChange={e => setAcceptedLegal(e.target.checked)}
                style={{ marginTop: '0.3rem', width: '1.1rem', height: '1.1rem' }}
              />
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                I have read and agree to the
                <a href="/terms" target="_blank" style={{ color: 'var(--primary-gold)', fontWeight: 600, margin: '0 4px', textDecoration: 'underline' }}>Terms of Service</a>
                and
                <a href="/privacy" target="_blank" style={{ color: 'var(--primary-gold)', fontWeight: 600, margin: '0 4px', textDecoration: 'underline' }}>Privacy Policy</a>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !acceptedLegal}
            className="premium-button"
            style={{
              padding: '1.25rem',
              background: acceptedLegal ? 'var(--primary-green)' : 'var(--card-border)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: acceptedLegal ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 700,
              opacity: acceptedLegal ? 1 : 0.6
            }}
          >
            {isSubmitting ? 'Configuring Account...' : 'Finish Setup & Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
