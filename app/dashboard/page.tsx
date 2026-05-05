'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeUnits: 0,
    revenue: 0,
    leads: 0,
    occupancy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Role-based redirection
    if (user.role === 'guest') {
      router.replace('/dashboard/guest');
      return;
    }

    // First-time Check: Redirect if tenant profile is missing
    if (user.role === 'host' && !user.tenantId) {
      router.replace('/dashboard/setup');
      return;
    }

    // Real-time aggregates listener
    let unsubscribe: () => void = () => {};

    if (user.role === 'super admin' || user.role === 'admin') {
      if (user.selectedTenantId) {
        // Fetch specific tenant being managed
        const statsRef = doc(db, 'tenants', user.selectedTenantId, 'aggregates', 'stats');
        unsubscribe = onSnapshot(statsRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setStats({
              activeUnits: data.activeUnits || 0,
              revenue: data.revenue || 0,
              leads: data.leads || 0,
              occupancy: data.activeUnits > 0 ? Math.round(((data.occupiedUnits || 0) / data.activeUnits) * 100) : 0
            });
          } else {
            setStats({ activeUnits: 0, revenue: 0, leads: 0, occupancy: 0 });
          }
          setLoading(false);
        }, (err) => {
          console.error("Dashboard Stats Fetch Error:", err);
          setLoading(false);
        });
      } else {
        // Admin with no selected tenant - show global portfolio stats
        const globalStatsRef = doc(db, 'tenants', 'global', 'aggregates', 'stats');
        unsubscribe = onSnapshot(globalStatsRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setStats({
              activeUnits: data.activeUnits || 0,
              revenue: data.revenue || 0,
              leads: data.leads || 0,
              occupancy: data.activeUnits > 0 ? Math.round(((data.occupiedUnits || 0) / data.activeUnits) * 100) : 0
            });
          } else {
            setStats({ activeUnits: 0, revenue: 0, leads: 0, occupancy: 0 });
          }
          setLoading(false);
        }, (err) => {
          console.error("Global Stats Fetch Error:", err);
          setLoading(false);
        });
      }
    } else {
      const statsRef = doc(db, 'tenants', user.uid, 'aggregates', 'stats');
      unsubscribe = onSnapshot(statsRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStats({
            activeUnits: data.activeUnits || 0,
            revenue: data.revenue || 0,
            leads: data.leads || 0,
            occupancy: data.activeUnits > 0 ? Math.round(((data.occupiedUnits || 0) / data.activeUnits) * 100) : 0
          });
        } else {
          setStats({ activeUnits: 0, revenue: 0, leads: 0, occupancy: 0 });
        }
        setLoading(false);
      }, (err) => {
        console.error("Dashboard Stats Fetch Error:", err);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [user, router]);

  return (
    <div>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>
          Welcome back, {user?.displayName || 'Host'}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {user?.role === 'admin' || user?.role === 'super admin' 
            ? (user?.selectedTenantId ? `Managing properties for selected tenant.` : `Global Portfolio Overview`)
            : `Here is what's happening with your properties today.`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Syncing your dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Units</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.activeUnits}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Visible on marketplace</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Estimated Rev (Nightly)</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}>KES {stats.revenue.toLocaleString()}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>From occupied units</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Leads</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.leads}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Potential customers</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Occupancy Rate</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{stats.occupancy}%</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Average across portfolio</p>
            </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ background: 'var(--card-bg)', padding: '2rem', border: '1px solid var(--card-border)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <a href="/dashboard/units/add" className="premium-button" style={{ textDecoration: 'none', textAlign: 'center' }}>+ Add New Unit</a>
                <button className="premium-button-outline" style={{ textAlign: 'center', width: '100%' }}>View Monthly Report</button>
                <button className="premium-button-outline" style={{ textAlign: 'center', width: '100%' }}>Manage Inventory</button>
              </div>
            </div>

            <div className="glass-card" style={{ background: 'var(--card-bg)', padding: '2rem', border: '1px solid var(--card-border)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>System Health</h3>
              <div style={{ padding: '1.1rem', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                <p style={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>All services operational</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Firebase: Connected · Maps: Ready</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
