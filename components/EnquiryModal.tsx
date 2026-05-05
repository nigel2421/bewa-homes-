'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemType: 'stay' | 'land' | 'service';
  tenantId?: string;
}

export default function EnquiryModal({ isOpen, onClose, itemId, itemName, itemType, tenantId }: EnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    checkIn: '',
    checkOut: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        interest: itemName,
        itemId: itemId,
        type: itemType,
        tenantId: tenantId || 'global',
        status: 'Hot',
        source: 'Website',
        date: new Date().toLocaleDateString('en-GB'),
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setFormData({ name: '', email: '', phone: '', message: '', checkIn: '', checkOut: '' });
      }, 3000);
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Failed to send enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass-card" style={{
        background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '20px', 
        width: '100%', maxWidth: '450px', position: 'relative', border: '1px solid var(--card-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', 
          border: 'none', fontSize: '1.5rem', color: 'var(--muted)', cursor: 'pointer'
        }}>✕</button>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</p>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Enquiry Received!</h2>
            <p style={{ color: 'var(--muted)' }}>Our team will contact you shortly about <strong>{itemName}</strong>.</p>
          </div>
        ) : (
          <>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Enquire Interest</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Interested in <strong>{itemName}</strong>? Fill in your details below.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Full Name</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Email</label>
                  <input 
                    type="email" required value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Phone</label>
                  <input 
                    type="tel" required value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Check-in</label>
                  <input 
                    type="date" required value={formData.checkIn}
                    onChange={e => setFormData({...formData, checkIn: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Check-out</label>
                  <input 
                    type="date" required value={formData.checkOut}
                    onChange={e => setFormData({...formData, checkOut: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Message (Optional)</label>
                <textarea 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us more about your requirements..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <button 
                type="submit" disabled={isSubmitting}
                className="premium-button"
                style={{ marginTop: '0.5rem', padding: '1rem', width: '100%' }}
              >
                {isSubmitting ? 'Sending Enquiry...' : 'Send Enquiry'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
