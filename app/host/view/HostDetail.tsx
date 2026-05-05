'use client';

import React, { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = use(params);
  const { user: authUser, login } = useAuth();
  const [host, setHost] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For static export, we handle dynamic IDs by looking at the URL if params is the placeholder
  const id = (typeof window !== 'undefined' && (paramId === 'view' || !paramId)) 
    ? window.location.pathname.split('/').filter(Boolean).pop() || paramId 
    : paramId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Host Profile
        const hostRef = doc(db, 'tenants', id);
        const hostSnap = await getDoc(hostRef);
        if (hostSnap.exists()) {
          setHost(hostSnap.data());
        }

        // 2. Fetch Host Units
        const q = query(collection(db, 'units'), where('ownerId', '==', id), where('status', '==', 'Active'), where('subscriptionStatus', '==', 'active'));
        const unitSnap = await getDocs(q);
        setUnits(unitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching host data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}>Loading Host Portfolio...</div>;
  if (!host && units.length === 0) return <div style={{ padding: '10rem', textAlign: 'center' }}>Host Not Found</div>;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      {/* Host Header */}
      <section style={{ 
        paddingTop: '10rem', paddingBottom: '5rem', background: 'var(--primary-green)', 
        color: 'white', position: 'relative', overflow: 'hidden' 
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <div style={{ 
            width: '160px', height: '160px', borderRadius: '50%', background: 'var(--card-bg)', 
            border: '4px solid var(--primary-gold)', overflow: 'hidden', position: 'relative', flexShrink: 0
          }}>
            <Image src={host?.logo || "/images/stay.png"} alt={host?.name || "Host"} fill style={{ objectFit: 'cover' }} unoptimized={true} />
          </div>
          <div>
            <h1 className="luxury-text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
              {host?.name || 'Exclusive Host'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '800px', lineHeight: '1.8' }}>
              {host?.bio || 'A dedicated property manager committed to delivering premium hospitality experiences across our portfolio.'}
            </p>

            {authUser ? (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '1rem', color: 'white' }}>
                  <span>📞 {host?.phone || 'Private'}</span>
                  <span>✉️ {host?.email || 'Private'}</span>
                </div>
                
                {(host?.tiktok || host?.instagram || host?.facebook || host?.twitter || host?.youtube) && (
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                    {host.tiktok && <a href={host.tiktok} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontSize: '1.5rem' }} title="TikTok">📱</a>}
                    {host.instagram && <a href={host.instagram} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontSize: '1.5rem' }} title="Instagram">📸</a>}
                    {host.facebook && <a href={host.facebook} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontSize: '1.5rem' }} title="Facebook">👥</a>}
                    {host.twitter && <a href={host.twitter} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontSize: '1.5rem' }} title="Twitter / X">🐦</a>}
                    {host.youtube && <a href={host.youtube} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontSize: '1.5rem' }} title="YouTube">📺</a>}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={login}
                style={{ 
                  marginTop: '1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                  padding: '0.6rem 1.2rem', color: 'white', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Sign in to view contact & social media
              </button>
            )}
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
      </section>

      {/* Host Listings */}
      <section className="container" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Property Portfolio</h2>
            <p style={{ color: 'var(--muted)' }}>Explore all {units.length} listings managed by {host?.name || 'this host'}.</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '2.5rem' 
        }}>
          {units.map((unit: any) => (
            <div key={unit.id} className="glass-card" style={{ 
              background: 'var(--card-bg)', borderRadius: '16px', overflow: 'hidden', 
              border: '1px solid var(--card-border)', position: 'relative', transition: 'transform 0.3s ease'
            }}>
              <Link href={`/units/${unit.id}`} style={{ position: 'relative', height: '240px', display: 'block', cursor: 'pointer' }}>
                <Image 
                  src={unit.images?.[0] || "/images/stay.png"} 
                  alt={unit.name} 
                  fill 
                  style={{ objectFit: 'cover' }}
                  unoptimized={true}
                />
              </Link>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--title-color)', margin: 0, fontFamily: 'var(--font-playfair)' }}>{unit.name}</h3>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-gold)' }}>
                    KES {Number(unit.price).toLocaleString()}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  📍 {unit.location} · {unit.type}
                </p>
                <Link href={`/units/${unit.id}`} className="premium-button" style={{ width: '100%', padding: '0.8rem', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {units.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5, color: 'var(--foreground)' }}>
            <p>No active listings from this host at the moment.</p>
          </div>
        )}
      </section>
    </main>
  );
}
