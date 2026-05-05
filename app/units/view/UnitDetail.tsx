'use client';

import React, { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import Image from 'next/image';
import EnquiryModal from '@/components/EnquiryModal';
import BookingCheckoutModal from '@/components/BookingCheckoutModal';
import Script from 'next/script';
import Link from 'next/link';
import ReviewSection from '@/components/ReviewSection';
import { AMENITIES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';


export default function UnitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = use(params);
  const { user: authUser, login } = useAuth();
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // For static export, we handle dynamic IDs by looking at the URL if params is the placeholder
  const id = (typeof window !== 'undefined' && (paramId === 'view' || !paramId)) 
    ? window.location.pathname.split('/').filter(Boolean).pop() || paramId 
    : paramId;

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [host, setHost] = useState<any>(null);

  const [hasVoted, setHasVoted] = useState<string | null>(null);

  useEffect(() => {
    const voted = localStorage.getItem(`voted_${id}`);
    if (voted) setHasVoted(voted);
  }, [id]);

  const handleVote = async (type: 'up' | 'down') => {
    if (hasVoted) return;
    try {
      const unitRef = doc(db, 'units', id as string);
      await updateDoc(unitRef, {
        [`ratings.${type}`]: increment(1)
      });
      localStorage.setItem(`voted_${id}`, type);
      setHasVoted(type);
      
      setUnit((prev: any) => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [type]: (prev.ratings?.[type] || 0) + 1
        }
      }));
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  // Booking Engine State
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [nights, setNights] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (checkIn && checkOut && unit?.price) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      if (d2 > d1) {
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
        setTotalAmount(diffDays * Number(unit.price));
      } else {
        setNights(0);
        setTotalAmount(0);
      }
    } else if (unit?.price) {
      setTotalAmount(Number(unit.price));
    }
  }, [checkIn, checkOut, unit]);

  useEffect(() => {
    const fetchUnitAndHost = async () => {
      const docRef = doc(db, 'units', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const unitData = { id: snap.id, ...snap.data() } as any;
        setUnit(unitData);
        
        if (unitData.ownerId) {
          const hostSnap = await getDoc(doc(db, 'tenants', unitData.ownerId));
          if (hostSnap.exists()) {
            setHost(hostSnap.data());
          }
        }
      }
      setLoading(false);
    };
    fetchUnitAndHost();
  }, [id]);

  // Map Initialization
  useEffect(() => {
    const initMap = () => {
      // 1. Core Readiness Check
      if (typeof window === 'undefined' || !window.google?.maps || !unit?.latitude || !unit?.longitude) return;
      
      const mapDiv = document.getElementById('property-map');
      if (!mapDiv) return;

      // 2. Prevent Double Initialization
      if (mapDiv.getAttribute('data-map-initialized') === 'true') return;

      try {
        const map = new window.google.maps.Map(mapDiv, {
          center: { lat: Number(unit.latitude), lng: Number(unit.longitude) },
          zoom: 15,
          disableDefaultUI: true,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
        });
        
        new window.google.maps.Marker({
          position: { lat: Number(unit.latitude), lng: Number(unit.longitude) },
          map: map,
          title: unit.name
        });

        mapDiv.setAttribute('data-map-initialized', 'true');
      } catch (err) {
        console.error('Error creating Google Map:', err);
      }
    };

    // Trigger on mount/update
    initMap();
    
    // Fail-safe for script loading race conditions
    const timer = setTimeout(initMap, 1000);
    const interval = setInterval(() => {
      if (window.google?.maps) {
        initMap();
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [unit, loading]); // Re-run when unit loads

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}>Loading Property Details...</div>;
  if (!unit) return <div style={{ padding: '10rem', textAlign: 'center' }}>Property Not Found</div>;

  const images = unit.images && unit.images.length > 0 ? unit.images : ["/images/stay.png"];

  return (
    <main style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navbar />
      <Script 
        id="google-maps-loader"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
        onLoad={() => {
           // Small delay to ensure React has painted the map div
           setTimeout(() => {
             const mapDiv = document.getElementById('property-map');
             if (mapDiv && window.google?.maps && unit?.latitude) {
                // If the useEffect hasn't done it yet, do it now
                const map = new window.google.maps.Map(mapDiv, {
                  center: { lat: Number(unit.latitude), lng: Number(unit.longitude) },
                  zoom: 15,
                  disableDefaultUI: true
                });
                new window.google.maps.Marker({
                  position: { lat: Number(unit.latitude), lng: Number(unit.longitude) },
                  map,
                  title: unit.name
                });
                mapDiv.setAttribute('data-map-initialized', 'true');
             }
           }, 500);
        }}
      />

      <div className="container mobile-p-sm" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        {/* Gallery */}
        {/* Property Gallery */}
        <section className="unit-gallery-container">
          <div className="main-image-wrapper">
            <Image 
              src={images[activeImage]} 
              alt={unit.name} 
              fill 
              style={{ objectFit: 'cover' }} 
              unoptimized={true}
              priority={true} // Fixed LCP warning
              loading="eager"
            />
          </div>
          
          <div className="thumbnail-strip">
            {images.slice(0, 5).map((img: string, i: number) => (
              <div 
                key={i} 
                className={`thumbnail-item ${activeImage === i ? 'active' : ''}`}
                onClick={() => setActiveImage(i)}
              >
                <Image 
                  src={img} 
                  alt={`${unit.name} view ${i + 1}`} 
                  fill 
                  style={{ objectFit: 'cover' }} 
                  unoptimized={true} 
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mobile-grid-1 mobile-gap-sm" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '4rem' }}>
          {/* Main Info */}
          <section>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 className="mobile-font-sm" style={{ fontSize: '30px', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>{unit.name}</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--muted)' }} className="mobile-font-sm">📍 {unit.location} · {unit.type}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleVote('up')}
                    disabled={!!hasVoted}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
                      borderRadius: '8px', border: '1px solid var(--card-border)', 
                      background: hasVoted === 'up' ? 'var(--primary-gold)' : 'var(--card-bg)',
                      color: hasVoted === 'up' ? 'white' : 'var(--foreground)',
                      cursor: hasVoted ? 'default' : 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    👍 <span style={{ fontWeight: 600 }}>{unit.ratings?.up || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleVote('down')}
                    disabled={!!hasVoted}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
                      borderRadius: '8px', border: '1px solid var(--card-border)', 
                      background: hasVoted === 'down' ? '#ef4444' : 'var(--card-bg)',
                      color: hasVoted === 'down' ? 'white' : 'var(--foreground)',
                      cursor: hasVoted ? 'default' : 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    👎 <span style={{ fontWeight: 600 }}>{unit.ratings?.down || 0}</span>
                  </button>
                </div>
                {unit.ratings?.up || unit.ratings?.down ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
                    {Math.round(((unit.ratings?.up || 0) / ((unit.ratings?.up || 0) + (unit.ratings?.down || 0))) * 100)}% approval rating
                  </p>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>No ratings yet</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>About this space</h3>
              <p style={{ lineHeight: '1.8', color: 'var(--foreground)' }}>
                Experience luxury and comfort in this premium {unit.type}. Located in the heart of {unit.location.split(',')[0]}, 
                this property offers top-tier amenities and a serene environment perfect for short stays, business travel, or relaxation.
              </p>
            </div>

            {unit.amenities && unit.amenities.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>What this place offers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {unit.amenities?.map((id: string) => {
                    const amenity = AMENITIES.find(a => a.id === id);

                    if (!amenity) return null;
                    return (
                      <div key={id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '10px',
                        border: '1px solid var(--card-border)', background: 'var(--card-bg)',
                        fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>{amenity.icon}</span>
                        <span>{amenity.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Location</h3>
              <div id="property-map" style={{ width: '100%', height: '350px', borderRadius: '15px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />
            </div>

            <div style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', position: 'relative', background: 'var(--card-border)', border: '2px solid var(--primary-gold)' }}>
                  <Image src={host?.logo || "/images/stay.png"} alt="Host" fill style={{ objectFit: 'cover' }} unoptimized={true} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hosted by</p>
                  <Link href={`/host/${unit.ownerId}`} style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--title-color)', textDecoration: 'none', fontFamily: 'var(--font-playfair)' }}>
                    {host?.name || 'Professional Host'}
                  </Link>
                </div>
              </div>
              
              {host?.bio && (
                <p style={{ lineHeight: '1.6', color: 'var(--foreground)', opacity: 0.8, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                  "{host.bio}"
                </p>
              )}

              <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
                {authUser ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>Phone</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{host?.phone || 'Contact via message'}</p>
                    </div>
                    <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>Email</p>
                      <p style={{ margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{host?.email || 'No email provided'}</p>
                    </div>
                    
                    {/* Social Links */}
                    {(host?.tiktok || host?.instagram || host?.facebook || host?.twitter || host?.youtube) && (
                      <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {host.tiktok && <a href={host.tiktok} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: '#000', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }} title="TikTok">TikTok</a>}
                        {host.instagram && <a href={host.instagram} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }} title="Instagram">Instagram</a>}
                        {host.facebook && <a href={host.facebook} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: '#1877f2', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }} title="Facebook">Facebook</a>}
                        {host.twitter && <a href={host.twitter} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: '#1da1f2', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }} title="Twitter / X">Twitter</a>}
                        {host.youtube && <a href={host.youtube} target="_blank" rel="noopener noreferrer" style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: '#ff0000', color: '#fff', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }} title="YouTube">YouTube</a>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <button 
                      onClick={login}
                      className="premium-button-outline"
                      style={{ width: '100%', padding: '1rem' }}
                    >
                      Sign in to view contact details
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Booking Card */}
          <aside id="booking-section">
            <div className="glass-card" style={{ 
              position: 'sticky', top: '8rem', 
              padding: '2rem', borderRadius: '20px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
              background: 'var(--card-bg)', border: '1px solid var(--card-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Price per night</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-gold)' }}>KES {Number(unit.price).toLocaleString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', padding: '0.3rem 0.6rem', borderRadius: '15px', fontWeight: 600, border: '1px solid rgba(46, 125, 50, 0.2)' }}>Active</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ padding: '0.5rem', border: '1px solid var(--card-border)', borderRadius: '8px', background: 'var(--background)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>Check In</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', background: 'transparent' }} />
                  </div>
                  <div style={{ padding: '0.5rem', border: '1px solid var(--card-border)', borderRadius: '8px', background: 'var(--background)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>Check Out</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--foreground)', background: 'transparent' }} />
                  </div>
                </div>
                
                <button 
                   onClick={() => setShowCheckout(true)}
                  className="premium-button" 
                  style={{ width: '100%', padding: '1.2rem', fontSize: '1rem', cursor: 'pointer' }}
                >
                  Reserve Now
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>You won't be charged yet</p>
              </div>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
                  <span>KES {Number(unit.price).toLocaleString()} x {nights} nights</span>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>KES {totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
                  <span>Cleaning Fee</span>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Included</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, borderTop: '1px solid var(--card-border)', paddingTop: '1rem', marginTop: '0.5rem', color: 'var(--primary-gold)' }}>
                  <span>Total</span>
                  <span>KES {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <ReviewSection unitId={unit.id} />
      </div>

      {/* Floating Mobile Booking Bar */}
      <div className="floating-booking-bar">
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>Price from</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-gold)', margin: 0 }}>KES {Number(unit.price).toLocaleString()}</p>
        </div>
        <button 
          onClick={() => {
            document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="premium-button"
          style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
        >
          Reserve
        </button>
      </div>

      <BookingCheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        unitId={unit.id}
        unitName={unit.name}
        tenantId={unit.ownerId}
        checkIn={checkIn}
        checkOut={checkOut}
        totalAmount={totalAmount}
      />

      <EnquiryModal 
        isOpen={showEnquiry}
        onClose={() => setShowEnquiry(false)}
        itemId={unit.id}
        itemName={unit.name}
        itemType="stay"
        tenantId={unit.ownerId}
      />
    </main>
  );
}
