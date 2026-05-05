'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewBookingModal({ isOpen, onClose, onSuccess }: NewBookingModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    guest: '',
    unitName: '',
    checkIn: '',
    checkOut: '',
    total: '',
    actualAmount: '',
    status: 'pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'bookings'), {
        ...formData,
        tenantId: user?.tenantId || 'global',
        ownerId: user?.uid || null,
        total: parseFloat(formData.total) || 0,
        actualAmount: parseFloat(formData.actualAmount) || parseFloat(formData.total) || 0,
        createdAt: serverTimestamp(),
        source: 'manual'
      });

      // Also create a Lead record so it appears in CRM
      try {
        await addDoc(collection(db, 'leads'), {
          name: formData.guest,
          status: 'Converted',
          interest: 'Manual Booking',
          unit: formData.unitName,
          source: 'Manual Dashboard',
          date: new Date().toLocaleDateString('en-GB'),
          tenantId: user?.tenantId || 'global',
          createdAt: serverTimestamp()
        });
      } catch (leadErr) {
        console.error("Failed to create lead:", leadErr);
      }
      
      if (onSuccess) onSuccess();
      onClose();
      setFormData({
        guest: '',
        unitName: '',
        checkIn: '',
        checkOut: '',
        total: '',
        actualAmount: '',
        status: 'pending'
      });


    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', 
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 2000, padding: '1rem'
    }}>
      <div className="glass-card" style={{
        background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '24px', 
        width: '100%', maxWidth: '500px', position: 'relative', border: '1px solid var(--card-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'modalAppear 0.3s ease-out'
      }}>
        <style jsx>{`
          @keyframes modalAppear {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(var(--foreground-rgb), 0.05)', 
          border: 'none', width: '32px', height: '32px', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s'
        }}>✕</button>

        <h2 style={{ color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)', fontSize: '1.75rem' }}>New Booking</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Manually record a new booking in the system.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Guest Name</label>
            <input 
              type="text" required value={formData.guest}
              onChange={e => setFormData({...formData, guest: e.target.value})}
              placeholder="Enter guest's full name"
              style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Unit / Property Name</label>
            <input 
              type="text" required value={formData.unitName}
              onChange={e => setFormData({...formData, unitName: e.target.value})}
              placeholder="e.g. Ocean View Apartment"
              style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Check-in</label>
              <input 
                type="date" required value={formData.checkIn}
                onChange={e => setFormData({...formData, checkIn: e.target.value})}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Check-out</label>
              <input 
                type="date" required value={formData.checkOut}
                onChange={e => setFormData({...formData, checkOut: e.target.value})}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Original Amount ($)</label>
              <input 
                type="number" required value={formData.total}
                onChange={e => setFormData({...formData, total: e.target.value})}
                placeholder="0.00"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Actual / Negotiated ($)</label>
              <input 
                type="number" value={formData.actualAmount}
                onChange={e => setFormData({...formData, actualAmount: e.target.value})}
                placeholder="Defaults to original"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none', appearance: 'none' }}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked-out">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>


          <button 
            type="submit" disabled={isSubmitting}
            className="premium-button"
            style={{ marginTop: '1rem', padding: '1.1rem', width: '100%', fontSize: '1rem', fontWeight: 700 }}
          >
            {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
