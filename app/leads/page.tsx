'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LeadGenerationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'stay', // stay, buy, rent
    bedrooms: '1',
    budget: '',
    location: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        source: 'social_media_ad',
        status: 'new',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'linear-gradient(135deg, #004d40 0%, #00251a 100%)', color: 'white', padding: '2rem' 
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>✨</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'serif' }}>Thank You!</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>
            We've received your inquiry. One of our property specialists will contact you shortly to help you find your perfect match.
          </p>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              marginTop: '2rem', padding: '1rem 2rem', borderRadius: '50px', border: 'none', 
              background: '#d4af37', color: '#00251a', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--background)', color: 'var(--foreground)'
    }}>
      <div style={{ 
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 2rem', background: 'radial-gradient(circle at top right, rgba(212, 175, 55, 0.05), transparent)'
      }}>
        <div className="glass-card" style={{ 
          width: '100%', maxWidth: '600px', padding: '3rem', borderRadius: '30px',
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.12)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.75rem', fontFamily: 'serif', color: 'var(--title-color)' }}>
              Find Your Dream Property
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.05rem' }}>
              Tell us what you're looking for and we'll handle the rest.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number</label>
                <input 
                  type="tel" required value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+254..."
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
              <input 
                type="email" required value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>I am interested in</label>
                <select 
                  value={formData.interest}
                  onChange={e => setFormData({...formData, interest: e.target.value})}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', appearance: 'none' }}
                >
                  <option value="stay">Short Stay / Vacation</option>
                  <option value="buy">Buying Property</option>
                  <option value="rent">Long-term Rental</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bedrooms</label>
                <select 
                  value={formData.bedrooms}
                  onChange={e => setFormData({...formData, bedrooms: e.target.value})}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', appearance: 'none' }}
                >
                  <option value="studio">Studio</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4+">4+ Bedrooms</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Budget Range</label>
                <input 
                  type="text" value={formData.budget}
                  onChange={e => setFormData({...formData, budget: e.target.value})}
                  placeholder="e.g. 50k - 100k"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Preferred Location</label>
                <input 
                  type="text" value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Kilimani, Diani"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={isSubmitting}
              style={{ 
                marginTop: '1rem', padding: '1.25rem', borderRadius: '15px', border: 'none', 
                background: 'var(--primary-green)', color: 'white', fontWeight: 700, 
                fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: '0 10px 20px rgba(0, 77, 64, 0.2)'
              }}
            >
              {isSubmitting ? 'Sending...' : 'Get Personalized Offers'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
