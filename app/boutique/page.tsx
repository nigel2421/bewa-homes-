'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  contactEmail: string;
}

interface Unit {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
}

export default function TenantPublicPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Extract slug from URL (e.g. /my-slug -> my-slug)
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (path && path !== 'boutique') {
      setTenantSlug(path);
    } else {
      // If we are strictly on /boutique/ without a real slug
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        // 1. Fetch Tenant
        const tQuery = query(collection(db, 'tenants'), where('slug', '==', tenantSlug), limit(1));
        const tSnap = await getDocs(tQuery);
        
        if (tSnap.empty) {
          setError(true);
          setLoading(false);
          return;
        }

        const tData = { id: tSnap.docs[0].id, ...tSnap.docs[0].data() } as Tenant;
        setTenant(tData);

        // 2. Fetch Units for this tenant
        const uQuery = query(collection(db, 'units'), where('tenantId', '==', tData.id), where('subscriptionStatus', '==', 'active'));
        const uSnap = await getDocs(uQuery);
        setUnits(uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[]);
        
      } catch (err) {
        console.error("Error fetching tenant data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (tenantSlug) fetchTenantData();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <p style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>Loading Boutique Site...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'var(--background)' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--card-border)' }}>404</h1>
        <h2>Boutique Not Found</h2>
        <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>The property collection you're looking for doesn't exist.</p>
        <Link href="/" style={{ marginTop: '2rem', color: 'var(--primary-gold)' }}>← Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      
      {/* Dynamic Header */}
      <header style={{ 
        padding: '8rem 2rem 6rem', 
        textAlign: 'center', 
        background: 'linear-gradient(rgba(0,40,20,0.8), rgba(0,40,20,0.8)), url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1500&q=80")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ color: 'var(--primary-gold)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Premier Collection</span>
          <h1 style={{ fontSize: '3.5rem', marginTop: '1rem', fontFamily: 'var(--font-playfair)' }}>{tenant.name}</h1>
          <p style={{ marginTop: '1.5rem', opacity: 0.9, fontSize: '1.2rem', fontWeight: 300 }}>Exclusive properties managed with excellence under the BEWA platform.</p>
        </div>
      </header>

      {/* Property Grid */}
      <main style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Available Units</h2>
            <p style={{ color: 'var(--muted)' }}>Browse through our curated boutique listings.</p>
          </div>
          <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{units.length} Listings Found</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2.5rem' }}>
          {units.map(unit => (
            <div key={unit.id} style={{ border: '1px solid var(--card-border)', borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow 0.3s', background: 'var(--card-bg)' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.1)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ height: '240px', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                📷 Property Image
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-gold)', textTransform: 'uppercase' }}>{unit.type}</span>
                   <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{unit.location}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>{unit.name}</h3>
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>KES {unit.price.toLocaleString()}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--muted)' }}>/night</span></p>
                  <button className="premium-button" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {units.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>We are currently updating our boutique collection. Please check back soon.</p>
          </div>
        )}
      </main>

      {/* Footer Branded */}
      <footer style={{ background: 'var(--primary-green)', padding: '5rem 2rem', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', marginBottom: '1rem' }}>{tenant.name}</h2>
          <p style={{ opacity: 0.7 }}>Powered by BEWA Management Suite</p>
          <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            © {new Date().getFullYear()} {tenant.name}. Enquiries: {tenant.contactEmail}
          </div>
        </div>
      </footer>
    </div>
  );
}
