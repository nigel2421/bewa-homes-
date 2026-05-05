'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

interface Unit {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  price: number;
  type: string;
  images?: string[];
  tenantId?: string;
  isAdminAdded?: boolean;
  amenities?: string[];
}

import { AMENITIES as AMENITY_OPTIONS } from '@/lib/constants';


export default function GlobalMapPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch all units
  useEffect(() => {
    const q = query(collection(db, 'units'), where('subscriptionStatus', '==', 'active'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
      const sorted = [...data].sort((a, b) => {
        if (a.isAdminAdded && !b.isAdminAdded) return -1;
        if (!a.isAdminAdded && b.isAdminAdded) return 1;
        return 0; 
      });
      setUnits(sorted);
      setFilteredUnits(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter units
  useEffect(() => {
    const filtered = units.filter(unit => {
      const matchesSearch = searchQuery === '' || 
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice = maxPrice === '' || Number(unit.price) <= Number(maxPrice);
      
      const matchesAmenities = selectedAmenities.length === 0 || 
        selectedAmenities.every(a => unit.amenities?.includes(a));

      return matchesSearch && matchesPrice && matchesAmenities;
    });
    setFilteredUnits(filtered);
  }, [searchQuery, maxPrice, selectedAmenities, units]);

  // Initialize Map
  const initMap = () => {
    if (!mapRef.current || !window.google?.maps || !window.google.maps.Map) return;
    
    // Prevent double init
    if (mapRef.current.getAttribute('data-map-initialized') === 'true') return;

    try {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: -1.286389, lng: 36.817223 }, 
        zoom: 12,
        styles: [
          { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
          { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] }
        ],
        disableDefaultUI: false,
        zoomControl: true,
      });

      mapRef.current.setAttribute('data-map-initialized', 'true');
      setMap(newMap);
    } catch (err) {
      console.error('Error initializing Global Map:', err);
    }
  };

  useEffect(() => {
    // Initial attempt
    initMap();
    
    // Fail-safe interval for script loading issues in production
    const timer = setInterval(() => {
      if (window.google?.maps && !map) {
        initMap();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [map]);

  // Update Markers
  useEffect(() => {
    if (!map || !window.google || !window.google.maps || !window.google.maps.Marker) return;

    markers.forEach(m => m.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidCoords = false;

    filteredUnits.forEach(unit => {
      if (unit.latitude && unit.longitude) {
        const position = { lat: Number(unit.latitude), lng: Number(unit.longitude) };
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: unit.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#006432',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 10
          },
          zIndex: unit.isAdminAdded ? 1000 : 1
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: sans-serif; max-width: 200px;">
              <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #006432;">${unit.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">KES ${unit.price.toLocaleString()}</p>
              <a href="/units/${unit.id}" style="display: block; background: #006432; color: white; text-align: center; padding: 6px; border-radius: 4px; text-decoration: none; font-size: 11px; margin-top: 8px;">View Details</a>
            </div>
          `
        });

        marker.addListener('click', () => infoWindow.open(map, marker));
        newMarkers.push(marker);
        bounds.extend(position);
        hasValidCoords = true;
      }
    });

    setMarkers(newMarkers);
    if (hasValidCoords && filteredUnits.length > 0) {
      map.fitBounds(bounds);
      if (filteredUnits.length === 1) map.setZoom(15);
    }
  }, [filteredUnits, map]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <main style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Script 
        id="google-maps-global"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <Navbar />

      <div style={{ flex: 1, display: 'flex', position: 'relative', minHeight: 0 }}>
        {/* Mobile View Toggle */}
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          background: 'var(--card-bg)',
          borderRadius: '30px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          border: '1px solid var(--card-border)'
        }} className="mobile-only-toggle">
          <button 
            onClick={() => setMobileView('list')}
            style={{
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: mobileView === 'list' ? 'var(--primary-gold)' : 'transparent',
              color: mobileView === 'list' ? '#fff' : 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            List
          </button>
          <button 
            onClick={() => setMobileView('map')}
            style={{
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: mobileView === 'map' ? 'var(--primary-gold)' : 'transparent',
              color: mobileView === 'map' ? '#fff' : 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="22"></line><line x1="15" y1="2" x2="15" y2="21"></line></svg>
            Map
          </button>
        </div>

        {/* Sidebar */}
        <div className={`explore-sidebar ${mobileView === 'list' ? 'mobile-show' : 'mobile-hide'}`} style={{ 
          width: '400px', flex: '0 0 400px', background: 'var(--card-bg)', borderRight: '1px solid var(--card-border)', 
          overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '100%',
          zIndex: 10, boxShadow: '10px 0 30px rgba(0,0,0,0.05)', paddingBottom: '120px'
        }}>
          <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--title-color)', marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Explore Properties</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{filteredUnits.length} results matching.</p>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Search region or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem 1rem', borderRadius: '10px',
                  border: '1px solid var(--card-border)', background: 'var(--background)',
                  color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600, fontSize: '0.85rem' }}
            >
              {showFilters ? 'Hide Advanced Filters' : 'Advanced Filters'}
            </button>

            {showFilters && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Max Price (KES)</label>
                 <input 
                   type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                   placeholder="e.g. 10000"
                   style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)', marginBottom: '1.5rem' }} 
                 />

                 <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>Required Amenities</label>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                   {AMENITY_OPTIONS.map(opt => (
                     <button 
                       key={opt.id} onClick={() => toggleAmenity(opt.id)}
                       style={{
                         padding: '0.4rem', borderRadius: '6px', border: '1px solid',
                         borderColor: selectedAmenities.includes(opt.id) ? 'var(--primary-gold)' : 'var(--card-border)',
                         background: selectedAmenities.includes(opt.id) ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                         fontSize: '0.7rem', color: 'var(--foreground)', cursor: 'pointer'
                       }}
                     >
                       {opt.icon} {opt.label}
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>

          <div style={{ padding: '0 1rem 2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredUnits.map(unit => (
              <Link 
                key={unit.id}
                href={`/units/${unit.id}`}
                onMouseEnter={() => setHoveredUnit(unit.id)}
                onMouseLeave={() => setHoveredUnit(null)}
                style={{ 
                  padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)',
                  background: hoveredUnit === unit.id ? 'var(--background)' : 'var(--card-bg)',
                  transition: 'all 0.2s', cursor: 'pointer',
                  display: 'flex', gap: '1rem', textDecoration: 'none'
                }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image src={unit.images?.[0] || "/images/stay.png"} alt={unit.name} fill style={{ objectFit: 'cover' }} unoptimized={true} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--title-color)', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-playfair)' }}>{unit.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{unit.type} · KES {unit.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
            {!loading && filteredUnits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                <p>No matches found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div ref={mapRef} className={`explore-map ${mobileView === 'map' ? 'mobile-show' : 'mobile-hide'}`} style={{ flex: 1, height: '100%', minWidth: 0 }} />
      </div>
    </main>
  );
}
