'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function TenantSelector() {
  const { user, setSelectedTenantId } = useAuth();
  const [tenants, setTenants] = useState<{ id: string; businessName?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super admin')) return;

    const q = query(collection(db, 'tenants'), orderBy('businessName', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(docs);
      setLoading(false);
    }, (err) => {
      console.error("Tenant list fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || (user.role !== 'admin' && user.role !== 'super admin')) return null;

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '0.8rem 1rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      width: '100%'
    }}>
      <label style={{ 
        fontSize: '0.65rem', 
        fontWeight: 800, 
        color: 'rgba(255, 255, 255, 0.6)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em' 
      }}>
        Switch Tenant
      </label>
      <select 
        value={user.selectedTenantId || ''} 
        onChange={(e) => setSelectedTenantId(e.target.value || undefined)}
        style={{
          background: 'none',
          color: 'white',
          border: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          padding: '2px 0',
          width: '100%',
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '1rem'
        }}
      >
        <option value="" style={{ color: '#333' }}>All Properties (Global)</option>
        {tenants.map(t => (
          <option key={t.id} value={t.id} style={{ color: '#333' }}>
            {t.businessName || `Tenant ${t.id.substring(0, 5)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
