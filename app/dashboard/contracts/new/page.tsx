'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import SignaturePad from '@/components/SignaturePad';
import Link from 'next/link';

import { sendContractNotification } from '@/lib/email';

export default function NewContractPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [signature, setSignature] = useState('');
  
  const [contract, setContract] = useState({
    title: '',
    type: 'Lease Agreement',
    stakeholderName: '',
    stakeholderEmail: '',
    content: '',
    status: 'Pending'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    
    if (!signature) {
      alert("Please provide your signature before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      const contractData = {
        title: contract.title,
        type: contract.type,
        content: contract.content,
        createdBy: user.uid,
        creatorName: user.displayName || 'Bewa Host',
        creatorEmail: user.email,
        stakeholderName: contract.stakeholderName,
        stakeholderEmail: contract.stakeholderEmail,
        stakeholderEmails: [contract.stakeholderEmail], // Supporting array for future expansion
        signatures: [
          {
            email: user.email,
            name: user.displayName || 'Creator',
            uid: user.uid,
            dataUrl: signature,
            signedAt: new Date().toISOString(),
          }
        ],
        tenantId: user.uid, // Keep for backward compatibility/filtering
        status: 'pending', // Pending stakeholder signature
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'contracts'), contractData);

      // Trigger notification for the stakeholder
      try {
        await sendContractNotification({
          title: contract.title,
          stakeholderName: contract.stakeholderName,
          stakeholderEmail: contract.stakeholderEmail,
          status: 'Created & Signed by Host'
        });
      } catch (emailErr) {
        console.error("Notification trigger failed:", emailErr);
      }
      
      alert("Contract created and signed by you. Notification dispatched to stakeholder.");
      router.push('/dashboard/contracts');
    } catch (err) {
      console.error("Error creating contract:", err);
      alert("Failed to create contract.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '3rem' }}>
        <Link href="/dashboard/contracts" style={{ color: 'var(--primary-gold)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Back to Contracts
        </Link>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>Create New E-File</h1>
        <p style={{ color: 'var(--muted)' }}>Generate a legally binding digital document and sign it instantly.</p>
      </header>      <section className="glass-card" style={{ background: 'var(--card-bg)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-lg)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Document Identity</label>
              <input 
                type="text" required value={contract.title} 
                onChange={e => setContract({...contract, title: e.target.value})} 
                placeholder="e.g. Residential Lease Agreement - Unit 4B"
                style={{ width: '100%', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Contract Category</label>
              <select 
                value={contract.type} 
                onChange={e => setContract({...contract, type: e.target.value})}
                style={{ width: '100%', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
              >
                <option>Lease Agreement</option>
                <option>Service Contract</option>
                <option>Management Agreement</option>
                <option>Inventory Handover</option>
                <option>Sales Agreement</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Stakeholder Full Name</label>
              <input 
                type="text" required value={contract.stakeholderName} 
                onChange={e => setContract({...contract, stakeholderName: e.target.value})} 
                placeholder="The party signing the document"
                style={{ width: '100%', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }} 
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Stakeholder Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" required value={contract.stakeholderEmail} 
                  onChange={e => setContract({...contract, stakeholderEmail: e.target.value})} 
                  placeholder="Official email for digital delivery"
                  style={{ width: '100%', padding: '1.2rem 1.2rem 1.2rem 3rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }} 
                />
                <div style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>An invitation to sign will be sent to this email immediately upon creation.</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Contractual Terms & Provisions</label>
            <textarea 
              required value={contract.content} 
              onChange={e => setContract({...contract, content: e.target.value})} 
              placeholder="Enter the full text of your agreement here..."
              style={{ width: '100%', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '300px', fontSize: '0.95rem', fontFamily: 'inherit', lineHeight: '1.7', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} 
            />
          </div>

          <div style={{ padding: '2.5rem', background: 'rgba(0,48,40,0.02)', borderRadius: '20px', border: '1px dashed var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 700, color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Authorized Signature</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Sign within the frame using your mouse or touch device.</p>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#059669', borderRadius: '50%' }}></span>
                SECURE CHANNEL
              </div>
            </div>
            
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
              <SignaturePad onSave={(data) => setSignature(data)} onClear={() => setSignature('')} />
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '1.5rem', lineHeight: '1.5' }}>
              By providing your signature, you acknowledge that this is an <strong>enforceable digital agreement</strong> under the Electronic Transactions Act. Your IP address and timestamp will be recorded for audit purposes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
            <button 
              type="submit" disabled={isSaving}
              className="premium-button" 
              style={{ flex: 1, padding: '1.2rem', fontSize: '1rem' }}
            >
              {isSaving ? 'Authenticating & Saving...' : 'Sign & Dispatch E-File'}
            </button>
            <button 
              type="button"
              onClick={() => router.push('/dashboard/contracts')}
              className="premium-button-outline" 
              style={{ padding: '1.2rem 2.5rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>

      <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '2rem' }}>⚖️</div>
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--title-color)', marginBottom: '0.5rem', fontWeight: 700 }}>Legal & Compliance Note</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.6' }}>
            Bewa Homes E-Files are designed to meet international standards for electronic signatures. Each document generates a unique hash and audit trail. For sensitive high-value transactions, we recommend consulting with legal counsel to ensure specific local regulatory compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
