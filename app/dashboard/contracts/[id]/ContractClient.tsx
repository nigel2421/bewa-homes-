'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import SignaturePad from '@/components/SignaturePad';
import Image from 'next/image';
import { sendContractNotification } from '@/lib/email';

export default function ContractClient() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, 'contracts', id as string), (snap) => {
      if (snap.exists()) {
        setContract({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  const handleSaveSignature = async (dataUrl: string) => {
    if (!user || !contract) return;
    setIsSigning(true);

    try {
      const signatureEntry = {
        email: user.email,
        name: user.displayName,
        uid: user.uid,
        dataUrl: dataUrl,
        signedAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'contracts', contract.id);
      
      // Update signatures array
      await updateDoc(docRef, {
        signatures: arrayUnion(signatureEntry),
        status: contract.stakeholderEmails.length + 1 === (contract.signatures?.length || 0) + 1 ? 'signed' : 'pending'
      });

      // Send email notifications to all stakeholders and the creator
      const recipients = [contract.creatorEmail, ...contract.stakeholderEmails].filter(email => email !== user.email);
      
      if (recipients.length > 0) {
        await sendContractNotification({
          to: recipients,
          contractTitle: contract.title,
          signerName: user.displayName || 'A stakeholder',
          contractUrl: window.location.href,
        });
      }

      setShowSignaturePad(false);
      alert('Document signed successfully!');
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Failed to save signature.');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading document...</div>;
  if (!contract) return <div style={{ padding: '2rem' }}>Document not found.</div>;

  const userHasSigned = contract.signatures?.some((s: any) => s.email === user?.email);
  const isStakeholder = contract.stakeholderEmails?.includes(user?.email) || contract.createdBy === user?.uid;

  return (
    <div className="view-contract-container">
      <div className="contract-paper">
        {/* Letterhead */}
        <div className="letterhead">
          <div className="letterhead-logo">
            <Image src="/bewa-logo.png" alt="BEWA HOMES" width={150} height={60} style={{ objectFit: 'contain' }} />
          </div>
          <div className="letterhead-info">
            <p><strong>BEWA HOMES LIMITED</strong></p>
            <p>Premium Real Estate & Property Management</p>
            <p>Nairobi, Kenya</p>
            <p>legal@bewahomes.com | www.bewahomes.com</p>
          </div>
        </div>

        <div className="contract-divider" />

        <div className="contract-body">
          <h1 className="contract-title">{contract.title}</h1>
          <div className="contract-meta">
            <span>Ref: {contract.id?.slice(0, 8).toUpperCase()}</span>
            <span>Date: {new Date(contract.createdAt).toLocaleDateString()}</span>
            <span>Status: <span className={`status-badge ${contract.status}`}>{contract.status?.toUpperCase()}</span></span>
          </div>

          <div 
            className="contract-content"
            dangerouslySetInnerHTML={{ __html: contract.content }}
          />

          <div className="signatures-section">
            <h3 style={{ marginBottom: '2rem', fontFamily: 'var(--font-playfair)' }}>Execution & Signatures</h3>
            <div className="signatures-grid">
              {/* Creator Signature */}
              <div className="signature-box">
                <p className="signature-label">Prepared By (Lessor/Agent)</p>
                <div className="signature-area">
                  {contract.creatorSignature ? (
                    <img src={contract.creatorSignature} alt="Creator Signature" style={{ maxHeight: '80px' }} />
                  ) : (
                    <div className="no-signature">Pending</div>
                  )}
                </div>
                <p className="signature-name">{contract.creatorName}</p>
                <p className="signature-date">{new Date(contract.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Stakeholder Signatures */}
              {contract.signatures?.map((sig: any, idx: number) => (
                <div key={idx} className="signature-box">
                  <p className="signature-label">Accepted By (Lessee/Party)</p>
                  <div className="signature-area">
                    <img src={sig.dataUrl} alt={`Signature by ${sig.name}`} style={{ maxHeight: '80px' }} />
                  </div>
                  <p className="signature-name">{sig.name}</p>
                  <p className="signature-date">{new Date(sig.signedAt).toLocaleDateString()}</p>
                </div>
              ))}

              {/* Action for current user if they haven't signed and are a stakeholder */}
              {!userHasSigned && contract.stakeholderEmails?.includes(user?.email) && (
                <div className="signature-box action-required">
                  <p className="signature-label">Your Signature Required</p>
                  <div className="signature-area">
                    <button 
                      onClick={() => setShowSignaturePad(true)}
                      className="premium-button"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      Sign Document
                    </button>
                  </div>
                  <p className="signature-name">{user?.displayName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="contract-footer">
          <p>This document is electronically generated and legally binding upon electronic signature.</p>
          <p>© {new Date().getFullYear()} Bewa Homes Limited. All rights reserved.</p>
        </div>
      </div>

      {showSignaturePad && (
        <div className="signature-modal-overlay">
          <div className="signature-modal">
            <h3>Sign Contract</h3>
            <SignaturePad
              onSave={handleSaveSignature}
            />
            <button 
              onClick={() => setShowSignaturePad(false)}
              className="premium-button-outline"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        .view-contract-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .contract-paper {
          background: white;
          padding: 4rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border-radius: 4px;
          color: #1a1a1a;
        }

        .letterhead {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .letterhead-info {
          text-align: right;
          font-size: 0.85rem;
          color: #666;
          line-height: 1.4;
        }

        .letterhead-info p {
          margin: 0;
        }

        .contract-divider {
          height: 2px;
          background: #1a1a1a;
          margin-bottom: 3rem;
        }

        .contract-meta {
          display: flex;
          gap: 2rem;
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 3rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .status-badge.signed { background: #e8f5e9; color: #2e7d32; }
        .status-badge.pending { background: #fff3e0; color: #ef6c00; }

        .contract-title {
          font-family: var(--font-playfair);
          font-size: 2.2rem;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }

        .contract-content {
          line-height: 1.8;
          font-size: 1.05rem;
          margin-bottom: 4rem;
          color: #333;
        }

        .contract-content h1, .contract-content h2, .contract-content h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .signatures-section {
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 2px solid #1a1a1a;
        }

        .signatures-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 3rem;
        }

        .signature-box {
          border-bottom: 1px solid #ccc;
          padding-bottom: 1rem;
        }

        .signature-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #888;
          letter-spacing: 1px;
          margin-bottom: 1rem;
        }

        .signature-area {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .no-signature {
          color: #ccc;
          font-style: italic;
          font-size: 0.9rem;
        }

        .signature-name {
          font-weight: 600;
          margin: 0;
        }

        .signature-date {
          font-size: 0.8rem;
          color: #999;
          margin: 0;
        }

        .action-required {
          border: 1px dashed var(--primary-gold);
          padding: 1.5rem;
          background: #fffdf7;
          border-radius: 8px;
        }

        .contract-footer {
          margin-top: 5rem;
          text-align: center;
          font-size: 0.75rem;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 2rem;
        }

        .signature-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .signature-modal {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .signature-modal h3 {
          margin-bottom: 1.5rem;
          font-family: var(--font-playfair);
        }

        @media (max-width: 768px) {
          .contract-paper { padding: 2rem; }
          .signatures-grid { grid-template-columns: 1fr; }
          .letterhead { flex-direction: column; gap: 1.5rem; }
          .letterhead-info { text-align: left; }
        }

        @media print {
          .view-contract-container { padding: 0; background: white; }
          .contract-paper { box-shadow: none; padding: 0; }
          .premium-button, .premium-button-outline { display: none; }
        }
      `}</style>
    </div>
  );
}
