'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, or } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'contracts'),
      or(
        where('createdBy', '==', user.uid),
        where('stakeholderEmails', 'array-contains', user.email)
      ),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setContracts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading Contracts...</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>E-Files & Contracts</h1>
          <p style={{ color: 'var(--muted)' }}>Manage your digital agreements and legally binding documents.</p>
        </div>
        <Link href="/dashboard/contracts/new" className="premium-button">
          + New Contract
        </Link>
      </header>

      <div className="glass-card" style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,48,40,0.03)' }}>
              <th style={{ padding: '1.5rem 1.2rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Details</th>
              <th style={{ padding: '1.5rem 1.2rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stakeholder</th>
              <th style={{ padding: '1.5rem 1.2rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1.5rem 1.2rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '1.5rem 1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-gold)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--title-color)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{contract.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ padding: '2px 6px', background: 'var(--background)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>{contract.type || 'Agreement'}</span>
                        <span>•</span>
                        <span>{contract.createdAt?.toDate()?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.5rem 1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--background)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)' }}>
                      {contract.stakeholderName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{contract.stakeholderName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{contract.stakeholderEmail}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.5rem 1.2rem' }}>
                  <span style={{ 
                    padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
                    background: contract.status?.toLowerCase() === 'signed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: contract.status?.toLowerCase() === 'signed' ? '#059669' : '#d97706',
                    border: contract.status?.toLowerCase() === 'signed' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    {contract.status || 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '1.5rem 1.2rem', textAlign: 'right' }}>
                  <Link 
                    href={`/dashboard/contracts/${contract.id}`} 
                    className="premium-button-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    View E-File
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </Link>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                  <div style={{ marginBottom: '1.5rem', opacity: 0.2 }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>No Digital Contracts</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 2rem' }}>Start by creating a new legally binding agreement for your property.</p>
                  <Link href="/dashboard/contracts/new" className="premium-button">+ Create First Contract</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
