'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '3,000', period: 'month', description: 'Flexible month-to-month access.' },
  { id: 'quarterly', label: 'Quarterly', price: '8,000', period: '3 months', description: 'Save 10% with quarterly billing.' },
  { id: 'semi-annually', label: 'Semi-Annually', price: '15,000', period: '6 months', description: 'Save 15% with bi-annual billing.' },
  { id: 'annually', label: 'Annually', price: '28,000', period: 'year', description: 'Best Value - Save 25% annually.' },
];

function SubscriptionContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId');
  const unitName = searchParams.get('unitName');
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;

    let q;
    if (unitId) {
      q = query(collection(db, 'subscriptions'), where('unitId', '==', unitId));
    } else {
      q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
    }
    
    const unsub = onSnapshot(q, (snap) => {
      const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by latest
      const latest = subs.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds)[0];
      setCurrentSub(latest);
      setLoading(false);
    });

    return () => unsub();
  }, [user, unitId]);

  const handleRequestPlan = async (planId: string) => {
    console.log(`[Subscription] handleRequestPlan triggered for: ${planId}`);
    
    if (!user) {
      console.warn("[Subscription] No user found in AuthContext");
      alert("Please ensure you are logged in correctly.");
      return;
    }

    if (isRequesting) {
      console.log("[Subscription] Request already in progress, skipping.");
      return;
    }
    
    if (currentSub?.status === 'active' || currentSub?.status === 'pending_approval') {
      console.log(`[Subscription] Existing sub found: ${currentSub.status}`);
      alert(`You already have a ${currentSub.status.replace('_', ' ')} subscription (${currentSub.planId}). Please contact support for upgrades or modifications.`);
      return;
    }

    console.log("[Subscription] Prompting for confirmation...");
    const confirmed = window.confirm(`Request to subscribe to the ${planId} plan ${unitName ? `for ${unitName}` : ''}? Our team will contact you for payment verification.`);
    
    if (!confirmed) {
      console.log("[Subscription] User cancelled confirmation prompt.");
      return;
    }

    setIsRequesting(true);
    console.log("[Subscription] Sending request to Firestore...");
    try {
      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        unitId: unitId || null,
        unitName: unitName || null,
        planId,
        status: 'pending_approval',
        createdAt: serverTimestamp(),
      });
      console.log("[Subscription] Request successful!");
      alert("Subscription request sent! We will review and confirm your payment manually.");
    } catch (err) {
      console.error("[Subscription] Error requesting subscription:", err);
      alert("Failed to send request.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>Premium Partnership</h1>
        <p style={{ color: 'var(--muted)' }}>
          {unitName ? `Choose a plan for ${unitName}.` : 'Choose a plan that fits your property portfolio needs.'}
        </p>
      </header>

      {currentSub && (
        <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '3rem', border: '1px solid var(--primary-gold)', background: 'rgba(212, 175, 55, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Current Status</h2>
              <p style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                Plan: <span style={{ textTransform: 'capitalize', color: 'var(--primary-gold)' }}>{currentSub.planId}</span>
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Status: <span style={{ 
                  color: currentSub.status === 'active' ? '#10b981' : '#f59e0b',
                  fontWeight: 700
                }}>{currentSub.status.replace('_', ' ').toUpperCase()}</span>
              </p>
            </div>
            {currentSub.status === 'active' && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Renewal Date</p>
                <p style={{ fontWeight: 600 }}>{currentSub.expiryDate ? new Date(currentSub.expiryDate.seconds * 1000).toLocaleDateString() : 'Manual Renewal'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
        {PLANS.map(plan => (
          <div 
            key={plan.id}
            className="glass-card"
            style={{ 
              padding: '2.5rem', borderRadius: '24px', textAlign: 'center',
              border: '1px solid var(--card-border)', background: 'var(--card-bg)',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <h3 style={{ fontSize: '1.4rem', color: 'var(--title-color)', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>{plan.label}</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.9rem', verticalAlign: 'top', marginRight: '2px' }}>KES</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}> / {plan.period}</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem', flex: 1 }}>
              {plan.description}
            </p>
            <button 
              onClick={() => handleRequestPlan(plan.id)}
              disabled={isRequesting || currentSub?.status === 'active' || currentSub?.status === 'pending_approval'}
              style={{ 
                width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
                background: (currentSub?.status === 'active' || currentSub?.status === 'pending_approval') ? 'var(--card-border)' : (plan.id === 'annually' ? 'var(--primary-gold)' : 'var(--primary-green)'),
                color: (currentSub?.status === 'active' || currentSub?.status === 'pending_approval') ? 'var(--muted)' : (plan.id === 'annually' ? '#000' : '#fff'),
                fontWeight: 700, cursor: (currentSub?.status === 'active' || currentSub?.status === 'pending_approval') ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s'
              }}
            >
              {currentSub?.status === 'active' && currentSub?.planId === plan.id ? 'Current Plan' : 
               currentSub?.status === 'pending_approval' && currentSub?.planId === plan.id ? 'Pending Approval' :
               (currentSub?.status === 'active' || currentSub?.status === 'pending_approval') ? 'Subscription Active' : 'Select Plan'}
            </button>

          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>Need a Custom Arrangement?</h3>
        <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          For portfolios larger than 10 units, we offer bespoke management fees and dedicated account support.
        </p>
        <button style={{ background: 'none', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
          Contact Sales
        </button>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
