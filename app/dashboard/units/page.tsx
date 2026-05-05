'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, or, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Unit {
  id: string;
  name: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  price: number;
  status: string;
  occupancy: string;
  ownerId: string;
  managerId?: string;
  subscriptionStatus?: string;
}

const occupancyColor: Record<string, { background: string; color: string; border: string }> = {
  Occupied: { background: 'rgba(209, 250, 229, 0.15)', color: '#10b981', border: '1px solid rgba(209, 250, 229, 0.2)' },
  Vacant: { background: 'rgba(224, 231, 255, 0.15)', color: '#6366f1', border: '1px solid rgba(224, 231, 255, 0.2)' },
  Maintenance: { background: 'rgba(254, 243, 199, 0.15)', color: '#f59e0b', border: '1px solid rgba(254, 243, 199, 0.2)' },
};

export default function UnitsPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  // Real-time Fetching
  useEffect(() => {
    if (!user) return;
    
    // Determine query based on role and selected tenant
    let q;
    if (user.role === 'admin' || user.role === 'super admin') {
      if (user.selectedTenantId) {
        q = query(
          collection(db, 'units'), 
          or(
            where('ownerId', '==', user.selectedTenantId),
            where('managerId', '==', user.selectedTenantId)
          ),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(collection(db, 'units'), orderBy('createdAt', 'desc'));
      }
    } else {
      q = query(
        collection(db, 'units'), 
        or(
          where('ownerId', '==', user.uid),
          where('managerId', '==', user.uid)
        ),
        orderBy('createdAt', 'desc')
      );
    }

    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];
      setUnits(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, 'units', id));
    } catch (err) {
      alert('Failed to delete unit.');
    }
  };

  const filtered = filter === 'All' ? units : units.filter(u => u.occupancy === filter);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loader" style={{ border: '3px solid var(--card-border)', borderTop: '3px solid var(--primary-gold)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--title-color)', marginBottom: '0.4rem', fontFamily: 'var(--font-playfair)' }}>My Units</h1>
          <p style={{ color: 'var(--muted)' }}>Manage and monitor all your short-stay properties.</p>
        </div>
        <Link
          href="/dashboard/units/add"
          className="premium-button"
          style={{ 
            background: 'var(--primary-green)', color: 'white', textDecoration: 'none',
            padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, 
            fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,100,50,0.2)' 
          }}
        >
          + Add New Unit
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['All', 'Occupied', 'Vacant', 'Maintenance'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1.2rem', borderRadius: '999px', border: '1px solid var(--card-border)',
              background: filter === f ? 'var(--primary-green)' : 'var(--card-bg)',
              color: filter === f ? 'white' : 'var(--foreground)',
              fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Units Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {filtered.map(unit => (
          <div
            key={unit.id}
            className="glass-card"
            style={{ background: 'var(--card-bg)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', transition: 'all 0.3s ease' }}
          >
            <div style={{ height: '6px', background: unit.occupancy === 'Vacant' ? 'var(--primary-gold)' : 'var(--card-border)' }} />
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--title-color)', marginBottom: '0.3rem', fontFamily: 'var(--font-playfair)' }}>{unit.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>📍</span> {unit.location}
                  </p>
                </div>
                <span style={{
                  padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                  ...occupancyColor[unit.occupancy],
                }}>
                  {unit.occupancy}
                </span>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Nightly Rate</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)' }}>
                  KES {Number(unit.price).toLocaleString()}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Subscription Status</p>
                <span style={{ 
                  padding: '0.3rem 0.6rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  background: unit.subscriptionStatus === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: unit.subscriptionStatus === 'active' ? '#10b981' : '#f59e0b',
                  border: unit.subscriptionStatus === 'active' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  {unit.subscriptionStatus ? unit.subscriptionStatus.toUpperCase() : 'INACTIVE'}
                </span>
                {unit.subscriptionStatus !== 'active' && (
                  <Link href={`/dashboard/subscription?unitId=${unit.id}&unitName=${encodeURIComponent(unit.name)}`} style={{ textDecoration: 'none', marginLeft: '0.5rem' }}>
                    <button style={{ 
                      padding: '0.3rem 0.6rem', borderRadius: '12px', 
                      background: 'transparent', color: 'var(--primary-gold)', 
                      border: '1px solid var(--primary-gold)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 
                    }}>
                      Subscribe Now
                    </button>
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link href={`/dashboard/units/edit/edit/?id=${unit.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'var(--primary-green)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Edit
                  </button>
                </Link>
                <button 
                  onClick={() => handleDelete(unit.id, unit.name)}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <p style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏠</p>
          <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem' }}>No listings yet</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Start your property portfolio by adding your first unit.</p>
          <Link href="/dashboard/units/add" className="premium-button" style={{ textDecoration: 'none' }}>+ Create First Listing</Link>
        </div>
      )}
    </div>
  );
}

