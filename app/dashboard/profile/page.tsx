'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ImageUploader from '@/components/ImageUploader';

export default function HostProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    logo: '',
    website: '',
    phone: '',
    tiktok: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: ''
  });

  const fields = ['name', 'bio', 'logo', 'website', 'phone', 'tiktok', 'facebook', 'twitter', 'instagram', 'youtube'];
  const filledCount = fields.filter(f => !!profile[f as keyof typeof profile]).length;
  // If at least 8 fields (80%) are filled, show 100%
  const completionPercent = filledCount >= 8 ? 100 : Math.round((filledCount / 8) * 100);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'tenants', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(prev => ({ ...prev, ...docSnap.data() }));
        } else {
          // Initialize with user display name if profile doesn't exist
          setProfile(prev => ({ ...prev, name: user.displayName || '' }));
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'tenants', user.uid), {
        ...profile,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncStats = async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    try {
      const { collection, getDocs, query, where, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      
      const unitSnap = await getDocs(query(collection(db, 'units'), where('ownerId', '==', user.uid)));
      const units = unitSnap.docs.map(d => d.data());
      const leadSnap = await getDocs(query(collection(db, 'leads'), where('tenantId', '==', user.uid)));
      
      const active = units.filter(u => u.status !== 'Inactive').length;
      const occupied = units.filter(u => u.occupancy === 'Occupied');
      const revenue = occupied.reduce((sum, u) => sum + Number(u.price || 0), 0);

      await setDoc(doc(db, 'tenants', user.uid, 'aggregates', 'stats'), {
        activeUnits: active,
        occupiedUnits: occupied.length,
        revenue,
        leads: leadSnap.size,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert("Dashboard stats synchronized!");
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to sync stats.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading your profile...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>Brand Profile</h1>
          <p style={{ color: 'var(--muted)' }}>Manage how your portfolio appears to guests in the marketplace.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
               <span style={{ fontSize: '0.85rem', fontWeight: 600, color: completionPercent === 100 ? '#10b981' : 'var(--primary-gold)' }}>
                 {completionPercent}% Profile Complete
               </span>
               <div style={{ width: '120px', height: '8px', background: 'var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
                 <div style={{ width: `${completionPercent}%`, height: '100%', background: completionPercent === 100 ? '#10b981' : 'var(--primary-gold)', transition: 'width 0.5s ease' }}></div>
               </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {filledCount < 8 ? `${8 - filledCount} more fields for 100%` : 'Profile is optimized!'}
            </p>
          </div>
          <button 
            onClick={handleSyncStats} 
            disabled={isSyncing}
            style={{ padding: '0.6rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--foreground)' }}
          >
            {isSyncing ? 'Syncing...' : '🔄 Sync Dashboard Stats'}
          </button>
        </div>
      </header>

      <section className="glass-card" style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Business Name</label>
              <input 
                type="text" required value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
                placeholder="e.g. Nigel Luxury Homes"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Official Website (Optional)</label>
              <input 
                type="url" value={profile.website} 
                onChange={e => setProfile({...profile, website: e.target.value})} 
                placeholder="https://..."
                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Business Phone Number</label>
              <input 
                type="tel" value={profile.phone} 
                onChange={e => setProfile({...profile, phone: e.target.value})} 
                placeholder="e.g. +254 712 345 678"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Business Bio</label>
            <textarea 
              value={profile.bio} 
              onChange={e => setProfile({...profile, bio: e.target.value})} 
              placeholder="Tell guests about your services and hospitality standards..."
              style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '120px', fontFamily: 'inherit' }} 
            />
          </div>

          <div>
             <ImageUploader 
                ownerId={user!.uid}
                existingImages={profile.logo ? [profile.logo] : []}
                onUploadComplete={(urls) => setProfile(prev => ({ ...prev, logo: urls[0] || '' }))}
             />
             <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>Upload your business logo or a professional profile picture.</p>
          </div>

          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.2rem', color: 'var(--foreground)' }}>Social Media & Video Presence</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Link your social accounts to help guests see your content and build trust.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>TikTok URL</label>
                <input 
                  type="url" value={profile.tiktok || ''} 
                  onChange={e => setProfile({...profile, tiktok: e.target.value})} 
                  placeholder="https://tiktok.com/@youraccount"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Instagram URL</label>
                <input 
                  type="url" value={profile.instagram || ''} 
                  onChange={e => setProfile({...profile, instagram: e.target.value})} 
                  placeholder="https://instagram.com/youraccount"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Facebook Page URL</label>
                <input 
                  type="url" value={profile.facebook || ''} 
                  onChange={e => setProfile({...profile, facebook: e.target.value})} 
                  placeholder="https://facebook.com/yourpage"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>Twitter / X URL</label>
                <input 
                  type="url" value={profile.twitter || ''} 
                  onChange={e => setProfile({...profile, twitter: e.target.value})} 
                  placeholder="https://x.com/youraccount"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} 
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--muted)' }}>YouTube Channel / Showcase Video</label>
                <input 
                  type="url" value={profile.youtube || ''} 
                  onChange={e => setProfile({...profile, youtube: e.target.value})} 
                  placeholder="https://youtube.com/@yourchannel"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem' }} 
                />
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
            <button 
              type="submit" disabled={isSaving}
              className="premium-button" 
              style={{ padding: '1.2rem 3rem', fontSize: '1rem' }}
            >
              {isSaving ? 'Saving Changes...' : 'Update Public Profile'}
            </button>
          </div>
        </form>
      </section>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <p style={{ color: 'var(--primary-gold)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Pro Tip ✨</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          A complete profile with a logo and bio increases guest trust by up to 40%. 
          Make sure to highlight what makes your properties unique.
        </p>
      </div>
    </div>
  );
}
