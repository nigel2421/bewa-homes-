'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function PublicLeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    unitType: 'Apartment',
    location: '',
    bedrooms: '1',
    budget: '',
    notes: '',
    source: 'Social Media Ad'
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        status: 'Warm',
        interest: `${formData.bedrooms} BR ${formData.unitType} in ${formData.location}`,
        date: new Date().toLocaleDateString(),
        tenantId: 'global', // Public leads go to global pool or specific tenant if we add a param
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error saving lead:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <Navbar />
        <div style={{ 
          padding: '10rem 1rem', 
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div className="glass-card" style={{ padding: '3rem', borderRadius: '24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✨</div>
            <h1 className="luxury-text-gradient" style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', marginBottom: '1rem' }}>Thank You!</h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Your inquiry has been received. Our team will reach out to you shortly via phone or email to help you find your perfect home.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="premium-button"
              style={{ marginTop: '2rem', padding: '1rem 2.5rem' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4rem',
          alignItems: 'center'
        }} className="mobile-grid-1">
          
          <div style={{ animation: 'fadeInLeft 0.8s ease' }}>
            <h1 className="luxury-text-gradient" style={{ 
              fontSize: '3.5rem', 
              fontFamily: 'var(--font-playfair)', 
              marginBottom: '1.5rem',
              lineHeight: 1.1
            }}>Find Your Next Perfect Stay</h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Fill out this quick form and let us do the heavy lifting. We'll match you with the best properties that fit your budget and lifestyle.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { icon: '🎯', title: 'Curated Selection', desc: 'Hand-picked units that match your exact specs.' },
                { icon: '⚡', title: 'Fast Response', desc: 'Our agents typically respond within 30 minutes.' },
                { icon: '💎', title: 'Premium Service', desc: 'Experience the BEWA luxury treatment from day one.' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '50px', height: '50px', borderRadius: '12px', 
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                  }}>{item.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>{item.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ 
            padding: '2.5rem', 
            borderRadius: '24px', 
            border: '1px solid var(--card-border)',
            animation: 'fadeInRight 0.8s ease'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mobile-grid-1">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Unit Type</label>
                  <select 
                    value={formData.unitType}
                    onChange={e => setFormData({...formData, unitType: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option>Apartment</option>
                    <option>Villa</option>
                    <option>Studio</option>
                    <option>Penthouse</option>
                    <option>Office Space</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Preferred Location</label>
                  <input 
                    type="text" required 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Kilimani, Westlands"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="mobile-grid-1">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bedrooms</label>
                  <select 
                    value={formData.bedrooms}
                    onChange={e => setFormData({...formData, bedrooms: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  >
                    <option>Studio</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4+</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Monthly Budget (KES)</label>
                  <input 
                    type="number" required 
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                    placeholder="e.g. 50000"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Any Other Details</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Tell us more about what you're looking for..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="premium-button"
                style={{ width: '100%', padding: '1.2rem', marginTop: '1rem' }}
              >
                {loading ? 'Submitting...' : 'Find My Perfect Home ✨'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </main>
  );
}
