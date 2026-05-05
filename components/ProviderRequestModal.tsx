'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderRequestModal({ isOpen, onClose }: ModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    location: '',
    propertyCount: '1-5',
    propertyType: 'Short Stay',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'provider_requests'), {
        userId: user.uid,
        userName: user.displayName,
        email: user.email,
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div className="glass-card" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '20px', width: '100%', maxWidth: '500px', border: '1px solid var(--card-border)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: 'var(--title-color)' }}>Request Submitted!</h2>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Our team will reach out to organize a site visit shortly.</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: 'var(--title-color)', marginBottom: '0.5rem' }}>Apply to be a Provider</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Transform your properties into premier BEWA experiences.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Business / Entity Name</label>
                <input required type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="e.g. Royal Apartments" style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="07..." style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Location</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="City, Area" style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Property Type</label>
                <select value={formData.propertyType} onChange={e => setFormData({ ...formData, propertyType: e.target.value })} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                  <option>Short/Long Stay</option>
                  <option>Rental Units</option>
                  <option>Land / Plot</option>
                  <option>Multiple Types</option>
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="premium-button" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
                {isSubmitting ? 'Sending Request...' : 'Submit Onboarding Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
