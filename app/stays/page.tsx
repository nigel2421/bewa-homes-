'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import EnquiryModal from '@/components/EnquiryModal';

import { AMENITIES as AMENITY_OPTIONS, PROPERTY_TYPES } from '@/lib/constants';



export default function StaysPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, tenantId: string } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'units'),
      where('subscriptionStatus', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUnits(data);
      setFilteredUnits(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const filtered = units.filter(unit => {
      // 1. Search Query (Name, Location, Type)
      const matchesSearch = searchQuery === '' ||
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.type.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Price Range
      const price = Number(unit.price);
      const matchesMinPrice = minPrice === '' || price >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || price <= Number(maxPrice);

      // 3. Amenities (Must have ALL selected)
      const matchesAmenities = selectedAmenities.length === 0 ||
        selectedAmenities.every(a => unit.amenities?.includes(a));

      // 4. Property Type
      const matchesType = propertyType === 'All' || unit.type === propertyType;

      return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesAmenities && matchesType;
    });
    setFilteredUnits(filtered);
  }, [searchQuery, minPrice, maxPrice, selectedAmenities, propertyType, units]);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    setPropertyType('All');
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        paddingTop: '10rem', paddingBottom: '3rem', background: 'var(--primary-green)',
        color: 'white', textAlign: 'center'
      }}>
        <div className="container">
          <h1 className="luxury-text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
            Premium Furnished Apartments
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '700px', marginInline: 'auto', marginBottom: '2.5rem' }}>
            Discover our curated selection of luxury homes and apartments.
          </p>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Search by region or property name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '1.2rem 1.5rem', borderRadius: '12px',
                  border: 'none', background: 'white', color: '#1a1a1a',
                  fontSize: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  position: 'absolute', right: '0.8rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'var(--primary-gold)',
                  color: 'white', border: 'none', padding: '0.6rem 1.2rem',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                {showFilters ? 'Hide Filters' : 'Advanced Filters'}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="glass-card" style={{
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                padding: '2rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'left', animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                  {/* Price Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.8 }}>Price Range (KES)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number" placeholder="Min" value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#1a1a1a' }}
                      />
                      <span style={{ opacity: 0.5 }}>—</span>
                      <input
                        type="number" placeholder="Max" value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#1a1a1a' }}
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.8 }}>Property Type</label>
                    <select
                      value={propertyType}
                      onChange={e => setPropertyType(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#1a1a1a', fontWeight: 500 }}
                    >
                      <option value="All">All Types</option>
                      {PROPERTY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}

                    </select>
                  </div>
                </div>

                {/* Amenities Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', opacity: 0.8 }}>Amenities</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                    {AMENITY_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleAmenity(opt.id)}
                        style={{
                          padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                          borderColor: selectedAmenities.includes(opt.id) ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)',
                          background: selectedAmenities.includes(opt.id) ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                          color: 'white', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'
                        }}
                      >
                        <span>{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-playfair)' }}>
            {filteredUnits.length} {filteredUnits.length === 1 ? 'Property' : 'Properties'} Found
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>Loading stays...</div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2.5rem'
          }}>
            {filteredUnits.map(unit => (
              <div key={unit.id} className="glass-card" style={{
                background: 'var(--card-bg)', borderRadius: '16px', overflow: 'hidden',
                border: '1px solid var(--card-border)', position: 'relative', transition: 'transform 0.3s ease',
                display: 'flex', flexDirection: 'column'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <Link href={`/units/${unit.id}`} style={{ position: 'relative', height: '240px', cursor: 'pointer', display: 'block' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 5, background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '20px', color: 'var(--primary-gold)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--primary-gold)' }}>
                    {unit.type}
                  </div>
                  {unit.amenities?.includes('plwd') && (
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 5, background: 'rgba(212, 175, 55, 0.9)', padding: '0.4rem 0.8rem', borderRadius: '20px', color: 'white', fontSize: '0.65rem', fontWeight: 800, border: '1px solid white', display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      <span>♿</span> ACCESSIBLE
                    </div>
                  )}
                  <Image

                    src={unit.images?.[0] || "/images/stay.png"}
                    alt={unit.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized={true}
                  />
                </Link>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <Link href={`/units/${unit.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.2rem', color: 'var(--title-color)', margin: 0,
                        fontFamily: 'var(--font-playfair)', cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                        className="property-title-link"
                      >
                        {unit.name}
                      </h3>
                    </Link>
                    <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-gold)' }}>
                        KES {Number(unit.price).toLocaleString()}
                      </span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>/night</p>
                    </div>
                  </div>
                  <Link href={`/units/${unit.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem', cursor: 'pointer' }}>
                      📍 {unit.location}
                    </p>
                  </Link>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {unit.amenities?.slice(0, 4).map((a: string) => (
                      <span key={a} style={{ fontSize: '0.7rem', background: 'var(--background)', color: 'var(--muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                        {AMENITY_OPTIONS.find(o => o.id === a)?.label || a}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <Link
                      href={`/units/${unit.id}`}
                      className="premium-button"
                      style={{
                        width: '100%', padding: '0.8rem', textDecoration: 'none',
                        display: 'block', textAlign: 'center'
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {filteredUnits.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                <p style={{ fontSize: '3rem' }}>🏙️</p>
                <p>No listings match your selection.</p>
                <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline' }}>Clear Filters</button>
              </div>
            )}
          </div>
        )}
      </section>

      {selectedItem && (
        <EnquiryModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          itemType="stay"
          tenantId={selectedItem.tenantId}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .property-title-link:hover {
          color: var(--primary-gold) !important;
        }
      `}</style>
    </main>
  );
}
