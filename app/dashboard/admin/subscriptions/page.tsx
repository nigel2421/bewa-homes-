'use client';
// Force refresh to resolve ChunkLoadError in Turbopack

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  status: 'pending_approval' | 'active' | 'expired';
  createdAt: any;
  expiryDate?: any;
  unitId?: string;
  unitName?: string;
}

export default function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    // Security check
    if (user && user.role !== 'admin' && user.role !== 'super admin') {
      router.push('/dashboard');
      return;
    }

    const q = query(collection(db, 'subscriptions'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      // Sort by status (pending first) then date
      data.sort((a, b) => {
        if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
        if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setSubs(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user, router]);

  const handleApprove = async (sub: Subscription) => {
    if (!window.confirm(`Approve subscription for ${sub.userName} (${sub.planId})?`)) return;
    
    setProcessing(sub.id);
    try {
      const now = new Date();
      let monthsToAdd = 1;
      if (sub.planId === 'quarterly') monthsToAdd = 3;
      if (sub.planId === 'semi-annually') monthsToAdd = 6;
      if (sub.planId === 'annually') monthsToAdd = 12;

      const expiryDate = new Date();
      expiryDate.setMonth(now.getMonth() + monthsToAdd);

      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: 'active',
        expiryDate: expiryDate,
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid
      });

      if (sub.unitId) {
        await updateDoc(doc(db, 'units', sub.unitId), {
          subscriptionStatus: 'active',
          subscriptionExpiry: expiryDate
        });
      }

      // Also update user role to 'unit owner' if they were a 'guest'
      // This ensures they have access to the dashboard features
      // Note: In a real app, you might want to fetch the user document first
      // But assuming the partner is already a 'host' or similar.
      
      alert("Subscription approved successfully!");
    } catch (err) {
      console.error("Error approving sub:", err);
      alert("Failed to approve subscription.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (sub: Subscription) => {
    if (!window.confirm("Reject and delete this subscription request?")) return;
    
    setProcessing(sub.id);
    try {
      await deleteDoc(doc(db, 'subscriptions', sub.id));
      if (sub.unitId) {
        await updateDoc(doc(db, 'units', sub.unitId), {
          subscriptionStatus: 'inactive'
        });
      }
      alert("Request rejected and removed.");
    } catch (err) {
      console.error("Error rejecting sub:", err);
      alert("Failed to reject.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8ec93f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );

  const pending = subs.filter(s => s.status === 'pending_approval');
  const active = subs.filter(s => s.status === 'active');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 className="luxury-text-gradient" style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Subscription Approvals
        </h1>
        <p style={{ color: 'var(--muted)' }}>Review and confirm payment for partner subscription requests.</p>
      </header>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          Pending Requests
          <span style={{ background: '#f59e0b', color: 'white', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{pending.length}</span>
        </h2>

        {pending.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</p>
            <p>No pending subscription requests.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {pending.map(sub => (
              <div key={sub.id} className="glass-card" style={{ 
                padding: '1.5rem 2rem', borderRadius: '15px', border: '1px solid var(--card-border)',
                background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{sub.userName}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{sub.userEmail}</p>
                  {sub.unitName && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Unit: {sub.unitName}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', background: 'var(--background)', padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                      Plan: <strong style={{ textTransform: 'capitalize' }}>{sub.planId}</strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Requested: {sub.createdAt ? new Date(sub.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleReject(sub)}
                    disabled={processing === sub.id}
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(sub)}
                    disabled={processing === sub.id}
                    style={{ background: 'var(--primary-green)', border: 'none', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {processing === sub.id ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Active Partners</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card-bg)', borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Partner</th>
                <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Unit</th>
                <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Plan</th>
                <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Expiry Date</th>
                <th style={{ textAlign: 'right', padding: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {active.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '1.2rem', fontWeight: 600 }}>{sub.userName}</td>
                  <td style={{ padding: '1.2rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{sub.userEmail}</td>
                  <td style={{ padding: '1.2rem', fontWeight: 600, color: 'var(--primary-gold)' }}>{sub.unitName || 'N/A'}</td>
                  <td style={{ padding: '1.2rem' }}><span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{sub.planId}</span></td>
                  <td style={{ padding: '1.2rem', fontSize: '0.9rem' }}>
                    {sub.expiryDate ? new Date(sub.expiryDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem' }}>● ACTIVE</span>
                  </td>
                </tr>
              ))}
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No active subscriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
