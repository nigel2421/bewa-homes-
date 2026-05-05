'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import EnquiryModal from '@/components/EnquiryModal';

export default function LandPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'land_listings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      
      <section style={{ 
        paddingTop: '10rem', paddingBottom: '4rem', background: 'var(--primary-green)', 
        color: 'white', textAlign: 'center' 
      }}>
        <div className="container">
          <h1 className="luxury-text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
            Premium Land Plots
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '700px', marginInline: 'auto' }}>
            Secure your future with prime real estate holdings in Nairobi and beyond.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '5rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>Loading plots...</div>
        ) : (
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '2.5rem' 
          }}>
            {listings.map(plot => (
              <div key={plot.id} className="glass-card" style={{ 
                background: 'var(--card-bg)', borderRadius: '16px', overflow: 'hidden', 
                border: '1px solid var(--card-border)', position: 'relative', transition: 'transform 0.3s ease'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ position: 'relative', height: '220px' }}>
                  <Image 
                    src="/images/land.png" 
                    alt={plot.title} 
                    fill 
                    style={{ objectFit: 'cover' }}
                  />
                  <div style={{ 
                    position: 'absolute', top: '1rem', right: '1rem', 
                    background: 'var(--primary-gold)', color: 'white', 
                    padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                  }}>
                    {plot.status}
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>{plot.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>📍 {plot.location} · {plot.size}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-gold)', marginBottom: '1.5rem' }}>
                    KES {Number(plot.price).toLocaleString()}
                  </p>
                  <button 
                    onClick={() => setSelectedItem({id: plot.id, name: plot.title})}
                    className="premium-button" style={{ width: '100%', padding: '0.8rem' }}
                  >
                    Enquire Now
                  </button>
                </div>
              </div>
            ))}
            {listings.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                <p style={{ fontSize: '3rem' }}>🏞️</p>
                <p>No land plots available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {selectedItem && (
        <EnquiryModal 
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          itemType="land"
          tenantId="global"
        />
      )}
    </main>
  );
}
