'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where, or } from "firebase/firestore";

export default function Home() {
  const [landListings, setLandListings] = useState<any[]>([]);
  const [featuredUnits, setFeaturedUnits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Fetch featured land
    const qLand = query(collection(db, 'land_listings'), orderBy('createdAt', 'desc'), limit(1));
    const unsubLand = onSnapshot(qLand, (snap) => {
      setLandListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Featured Units (Admin Added or Explicitly Featured)
    const qUnits = query(
      collection(db, 'units'), 
      or(
        where('isAdminAdded', '==', true),
        where('isFeatured', '==', true)
      ),
      limit(6)
    );
    const unsubUnits = onSnapshot(qUnits, (snap) => {
      setFeaturedUnits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { 
      unsubLand(); 
      unsubUnits();
    };
  }, []);

  const latestLand = landListings[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stays?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/stays');
    }
  };

  return (
    <div className={styles.main}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <Image
            src="/hero.png"
            alt="Luxury Penthouse Interior"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Experience <span className="luxury-text-gradient">Premium</span> Living
          </h1>
          <p className={styles.heroSubtitle}>
            Curated short/long stays, prime land plots, and designer interior services.
          </p>

          <form onSubmit={handleSearch} className="hero-search-container">
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by region (e.g. Nairobi, Kilimani...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hero-search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Search
            </button>
          </form>

          <div className={styles.heroActions} style={{ marginTop: '2rem' }}>
            <Link href="/map" className="premium-button">Explore on Map</Link>
            <Link href="/land" className="premium-button-outline">Investment Plots</Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={`${styles.section} container`}>
        <h2 className={styles.sectionTitle}>Our Ecosystem</h2>
        <p className={styles.sectionSubtitle}>
          A seamless integration of luxury staycation discovery and long-term real estate investments.
        </p>

        <div className={styles.grid}>
          {/* Stay Card */}
          <Link href="/stays" className={styles.card}>
            <div className={styles.cardImage}>
              <Image
                src="/images/luxury_stay_hero.png"
                alt="Luxury Short Stay"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardTag}>PREMIER STAYS</span>
              <h3 className={styles.cardTitle}>Curated Escapes</h3>
              <p className={styles.cardPrice}>Click to Browse Units</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                Discover our hand-picked collection of premier short/long-stay properties with world-class amenities. From Studio units to Penthouses.
              </p>
            </div>
          </Link>

          {/* Plot Card */}
          <Link href="/land" className={styles.card}>
            <div className={styles.cardImage}>
              <Image
                src="/images/land.png"
                alt="Prime Land Plots"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardTag}>LAND FOR SALE</span>
              <h3 className={styles.cardTitle}>{latestLand?.title || "Planned Listings"}</h3>
              <p className={styles.cardPrice}>
                {latestLand ? `KES ${latestLand.price.toLocaleString()}` : "Marketplace Entry"}
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                {latestLand
                  ? `${latestLand.location} · ${latestLand.size}. Prime real estate investment.`
                  : "New strategic land opportunities are being vetted for the marketplace."
                }
              </p>
            </div>
          </Link>

          {/* Decor Card */}
          <Link href="/services" className={styles.card}>
            <div className={styles.cardImage}>
              <Image
                src="/images/interior_design.png"
                alt="Interior Design Services"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardTag}>PREMIUM SERVICES</span>
              <h3 className={styles.cardTitle}>Design & Furniture</h3>
              <p className={styles.cardPrice}>Bespoke Solutions</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                Elevate your living experience with turn-key furnishing and expert interior consultancy.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Units Section */}
      <section className={styles.section} style={{ background: 'var(--primary-green)', color: 'white' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
              <span className={styles.cardTag} style={{ background: 'var(--primary-gold)', color: 'white', marginBottom: '1rem' }}>Bewa Premier</span>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: 0, color: 'white' }}>Featured Residences</h2>
            </div>
            <Link href="/map" className="listing-view-btn" style={{ fontSize: '1rem', color: 'var(--primary-gold)' }}>
              View Global Map <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {/* First set */}
            {featuredUnits.map((unit) => (
              <Link key={`a-${unit.id}`} href={`/units/${unit.id}`} className="featured-listing-card">
                <div className="listing-image-container">
                  <span className="listing-badge">{unit.category || 'PREMIUM STAY'}</span>
                  <Image 
                    src={unit.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80'} 
                    alt={unit.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="listing-details">
                  <span className="listing-type">{unit.type || 'Residence'}</span>
                  <h3 className="listing-name">{unit.name}</h3>
                  <div className="listing-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {unit.location}
                  </div>
                  <div className="listing-price-row">
                    <div className="listing-price">KES {unit.price?.toLocaleString()}</div>
                    <div className="listing-view-btn">
                      View details
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {/* Duplicate set for seamless loop */}
            {featuredUnits.map((unit) => (
              <Link key={`b-${unit.id}`} href={`/units/${unit.id}`} className="featured-listing-card" aria-hidden="true">
                <div className="listing-image-container">
                  <span className="listing-badge">{unit.category || 'PREMIUM STAY'}</span>
                  <Image 
                    src={unit.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80'} 
                    alt={unit.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="listing-details">
                  <span className="listing-type">{unit.type || 'Residence'}</span>
                  <h3 className="listing-name">{unit.name}</h3>
                  <div className="listing-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {unit.location}
                  </div>
                  <div className="listing-price-row">
                    <div className="listing-price">KES {unit.price?.toLocaleString()}</div>
                    <div className="listing-view-btn">
                      View details
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {featuredUnits.length === 0 && (
            <div style={{ textAlign: 'center', width: '100%', padding: '4rem', opacity: 0.5 }}>
              Premium listings coming soon.
            </div>
          )}
        </div>

        
        {featuredUnits.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <Link href="/map" className="premium-button">
              View All Properties on Map
            </Link>
          </div>
        )}
        </div>
      </section>


      {/* Management Slogan Section */}
      <section style={{ background: 'var(--primary-green)', color: 'white', padding: '6rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem', fontSize: '2.5rem', fontFamily: 'var(--font-playfair)' }}>Scale Your Portfolio</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '750px', marginInline: 'auto', opacity: 0.9 }}>
            Join the Bewa Homes ecosystem. We provide the management tools and global audience to transform your property into a high-yield asset.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="premium-button">
              Host Dashboard
            </Link>
            <Link href="/services" className="premium-button-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Consult with Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0a0a0a', color: 'white', padding: '5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 className="luxury-text-gradient" style={{ fontSize: '2.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-playfair)' }}>Bewa Homes</h3>
            <p style={{ opacity: 0.6, maxWidth: '350px', lineHeight: 1.8 }}>
              Redefining premium living through digital-first property discovery, seamless stay management, and strategic real estate investments.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
            <div>
              <h4 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem', fontWeight: 700 }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link href="/stays" style={{ opacity: 0.7 }}>Short/Long Stays</Link></li>
                <li><Link href="/land" style={{ opacity: 0.7 }}>Land Plots</Link></li>
                <li><Link href="/services" style={{ opacity: 0.7 }}>Services</Link></li>
                <li><Link href="/map" style={{ opacity: 0.7 }}>Global Map</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem', fontWeight: 700 }}>Legal</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link href="/terms" style={{ opacity: 0.7 }}>Terms of Service</Link></li>
                <li><Link href="/privacy" style={{ opacity: 0.7 }}>Privacy Policy</Link></li>
                <li><Link href="/dashboard" style={{ opacity: 0.7 }}>Admin Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem', fontWeight: 700 }}>Contact</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ opacity: 0.7 }}>info@bewahomes.com</li>
                <li style={{ opacity: 0.7 }}>+254 712 345 678</li>
                <li style={{ opacity: 0.7 }}>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '5rem', opacity: 0.4, fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
          &copy; {new Date().getFullYear()} Bewa Homes Multi-functional App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
