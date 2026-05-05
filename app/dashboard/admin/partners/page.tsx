'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

interface Tenant {
  id: string;
  businessName: string;
  slug: string;
  email: string;
  phone: string;
  status: string;
  createdAt?: any;
}

export default function ManagePartnersPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    slug: '',
    email: '',
    phone: '',
    status: 'Active'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super admin')) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'tenants'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
      setTenants(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ businessName: '', slug: '', email: '', phone: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setFormData({
      businessName: tenant.businessName || '',
      slug: tenant.slug || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      status: tenant.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const finalSlug = formData.slug || generateSlug(formData.businessName);

      // Check for unique slug if new
      if (!editingId) {
        const slugQ = query(collection(db, 'tenants'), where('slug', '==', finalSlug));
        const slugSnap = await getDocs(slugQ);
        if (!slugSnap.empty) {
          setError('This slug is already in use. Please choose a different business name or slug.');
          setIsSubmitting(false);
          return;
        }
      }

      if (editingId) {
        await updateDoc(doc(db, 'tenants', editingId), {
          ...formData,
          slug: finalSlug,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'tenants'), {
          ...formData,
          slug: finalSlug,
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving tenant:', err);
      setError(err.message || 'Failed to save partner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (user?.role !== 'admin' && user?.role !== 'super admin') {
    return <div style={{ padding: '2rem' }}>Unauthorized. Admins only.</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="luxury-text-gradient" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>Manage Partners</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Add or edit property owners and partners you are listing for.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="premium-button"
          style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ➕ Add Partner
        </button>
      </header>

      <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        {tenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</p>
            <p>No partners found. Add your first partner to start managing their properties.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Business Name</th>
                  <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Slug</th>
                  <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact</th>
                  <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--foreground)' }}>{t.businessName}</td>
                    <td style={{ padding: '1rem', color: 'var(--primary-gold)' }}>{t.slug}</td>
                    <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {t.email}<br />{t.phone}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: t.status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: t.status === 'Active' ? '#22c55e' : '#ef4444'
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEdit(t)}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid var(--card-border)', 
                          borderRadius: '6px', 
                          color: 'var(--foreground)', 
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid var(--card-border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-playfair)', color: 'var(--title-color)', marginBottom: '1.5rem' }}>
              {editingId ? 'Edit Partner' : 'Add New Partner'}
            </h2>

            {error && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Business/Partner Name</label>
                <input 
                  type="text" 
                  value={formData.businessName} 
                  onChange={e => setFormData({...formData, businessName: e.target.value})} 
                  required
                  placeholder="e.g. Skyline Homes"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Slug (Optional - auto-generated if left blank)
                </label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => setFormData({...formData, slug: e.target.value})} 
                  placeholder="e.g. skyline-homes"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required
                  placeholder="contact@example.com"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  required
                  placeholder="+254 700 000000"
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.5rem' }}>Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '1rem' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--foreground)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="premium-button"
                  style={{ flex: 1, padding: '1rem', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
