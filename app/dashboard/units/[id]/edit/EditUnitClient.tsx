'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import { AMENITIES, PROPERTY_TYPES as propertyTypes } from '@/lib/constants';


export default function EditUnitClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = use(params);
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');
  const { user } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingUnits, setExistingUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<{ id: string; businessName?: string }[]>([]);

  // For static export, handle dynamic IDs by looking at search params first, then the URL path
  const id = urlId || ((typeof window !== 'undefined' && (paramId === 'edit' || paramId === 'view' || !paramId)) 
    ? window.location.pathname.split('/').filter(Boolean).reverse().find((part, i, arr) => arr[i-1] === 'edit' || arr[i+1] === 'units') || paramId
    : paramId);

  if (typeof window !== 'undefined') console.log('[EditUnitDebug] paramId:', paramId, 'urlId:', urlId, 'Final ID:', id, 'Pathname:', window.location.pathname);

  const [unit, setUnit] = useState({
    name: '',
    type: 'Apartment',
    location: '',
    latitude: -1.286389,
    longitude: 36.817223,
    price: '',
    occupancy: 'Vacant',
    status: 'Active',
    images: [] as string[],
    amenities: [] as string[],
    inventory: [] as { id: string, name: string, quantity: number, condition: string }[],
    isAdminAdded: false,
    ownerId: '',
    managerId: '',
    isFeatured: false,
    accessCode: '',
    checkInInstructions: ''
  });
  
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, condition: 'Good' });

  const locationRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const referenceMarkersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!id || id === 'edit') return;
    const fetchUnit = async () => {
      try {
        const docRef = doc(db, 'units', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUnit({
            name: data.name || '',
            type: data.type || 'Apartment',
            location: data.location || '',
            latitude: data.latitude || -1.286389,
            longitude: data.longitude || 36.817223,
            price: data.price ? String(data.price) : '',
            occupancy: data.occupancy || 'Vacant',
            status: data.status || 'Active',
            images: data.images || [],
            amenities: data.amenities || [],
            inventory: data.inventory || [],
            isAdminAdded: data.isAdminAdded || false,
            ownerId: data.ownerId || '',
            managerId: data.managerId || '',
            isFeatured: data.isFeatured || false,
            accessCode: data.accessCode || '',
            checkInInstructions: data.checkInInstructions || ''
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching unit:", err);
        router.push('/dashboard/units');
      }
    };
    fetchUnit();
  }, [id, router]);

  useEffect(() => {
    if (!id || id === 'edit') return;
    const q = collection(db, 'units');
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .filter(doc => doc.id !== id)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setExistingUnits(docs);
    });
    return () => unsub();
  }, [id]);

  // Fetch tenants for admins
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super admin')) return;
    const q = query(collection(db, 'tenants'), orderBy('businessName', 'asc'));
    const unsubscribe = onSnapshot(q, (snap: any) => {
      setTenants(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const initGoogleMaps = () => {
    if (!mapRef.current || !window.google?.maps || !window.google.maps.Map) return;

    // Prevent double init
    if (mapRef.current.getAttribute('data-map-initialized') === 'true') return;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: unit.latitude, lng: unit.longitude },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
        });

        markerRef.current = new window.google.maps.Marker({
          position: { lat: unit.latitude, lng: unit.longitude },
          map: mapInstanceRef.current,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
          zIndex: 1000
        });

        mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) handleLocationUpdate(e.latLng.lat(), e.latLng.lng(), true);
        });

        markerRef.current.addListener('dragend', () => {
          const pos = markerRef.current?.getPosition();
          if (pos) handleLocationUpdate(pos.lat(), pos.lng(), true);
        });
      }

      if (locationRef.current && !autocompleteRef.current && window.google.maps.places) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(locationRef.current, {
          fields: ['formatted_address', 'geometry']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            handleLocationUpdate(place.geometry.location.lat(), place.geometry.location.lng(), false, place.formatted_address);
          }
        });
      }
      
      mapRef.current.setAttribute('data-map-initialized', 'true');
    } catch (err) {
      console.error('Error initializing Edit Map:', err);
    }
  };

  useEffect(() => {
    initGoogleMaps();
    
    // Fail-safe interval for script loading issues
    const timer = setInterval(() => {
      if (window.google?.maps && !mapInstanceRef.current) {
        initGoogleMaps();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, unit.latitude]); // Re-run when data arrives

  useEffect(() => {
    if (!mapInstanceRef.current || existingUnits.length === 0) return;
    referenceMarkersRef.current.forEach(m => m.setMap(null));
    referenceMarkersRef.current = [];

    existingUnits.forEach(u => {
      if (u.latitude && u.longitude) {
        const m = new window.google.maps.Marker({
          position: { lat: u.latitude, lng: u.longitude },
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#d4af37',
            fillOpacity: 0.6,
            strokeWeight: 1,
            scale: 6
          }
        });
        referenceMarkersRef.current.push(m);
      }
    });
  }, [existingUnits]);

  const handleLocationUpdate = (lat: number, lng: number, shouldGeocode: boolean, address?: string) => {
    setUnit(prev => ({ ...prev, latitude: lat, longitude: lng, location: address || prev.location }));
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      markerRef.current?.setPosition({ lat, lng });
    }
    if (shouldGeocode && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) setUnit(prev => ({ ...prev, location: results[0].formatted_address }));
      });
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'units', id), {
        ...unit,
        price: Number(unit.price),
        isAdminAdded: unit.isAdminAdded || user.role === 'admin' || user.role === 'super admin',
        accessCode: unit.accessCode || '',
        checkInInstructions: unit.checkInInstructions || '',
        updatedAt: serverTimestamp(),
      });
      router.push('/dashboard/units');
    } catch (err) {
      setIsSaving(false);
      alert("Error updating unit.");
    }
  };

  const canEdit = user && (
    user.uid === unit.ownerId || 
    user.uid === unit.managerId || 
    user.role === 'admin' || 
    user.role === 'super admin'
  );

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading Property Details...</div>;

  if (!canEdit) {
    return (
      <div style={{ padding: '5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
        <p>You do not have permission to edit this unit.</p>
        <Link href="/dashboard/units" style={{ color: 'var(--primary-gold)', marginTop: '1rem', display: 'inline-block' }}>Back to Units</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Script 
        id="google-maps-edit-main"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
        onLoad={initGoogleMaps}
      />

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Edit Property</h1>
        <p style={{ color: 'var(--muted)' }}>Update your listing information and location.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '2rem', alignItems: 'start' }}>
        <section className="glass-card" style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <form onSubmit={handleUpdateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Unit Name</label>
                <input type="text" required value={unit.name} onChange={e => setUnit({...unit, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Type</label>
                <select value={unit.type} onChange={e => setUnit({...unit, type: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                  {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Price (KES)</label>
                <input type="number" required value={unit.price} onChange={e => setUnit({...unit, price: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Availability</label>
                <select value={unit.occupancy} onChange={e => setUnit({...unit, occupancy: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                  <option value="Vacant">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>

            {/* Management Delegation */}
            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>
                Ownership & Management
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: (user?.role === 'admin' || user?.role === 'super admin') ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                {(user?.role === 'admin' || user?.role === 'super admin') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Property Owner (Tenant)</label>
                    <select 
                      value={unit.ownerId} 
                      onChange={e => setUnit({...unit, ownerId: e.target.value})}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                    >
                      <option value={user.uid}>Admin (Myself)</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.businessName || t.id}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Manager User ID (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Manager User ID"
                    value={unit.managerId} 
                    onChange={e => setUnit({...unit, managerId: e.target.value})} 
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} 
                  />
                </div>
              </div>

              {user?.role === 'super admin' && (
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="isFeatured"
                    checked={unit.isFeatured} 
                    onChange={e => setUnit({...unit, isFeatured: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isFeatured" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-gold)', cursor: 'pointer' }}>
                    ⭐ Feature this listing on the Home Page
                  </label>
                </div>
              )}
            </div>

            {/* NEW SECTION: Check-in Details */}
            <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary-gold)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: 'var(--primary-gold)', fontFamily: 'var(--font-playfair)' }}>
                🔐 Automated Check-in Details
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Door Lock / Access Code</label>
                  <input 
                    type="text" 
                    value={unit.accessCode} 
                    onChange={e => setUnit({...unit, accessCode: e.target.value})} 
                    placeholder="e.g. 1234 or A-567"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Check-in Instructions</label>
                  <textarea 
                    value={unit.checkInInstructions} 
                    onChange={e => setUnit({...unit, checkInInstructions: e.target.value})} 
                    placeholder="Tell guests how to find the key or use the smart lock..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }} 
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                * These details will be automatically sent to guests via email when their booking is confirmed.
              </p>
            </div>

            {/* Amenities Checklist */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
                Amenities &amp; Features
                <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem' }}>({unit.amenities.length} selected)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
                {AMENITIES.map(a => {
                  const checked = unit.amenities.includes(a.id);
                  return (
                    <label key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                      border: checked ? '1.5px solid var(--primary-green)' : '1px solid var(--card-border)',
                      background: checked ? 'rgba(0, 77, 64, 0.1)' : 'var(--background)',
                      fontSize: '0.82rem', fontWeight: checked ? 600 : 400,
                      color: checked ? 'var(--primary-green)' : 'var(--foreground)',
                      transition: 'all 0.15s ease'
                    }}>
                      <input type="checkbox" checked={checked}
                        onChange={() => setUnit(prev => ({
                          ...prev,
                          amenities: checked
                            ? prev.amenities.filter(id => id !== a.id)
                            : [...prev.amenities, a.id]
                        }))}
                        style={{ display: 'none' }}
                      />
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Asset & Inventory Management */}
            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>
                Asset &amp; Inventory Tracker
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '0.5rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--foreground)' }}>Item Name (e.g. Samsung TV)</label>
                  <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--foreground)' }}>Qty</label>
                  <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--foreground)' }}>Condition</label>
                  <select value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}>
                    <option>New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Requires Repair</option>
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (!newItem.name) return;
                    setUnit(prev => ({
                      ...prev,
                      inventory: [...prev.inventory, { id: Date.now().toString(), ...newItem }]
                    }));
                    setNewItem({ name: '', quantity: 1, condition: 'Good' });
                  }}
                  style={{ padding: '0.65rem 1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Add
                </button>
              </div>

              {unit.inventory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {unit.inventory.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, minWidth: '150px', color: 'var(--foreground)' }}>{item.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Qty: {item.quantity}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '999px', background: item.condition === 'Requires Repair' ? '#fee2e2' : '#e0f2fe', color: item.condition === 'Requires Repair' ? '#991b1b' : '#0369a1', fontWeight: 600 }}>{item.condition}</span>
                      </div>
                      <button type="button" onClick={() => setUnit(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== item.id) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Remove</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>No items added to inventory yet.</p>
              )}
            </div>

            {user && (
              <ImageUploader 
                ownerId={user.uid}
                existingImages={unit.images}
                onUploadComplete={(urls) => setUnit(prev => ({ ...prev, images: urls }))} 
              />
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" disabled={isSaving} className="premium-button" style={{ flex: 1, padding: '1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                {isSaving ? 'Updating...' : 'Save Changes'}
              </button>
              <Link href="/dashboard/units" style={{ padding: '1rem', border: '1px solid var(--card-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--muted)', textAlign: 'center', background: 'var(--card-bg)' }}>Cancel</Link>
            </div>
          </form>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />
          <div style={{ padding: '1rem', borderRadius: '15px', background: 'var(--background)', border: '1px solid var(--card-border)', fontSize: '0.85rem' }}>
             <p style={{ color: 'var(--foreground)' }}>📍 {unit.latitude.toFixed(6)}, {unit.longitude.toFixed(6)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
