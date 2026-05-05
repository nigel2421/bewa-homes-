'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';

import { AMENITIES, PROPERTY_TYPES as propertyTypes } from '@/lib/constants';


export default function AddUnitPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [existingUnits, setExistingUnits] = useState<any[]>([]);
  const [newUnit, setNewUnit] = useState({
    name: '',
    type: 'Apartment',
    location: '',
    latitude: -1.286389, // Default Nairobi
    longitude: 36.817223,
    price: '',
    occupancy: 'Vacant',
    status: 'Active',
    images: [] as string[],
    amenities: [] as string[],
    inventory: [] as { id: string, name: string, quantity: number, condition: string }[],
    managerId: '',
    ownerId: '',
    isFeatured: false,
    accessCode: '',
    checkInInstructions: ''
  });

  const [tenants, setTenants] = useState<{ id: string; businessName?: string }[]>([]);

  
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, condition: 'Good' });

  const locationRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const addressSectionRef = useRef<HTMLElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const referenceMarkersRef = useRef<google.maps.Marker[]>([]);

  // Fetch existing units for reference
  useEffect(() => {
    const q = collection(db, 'units');
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExistingUnits(docs);
    });
    return () => unsub();
  }, []);

  // Fetch tenants for admins
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super admin')) return;
    const q = query(collection(db, 'tenants'), orderBy('businessName', 'asc'));
    const unsubscribe = onSnapshot(q, (snap: any) => {
      setTenants(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Initialize ownerId based on selection
  useEffect(() => {
    if (user && !newUnit.ownerId) {
      setNewUnit(prev => ({ 
        ...prev, 
        ownerId: (user.role === 'admin' || user.role === 'super admin') && user.selectedTenantId 
          ? user.selectedTenantId 
          : user.uid 
      }));
    }
  }, [user, user?.selectedTenantId, newUnit.ownerId]);

  // Trigger initialization if script is already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      initGoogleMaps();
    }
  }, []);

  // Fix Google Autocomplete Dropdown Positioning
  useEffect(() => {
    const fixPacContainer = () => {
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer && addressSectionRef.current && !addressSectionRef.current.contains(pacContainer)) {
        addressSectionRef.current.appendChild(pacContainer);
      }
    };
    
    const interval = setInterval(fixPacContainer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Map and Autocomplete
  const initGoogleMaps = () => {
    if (!mapRef.current || !window.google?.maps || !window.google.maps.Map) return;
    if (mapRef.current.getAttribute('data-map-initialized') === 'true') return;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: newUnit.latitude, lng: newUnit.longitude },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        });

        markerRef.current = new window.google.maps.Marker({
          position: { lat: newUnit.latitude, lng: newUnit.longitude },
          map: mapInstanceRef.current,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
          title: "New Property Location",
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
      console.error('Error initializing Dashboard Map:', err);
    }
  };

  useEffect(() => {
    initGoogleMaps();
    const timer = setInterval(() => {
      if (window.google?.maps && !mapInstanceRef.current) {
        initGoogleMaps();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Draw reference markers
  useEffect(() => {
    if (!mapInstanceRef.current || existingUnits.length === 0) return;
    referenceMarkersRef.current.forEach(m => m.setMap(null));
    referenceMarkersRef.current = [];

    existingUnits.forEach(unit => {
      if (unit.latitude && unit.longitude) {
        const m = new window.google.maps.Marker({
          position: { lat: unit.latitude, lng: unit.longitude },
          map: mapInstanceRef.current,
          title: unit.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#d4af37',
            fillOpacity: 0.6,
            strokeWeight: 1,
            strokeColor: '#FFFFFF',
            scale: 6
          }
        });
        referenceMarkersRef.current.push(m);
      }
    });
  }, [existingUnits]);

  const handleLocationUpdate = (lat: number, lng: number, shouldGeocode: boolean, address?: string) => {
    setNewUnit(prev => ({ ...prev, latitude: lat, longitude: lng, location: address || prev.location }));
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      markerRef.current?.setPosition({ lat, lng });
    }
    if (shouldGeocode && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setNewUnit(prev => ({ ...prev, location: results[0].formatted_address }));
        }
      });
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'units'), {
        ...newUnit,
        price: Number(newUnit.price),
        ownerId: newUnit.ownerId || user.uid,
        isAdminAdded: user.role === 'admin' || user.role === 'super admin',
        isFeatured: newUnit.isFeatured || false,
        accessCode: newUnit.accessCode || '',
        checkInInstructions: newUnit.checkInInstructions || '',
        createdAt: serverTimestamp(),
      });
      router.push('/dashboard/units');
    } catch (err) {
      setIsSaving(false);
      alert("Error adding unit. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Script 
        id="google-maps-add"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
        onLoad={initGoogleMaps}
      />

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Create Listing</h1>
        <p style={{ color: 'var(--muted)' }}>Pin your property on the map for maximum visibility.</p>
      </header>

      <form onSubmit={handleAddUnit} className="dashboard-grid-container">
        {/* SECTION 1: Unit Info */}
        <section className="glass-card form-section-info" style={{ padding: '2rem', borderRadius: '20px' }}>
          <div className="form-row-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Unit Name</label>
              <input type="text" required value={newUnit.name} onChange={e => setNewUnit({...newUnit, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Type</label>
              <select value={newUnit.type} onChange={e => setNewUnit({...newUnit, type: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row-2" style={{ marginTop: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Price per Night (KES)</label>
              <input type="number" required value={newUnit.price} onChange={e => setNewUnit({...newUnit, price: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Availability</label>
              <select value={newUnit.occupancy} onChange={e => setNewUnit({...newUnit, occupancy: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                <option value="Vacant">Available</option>
                <option value="Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
        </section>

        {/* NEW SECTION: Management */}
        <section className="glass-card" style={{ padding: '2rem', borderRadius: '20px', marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--title-color)', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>Ownership & Management</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: (user?.role === 'admin' || user?.role === 'super admin') ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
            {(user?.role === 'admin' || user?.role === 'super admin') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Property Owner (Tenant)</label>
                <select 
                  value={newUnit.ownerId} 
                  onChange={e => setNewUnit({...newUnit, ownerId: e.target.value})}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                >
                  <option value={user.uid}>Myself (Admin)</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.businessName || t.id}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Manager User ID (Optional)</label>
              <input 
                type="text" 
                value={newUnit.managerId} 
                onChange={e => setNewUnit({...newUnit, managerId: e.target.value})} 
                placeholder="Enter the manager's User ID"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} 
              />
            </div>
          </div>
          
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
            Assign the property to a specific tenant and optionally a manager. They will see it in their respective dashboards.
          </p>

          {user?.role === 'super admin' && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input 
                type="checkbox" 
                id="isFeatured"
                checked={newUnit.isFeatured} 
                onChange={e => setNewUnit({...newUnit, isFeatured: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="isFeatured" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-gold)', cursor: 'pointer' }}>
                ⭐ Feature this listing on the Home Page
              </label>
            </div>
          )}

          {/* NEW SECTION: Check-in Details */}
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', border: '1px solid var(--primary-gold)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary-gold)', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
              🔐 Automated Check-in Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>
                  Door Lock / Access Code
                </label>
                <input 
                  type="text" 
                  value={newUnit.accessCode} 
                  onChange={e => setNewUnit({...newUnit, accessCode: e.target.value})} 
                  placeholder="e.g. 1234 or A-567"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--foreground)' }}>
                  Check-in Instructions
                </label>
                <textarea 
                  value={newUnit.checkInInstructions} 
                  onChange={e => setNewUnit({...newUnit, checkInInstructions: e.target.value})} 
                  placeholder="Tell guests how to find the key or use the smart lock..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)', minHeight: '100px', resize: 'vertical' }} 
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.8rem' }}>
              * These details will be automatically sent to guests via email when their booking is confirmed.
            </p>
          </div>
        </section>


        {/* SECTION 2: Address Search */}
        <section ref={addressSectionRef} className="glass-card form-section-address" style={{ padding: '2rem', borderRadius: '20px', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Address</label>
          <input ref={locationRef} type="text" required value={newUnit.location} onChange={e => setNewUnit({...newUnit, location: e.target.value})} placeholder="Start typing to search..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>The map will update automatically. You can also drag the pin.</p>
        </section>

        {/* SECTION 3: Map View */}
        <aside className="map-sidebar form-section-map" style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)', color: 'var(--title-color)' }}>
            Property Location
          </label>
          <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-lg)' }} />
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '15px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#d4af37', borderRadius: '50%', opacity: 0.6 }}></span>
              <span>Existing Properties (Reference)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', background: 'red', borderRadius: '50%' }}></span>
              <span>Current Selection</span>
            </div>
            <p style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: 'var(--muted)' }}>Tip: Drag the red pin to fine-tune the location if the address search is not exact.</p>
          </div>
        </aside>

        {/* SECTION 4: Extra Details */}
        <div className="form-section-extra">
          <section className="glass-card" style={{ padding: '2rem', borderRadius: '20px' }}>
            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
              Amenities &amp; Features
              <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>({newUnit.amenities.length} selected)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
              {AMENITIES.map(a => {
                const checked = newUnit.amenities.includes(a.id);
                return (
                  <label key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                    border: checked ? '1.5px solid var(--primary-green)' : '1px solid var(--card-border)',
                    background: checked ? 'rgba(0, 77, 64, 0.1)' : 'var(--background)',
                    color: 'var(--foreground)',
                    fontSize: '0.82rem', fontWeight: checked ? 600 : 400,
                    transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setNewUnit(prev => ({
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

            <div style={{ marginTop: '2rem' }}>
               <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
                Asset &amp; Inventory Tracker
              </label>
              
              <div className="inventory-input-grid" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--muted)' }}>Item Name</label>
                  <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--muted)' }}>Qty</label>
                  <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.3rem', color: 'var(--muted)' }}>Condition</label>
                  <select value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
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
                    setNewUnit(prev => ({
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

              {newUnit.inventory.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newUnit.inventory.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Qty: {item.quantity}</span>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '999px', background: item.condition === 'Requires Repair' ? '#fee2e2' : '#e0f2fe', color: item.condition === 'Requires Repair' ? '#991b1b' : '#0369a1', fontWeight: 600 }}>{item.condition}</span>
                      </div>
                      <button type="button" onClick={() => setNewUnit(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== item.id) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
               {user && (
                <ImageUploader 
                  ownerId={user.uid} 
                  onUploadComplete={(urls) => setNewUnit(prev => ({ ...prev, images: urls }))} 
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" disabled={isSaving} className="premium-button" style={{ flex: 1, padding: '1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                {isSaving ? 'Saving...' : 'Publish Listing'}
              </button>
              <Link href="/dashboard/units" style={{ padding: '1rem', border: '1px solid var(--card-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--muted)', textAlign: 'center', background: 'var(--card-bg)' }}>Cancel</Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
