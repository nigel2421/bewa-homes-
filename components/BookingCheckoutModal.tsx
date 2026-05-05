'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
  unitName: string;
  tenantId: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
}

export default function BookingCheckoutModal({ isOpen, onClose, unitId, unitName, tenantId, checkIn, checkOut, totalAmount }: BookingModalProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    idNumber: '',
    specialRequests: ''
  });
  
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates before confirming.");
      setStep('details');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a unique Booking ID (e.g. BW-A7F2)
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const bookingId = `BW-${randomPart}`;

      const bookingData = {
        ...formData,
        guest: formData.name, // Standardized field for Bookings
        bookingId: bookingId,
        unit: unitName,
        unitId: unitId,
        tenantId: tenantId || 'global',
        checkIn,
        checkOut,
        total: totalAmount,
        status: 'Pending',
        channel: 'Direct Web Checkout',
        createdAt: serverTimestamp()
      };

      console.log("Submitting booking:", bookingData);

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      console.log("Booking created with ID:", docRef.id);

      // Also create a Lead record so it appears in CRM
      try {
        await addDoc(collection(db, 'leads'), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: 'Converted',
          interest: 'Stay / Booking',
          unit: unitName,
          source: 'Direct Web Checkout',
          date: new Date().toLocaleDateString('en-GB'),
          notes: `Booking ID: ${bookingId}. ${formData.specialRequests}`,
          tenantId: tenantId || 'global',
          createdAt: serverTimestamp()
        });
        console.log("Corresponding lead created");
      } catch (leadErr) {
        console.error("Failed to create lead, but booking was successful:", leadErr);
        // We don't want to fail the whole booking if lead creation fails
      }

      setStep('success');
      
      // Auto close after success or let user see it
      setTimeout(() => {
        onClose();
        setStep('details');
        setFormData({ name: '', email: '', phone: '', idNumber: '', specialRequests: '' });
      }, 5000);
    } catch (err: any) {
      console.error("Detailed booking error:", err);
      alert(`Failed to confirm booking: ${err.message || 'Unknown error'}. Please try again.`);
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
        width: '100%', maxWidth: '500px', position: 'relative', border: '1px solid var(--card-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', 
          border: 'none', fontSize: '1.5rem', color: 'var(--muted)', cursor: 'pointer'
        }}>✕</button>

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</p>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Booking Successful!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Your reservation for <strong>{unitName}</strong> has been secured.</p>
            <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}>
              We will contact you shortly with the check-in instructions and official itinerary.
            </div>
          </div>
        ) : step === 'confirm' ? (
          <div>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Confirm Reservation</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Please review your details before finalising your booking for <strong>{unitName}</strong>.
            </p>
            
            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--card-border)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Guest</p>
                <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{formData.name}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>ID / Passport</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{formData.idNumber}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Phone</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{formData.phone}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Check In</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{checkIn || 'TBD'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>Check Out</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{checkOut || 'TBD'}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="premium-button"
              style={{ width: '100%', padding: '1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Securing Booking...' : 'Book Final Reservation'}
            </button>
            <button 
              onClick={() => setStep('details')}
              style={{ width: '100%', padding: '1rem', background: 'transparent', color: 'var(--muted)', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              ← Back to Details
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Guest Details</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Booking <strong>{unitName}</strong> (KES {totalAmount.toLocaleString()})
            </p>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Full Name</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                />
              </div>
              <div className="mobile-stack" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>National ID / Passport</label>
                  <input 
                    type="text" required value={formData.idNumber}
                    onChange={e => setFormData({...formData, idNumber: e.target.value})}
                    placeholder="ID or Passport No."
                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Email</label>
                  <input 
                    type="email" required value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Phone (M-Pesa Number)</label>
                <input 
                  type="tel" required value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="07... or 01..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>Special Requests (Optional)</label>
                <textarea 
                  value={formData.specialRequests}
                  onChange={e => setFormData({...formData, specialRequests: e.target.value})}
                  placeholder="Need airport pickup or an early check-in?"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                />
              </div>
              
              <button 
                type="submit" 
                className="premium-button"
                style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
              >
                Review Details →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
