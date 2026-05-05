'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import ProviderRequestModal from '@/components/ProviderRequestModal';

interface Booking {
  id: string;
  unit: string;
  unitId: string;
  checkIn: string;
  checkOut: string;
  total: number;
  status: string;
  createdAt: any;
}

export default function GuestDashboard() {
  const { user } = useAuth();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch stays by email
    const q = query(
      collection(db, 'bookings'),
      where('email', '==', user.email),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      setRecentBookings(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Guest stats error (likely missing index):", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>
          Welcome, {user?.displayName?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--muted)' }}>Manage your stays, reviews, and explore new experiences.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.3fr', gap: '3rem' }}>
        {/* Left Column: Stays & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          <section className="glass-card" style={{ padding: '2rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--title-color)', fontWeight: 600 }}>Your Recent Stays</h2>
              <Link href="/dashboard/bookings" style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
            </div>
            
            {loading ? (
              <p style={{ opacity: 0.5 }}>Syncing your stays...</p>
            ) : recentBookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentBookings.map(booking => (
                  <div key={booking.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--title-color)' }}>{booking.unit}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.25rem 0' }}>{booking.checkIn} — {booking.checkOut}</p>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '999px', 
                        background: booking.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)', 
                        color: booking.status === 'Confirmed' ? '#10b981' : 'var(--primary-gold)', 
                        fontWeight: 600 
                      }}>
                        {booking.status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>KES {booking.total.toLocaleString()}</p>
                      <Link href={`/units/${booking.unitId}`} className="premium-button" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Rebook</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.8 }}>
                <p style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>✨</p>
                <h3 style={{ color: 'var(--title-color)', fontSize: '1.3rem', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Ready for your next adventure?</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>No stays recorded yet. Discover our curated collection of premier spaces.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Link href="/stays" className="premium-button" style={{ padding: '0.8rem 2rem' }}>Explore Premier Stays</Link>
                  <Link href="/map" className="premium-button-outline" style={{ padding: '0.8rem 2rem' }}>View on Map</Link>
                </div>
              </div>
            )}
          </section>


        </div>

        {/* Right Column: Profile & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
           <section className="glass-card" style={{ padding: '2.5rem 2rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', textAlign: 'center' }}>
              <div style={{ 
                width: '90px', height: '90px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary-gold), #b8860b)', 
                margin: '0 auto 1.25rem auto', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', 
                color: 'white', border: '4px solid var(--background)',
                boxShadow: 'var(--shadow-md)'
              }}>
                {user?.displayName?.[0]?.toUpperCase()}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>{user?.displayName}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', marginBottom: '1.5rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Verified Explorer</p>
              <Link href="/dashboard/profile" className="premium-button-outline" style={{ display: 'block', fontSize: '0.85rem', padding: '0.75rem' }}>Manage Account</Link>
           </section>

           <section className="glass-card" style={{ padding: '2rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600, color: 'var(--title-color)' }}>Guest Portal</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 {[
                   { href: '/dashboard/chats', icon: '💬', label: 'My Messages' },
                   { href: '/dashboard/bookings', icon: '📅', label: 'History & Itineraries' },
                   { href: '/stays', icon: '🔍', label: 'Find a New Stay' },
                   { href: '/map', icon: '📍', label: 'Explore Regional Map' },
                   { href: '/terms', icon: '⚖️', label: 'Legal & Privacy' },
                 ].map(link => (
                   <Link key={link.href} href={link.href} style={{ 
                     display: 'flex', alignItems: 'center', gap: '1rem', 
                     color: 'var(--foreground)', textDecoration: 'none', 
                     fontSize: '0.9rem', padding: '1rem', borderRadius: '12px', 
                     background: 'var(--background)', border: '1px solid var(--card-border)',
                     transition: 'all 0.2s'
                   }} 
                     onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-gold)'}
                     onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
                   >
                     <span style={{ fontSize: '1.2rem' }}>{link.icon}</span> 
                     <span style={{ fontWeight: 500 }}>{link.label}</span>
                   </Link>
                 ))}
              </div>
           </section>
        </div>
      </div>
      <ProviderRequestModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
