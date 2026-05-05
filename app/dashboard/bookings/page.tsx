'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';


interface Booking {
  id: string;
  guest: string;
  unit: string;
  checkIn: string;
  checkOut: string;
  total: number;
  status: string;
  channel: string;
  nights: number;
  bookingId?: string;
  tenantId: string;
  createdAt?: any;
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Pending': { bg: '#fef3c7', color: '#92400e' },
  'Confirmed': { bg: '#d1fae5', color: '#065f46' },
  'Checked In': { bg: '#e0f2fe', color: '#075985' },
  'Checked Out': { bg: '#ede9fe', color: '#5b21b6' },
  'Cancelled': { bg: '#fee2e2', color: '#991b1b' },
  'Completed': { bg: '#f3f4f6', color: '#6b7280' },
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch bookings with logic for different roles
    let q;
    const effectiveTenantId = user.selectedTenantId || user.tenantId;

    if (user.role === 'admin' || user.role === 'super admin') {
      if (user.selectedTenantId) {
        // Admin impersonating a tenant
        q = query(collection(db, 'bookings'), where('tenantId', '==', user.selectedTenantId), orderBy('createdAt', 'desc'));
      } else {
        // Global view for admins
        q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      }
    } else {
      // Normal host
      if (!effectiveTenantId) {
        setLoading(false);
        return;
      }
      q = query(collection(db, 'bookings'), where('tenantId', '==', effectiveTenantId), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Fallback for different naming conventions
          guest: data.guest || data.name || data.guestName || 'Unknown Guest'
        };
      }) as Booking[];
      setBookings(docs);
      setLoading(false);
    }, (err) => {
      console.error("Bookings listener error:", err);
      // Fallback if index is missing or permissions fail
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = bookings.filter(b => {
    const matchesFilter = filter === 'All' || b.status === filter;
    const matchesSearch = b.guest?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         b.bookingId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading reservations...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--title-color)', marginBottom: '0.4rem', fontFamily: 'var(--font-playfair)' }}>Bookings</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Track and manage all guest reservations.</p>
        </div>
        <Link 
          href="/dashboard/leads"
          className="premium-button" 
          style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          👥 Add Lead / Reservation
        </Link>
      </div>

      {/* Pipeline info banner */}
      <div style={{ 
        marginBottom: '1.5rem', padding: '0.9rem 1.25rem', 
        background: 'rgba(0, 77, 64, 0.06)', borderRadius: '12px', 
        border: '1px solid rgba(0, 77, 64, 0.15)', 
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' 
      }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
          <strong style={{ color: 'var(--primary-green)' }}>Sales Pipeline:</strong>{' '}
          New reservation enquiries start as <Link href="/dashboard/leads" style={{ color: 'var(--primary-gold)', fontWeight: 600, textDecoration: 'none' }}>Leads & CRM</Link> → qualify the guest → then convert to a Booking with the agreed price.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Bookings', value: bookings.length, color: 'var(--primary-gold)' },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'Confirmed').length, color: '#10b981' },
          { label: 'Pending', value: bookings.filter(b => b.status === 'Pending').length, color: '#f59e0b' },
          { label: 'Total Revenue', value: `KES ${bookings.reduce((s, b) => s + (b.total || 0), 0).toLocaleString()}`, color: 'var(--primary-green)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Confirmed', 'Checked In', 'Cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: filter === f ? 'var(--primary-green)' : 'rgba(var(--foreground-rgb), 0.03)',
                color: filter === f ? 'white' : 'var(--muted)',
                border: 'none'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: '1', minWidth: '250px', maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search by guest, unit or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
          />
        </div>
      </div>

      {/* Filter */}


      {/* Mobile Card View (visible only on small screens) */}
      <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(b => (
          <div key={b.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-green)' }}>{b.bookingId || '---'}</span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, ...(statusStyle[b.status] ?? {}) }}>
                {b.status}
              </span>
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{b.guest}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{b.unit}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <span>📅 {b.checkIn} — {b.checkOut}</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-gold)' }}>KES {b.total?.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => setSelectedBooking(b)}
              className="premium-button"
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
            >
              View Full Details
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="glass-card hidden md:block" style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--background)' }}>
                {['ID', 'Guest', 'Unit', 'Check-in', 'Check-out', 'Nights', 'Total', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 1 ? 'var(--background)' : 'transparent', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 77, 64, 0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? 'var(--background)' : 'transparent')}
                >
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-green)' }}>{b.bookingId || '---'}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--foreground)' }}>{b.guest}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)' }}>{b.unit}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--foreground)' }}>{b.checkIn}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--foreground)' }}>{b.checkOut}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)', textAlign: 'center' }}>{b.nights}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--primary-gold)' }}>KES {(b.total || 0).toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, ...(statusStyle[b.status] ?? {}) }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <button 
                      onClick={() => setSelectedBooking(b)}
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--foreground)', fontWeight: 600 }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</p>
            <p>No bookings found.</p>
          </div>
        )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-card" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '20px', width: '100%', maxWidth: '550px', position: 'relative', border: '1px solid var(--card-border)' }}>
            <button onClick={() => setSelectedBooking(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            
            <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Reservation Details</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Booking ID: <strong style={{ color: 'var(--primary-gold)' }}>{selectedBooking.bookingId || '---'}</strong></p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Guest Information</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--foreground)' }}>{selectedBooking.guest}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>📧 {(selectedBooking as any).email || 'N/A'}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>📱 {(selectedBooking as any).phone || 'N/A'}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: 600, marginTop: '0.4rem' }}>🪪 ID/Passport: {(selectedBooking as any).idNumber || 'Not Provided'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.4rem' }}>Stay Details</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--foreground)' }}>{selectedBooking.unit}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>📅 {selectedBooking.checkIn} — {selectedBooking.checkOut}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>🌙 {selectedBooking.nights} Nights</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.4rem', color: 'var(--foreground)' }}>💰 Total: KES {selectedBooking.total?.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--card-border)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.8rem' }}>Update Status</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {Object.keys(statusStyle).map(s => (
                  <button
                    key={s}
                    onClick={async () => {
                      try {
                        const { updateDoc, doc } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'bookings', selectedBooking.id), { status: s });
                        setSelectedBooking({...selectedBooking, status: s});
                      } catch (err) {
                        alert("Failed to update status");
                      }
                    }}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      border: '1px solid var(--card-border)',
                      background: selectedBooking.status === s ? statusStyle[s].bg : 'var(--card-bg)',
                      color: selectedBooking.status === s ? statusStyle[s].color : 'var(--foreground)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSelectedBooking(null)}
              className="premium-button" 
              style={{ width: '100%', padding: '1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600 }}
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
