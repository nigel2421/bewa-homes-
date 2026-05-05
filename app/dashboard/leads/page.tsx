'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  interest: string;
  unit: string;
  source: string;
  date: string;
  notes: string;
  tenantId: string;
  bedrooms?: string;
  budget?: string;
  location?: string;
  createdAt?: any;
}


interface Unit {
  id: string;
  name: string;
  price: number;
  [key: string]: any;
}

const statusColor: Record<string, { bg: string; color: string; dot: string }> = {
  Hot: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  Warm: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  Cold: { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1' },
  Converted: { bg: '#dcfce7', color: '#166534', dot: '#22c55e' }
};

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Conversion State
  const [isConverting, setIsConverting] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [convertData, setConvertData] = useState({
    unitId: '',
    unitName: '',
    checkIn: '',
    checkOut: '',
    idNumber: '',
    originalPrice: 0,
    total: 0,
    status: 'Pending' // "Pending" waiting for M-Pesa
  });

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'admin' || user.role === 'super admin';

    // Wait until tenantId is available for non-admin users
    if (!isAdmin && !user.tenantId) return;

    // Admin logic: Super Admin sees all (unless impersonating), Tenants see only their own
    let q;
    const effectiveTenantId = user.selectedTenantId || user.tenantId;

    if (isAdmin) {
      if (user.selectedTenantId) {
        q = query(collection(db, 'leads'), where('tenantId', '==', user.selectedTenantId), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      }
    } else {
      if (!effectiveTenantId) {
        setLoading(false);
        return;
      }
      q = query(collection(db, 'leads'), where('tenantId', '==', effectiveTenantId), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[];
      setLeads(docs);
      setLoading(false);
    }, (err) => {
      console.error("Leads listener error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = filter === 'All' ? leads : leads.filter(l => l.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedLeads = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const selectedLead = leads.find(l => l.id === selected) ?? null;

  const handleOpenConversion = async () => {
    if (!user || !selectedLead) return;
    setIsConverting(true);
    try {
      const q = query(collection(db, 'units'), where('ownerId', '==', user.tenantId || 'global'));
      const uSnap = await getDocs(q);
      const unitsData = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
      setAvailableUnits(unitsData);
      
      const matchedUnit = unitsData.find(u => u.name === selectedLead.unit);
      setConvertData(prev => ({
        ...prev,
        unitName: selectedLead.unit || '',
        unitId: matchedUnit?.id || '',
        originalPrice: matchedUnit?.price || 0,
        total: matchedUnit?.price || 0
      }));
    } catch (err) {
      console.error("Failed to load units", err);
    }
  };

  const executeConversion = async () => {
    if (!user || !selectedLead) return;
    
    try {
      const bookingId = `BW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 1. Create the booking entry (with status ready for M-Pesa tracking)
      await addDoc(collection(db, 'bookings'), {
        bookingId: bookingId,
        guest: selectedLead.name || 'Unknown Guest',
        unit: convertData.unitName || 'Custom Unit',
        unitId: convertData.unitId || '',
        checkIn: convertData.checkIn || 'TBD',
        checkOut: convertData.checkOut || 'TBD',
        idNumber: convertData.idNumber || '',
        total: Number(convertData.originalPrice) || Number(convertData.total) || 0,
        actualAmount: Number(convertData.total) || 0,
        status: convertData.status || 'Pending', 
        channel: 'Direct / CRM',
        tenantId: user.tenantId || 'global',
        leadId: selectedLead.id || '',
        createdAt: serverTimestamp()
      });

      // 2. Update the Lead status to 'Converted'
      await updateDoc(doc(db, 'leads', selectedLead.id), {
        status: 'Converted',
        updatedAt: serverTimestamp()
      });

      setIsConverting(false);
      setSelected(null); // Close detail panel
      alert("Lead successfully converted to Booking!");
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert lead.");
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading CRM data...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--title-color)', marginBottom: '0.4rem', fontFamily: 'var(--font-playfair)' }}>Leads & CRM</h1>
          <p style={{ color: 'var(--muted)' }}>Track potential guests, land buyers and service enquiries.</p>
        </div>
        <button className="premium-button" style={{ background: 'var(--primary-green)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
          + Add Lead
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Leads', value: leads.length, color: 'var(--primary-gold)' },
          { label: '🔥 Hot', value: leads.filter(l => l.status === 'Hot').length, color: '#ef4444' },
          { label: '☀️ Warm', value: leads.filter(l => l.status === 'Warm').length, color: '#f59e0b' },
          { label: '❄️ Cold', value: leads.filter(l => l.status === 'Cold').length, color: '#6366f1' },
          { label: '✅ Converted', value: leads.filter(l => l.status === 'Converted').length, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.25rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div 
        className="mobile-stack"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: selectedLead ? '1fr 380px' : '1fr', 
          gap: '1.5rem', 
          alignItems: 'start' 
        }}
      >
        {/* Leads list */}
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['All', 'Hot', 'Warm', 'Cold', 'Converted'].map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setCurrentPage(1); }}
                  style={{
                    padding: '0.45rem 1.1rem', borderRadius: '999px', border: '1px solid var(--card-border)',
                    background: filter === f ? 'var(--primary-green)' : 'var(--card-bg)',
                    color: filter === f ? 'white' : 'var(--foreground)',
                    fontWeight: 500, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {paginatedLeads.map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelected(selected === lead.id ? null : lead.id)}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem', background: 'var(--card-bg)', borderRadius: '10px',
                  border: `1px solid ${selected === lead.id ? 'var(--primary-green)' : 'var(--card-border)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: selected === lead.id ? 'var(--shadow-md)' : 'none',
                }}
                onMouseEnter={e => { if (selected !== lead.id) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary-gold)'; }}
                onMouseLeave={e => { if (selected !== lead.id) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--card-border)'; }}
              >
                {/* Avatar */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0,
                }}>
                  {lead.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</p>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                      flexShrink: 0, ...statusColor[lead.status],
                    }}>
                      {lead.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lead.interest} · {lead.source} · {lead.date}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</p>
              <p>No leads found.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {filtered.length > ITEMS_PER_PAGE && (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              marginTop: '1.5rem', padding: '1rem 1.25rem', 
              background: 'var(--card-bg)', borderRadius: '12px', 
              border: '1px solid var(--card-border)' 
            }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  background: currentPage === 1 ? 'var(--background)' : 'var(--primary-green)',
                  color: currentPage === 1 ? 'var(--muted)' : 'white',
                  border: '1px solid var(--card-border)', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                ← Previous
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      background: page === currentPage ? 'var(--primary-gold)' : 'var(--background)',
                      color: page === currentPage ? 'white' : 'var(--foreground)',
                      border: '1px solid var(--card-border)'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  background: currentPage === totalPages ? 'var(--background)' : 'var(--primary-green)',
                  color: currentPage === totalPages ? 'var(--muted)' : 'white',
                  border: '1px solid var(--card-border)', fontSize: '0.85rem', opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedLead && (
          <div className="glass-card" style={{
            padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px',
            border: '1px solid var(--card-border)', position: 'sticky', top: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', color: 'var(--title-color)', marginBottom: '0.25rem', fontFamily: 'var(--font-playfair)' }}>{selectedLead.name}</h2>
                <span style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, ...statusColor[selectedLead.status] }}>
                  {selectedLead.status} Lead
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--muted)', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            {[
              ['📧 Email', selectedLead.email],
              ['📱 Phone', selectedLead.phone],
              ['🎯 Interest', selectedLead.interest],
              ['🛏️ Bedrooms', selectedLead.bedrooms || 'Not specified'],
              ['💰 Budget', selectedLead.budget ? `KES ${selectedLead.budget}` : 'Not specified'],
              ['📍 Location', selectedLead.location || 'Not specified'],
              ['🏠 Unit', selectedLead.unit],
              ['📣 Source', selectedLead.source],
              ['📅 Date', selectedLead.date],
            ].map(([label, value]) => (
              <div key={label as string} style={{ marginBottom: '0.9rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>{label}</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--foreground)', fontWeight: 500 }}>{value}</p>
              </div>
            ))}

            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>📝 Notes</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', lineHeight: 1.7, background: 'var(--background)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>{selectedLead.notes}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <a 
                href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`} 
                style={{ flex: 1, padding: '0.75rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                📞 Follow Up
              </a>
              {selectedLead.status !== 'Converted' ? (
                <button onClick={handleOpenConversion} style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: 'var(--primary-green)', border: '1px solid var(--primary-green)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  Convert to Booking
                </button>
              ) : (
                <button disabled style={{ flex: 1, padding: '0.75rem', background: '#e5e5e5', color: '#888', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'not-allowed', fontSize: '0.85rem' }}>
                  Converted ✓
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conversion Modal */}
      {isConverting && selectedLead && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '15px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--card-border)' }}>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '1.5rem', fontSize: '1.5rem', fontFamily: 'var(--font-playfair)' }}>Convert Lead to Booking</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Guest Name</label>
              <input type="text" readOnly value={selectedLead.name} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Assign Unit</label>
              <select 
                value={convertData.unitId} 
                onChange={e => {
                  const u = availableUnits.find(x => x.id === e.target.value);
                  setConvertData({
                    ...convertData, 
                    unitId: e.target.value, 
                    unitName: u ? u.name : '',
                    originalPrice: u ? u.price : 0,
                    total: u ? u.price : convertData.total
                  });
                }}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="">Select a unit...</option>
                {availableUnits.map(u => (
                  <option key={u.id} value={u.id}>{u.name} (KES {u.price})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>National ID / Passport</label>
              <input type="text" value={convertData.idNumber} onChange={e => setConvertData({...convertData, idNumber: e.target.value})} placeholder="ID or Passport Number" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Check In</label>
                <input type="date" value={convertData.checkIn} onChange={e => setConvertData({...convertData, checkIn: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Check Out</label>
                <input type="date" value={convertData.checkOut} onChange={e => setConvertData({...convertData, checkOut: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Standard Price</label>
                <input type="number" readOnly value={convertData.originalPrice} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--muted)', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Agreed Price (KES)</label>
                <input type="number" value={convertData.total} onChange={e => setConvertData({...convertData, total: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--primary-gold)', background: 'var(--background)', color: 'var(--foreground)', fontWeight: 'bold' }} />
                {convertData.total < convertData.originalPrice && (
                  <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.3rem' }}>* Discount applied</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Payment Tracking</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="radio" id="pending" checked={convertData.status === 'Pending'} onChange={() => setConvertData({...convertData, status: 'Pending'})} />
                <label htmlFor="pending" style={{ fontSize: '0.85rem', flex: 1, color: 'var(--foreground)' }}>Pending M-Pesa Confirmation</label>
                
                <input type="radio" id="confirmed" checked={convertData.status === 'Confirmed'} onChange={() => setConvertData({...convertData, status: 'Confirmed'})} />
                <label htmlFor="confirmed" style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>Paid (Confirmed)</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setIsConverting(false)} style={{ flex: 1, padding: '0.9rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: 'var(--foreground)' }}>Cancel</button>
              <button onClick={executeConversion} style={{ flex: 2, padding: '0.9rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Generate Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
