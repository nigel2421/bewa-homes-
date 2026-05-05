'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

const SERVICES = [
  {
    id: 'internal-design',
    name: 'Internal Design Services',
    description: 'Bespoke interior design and structural aesthetic services to transform spaces into luxury experiences. Focused on premium materials and functional elegance.',
    image: '/images/interior_design.png',
    priceRange: 'Custom Quote'
  },
  {
    id: 'furnishing',
    name: 'Furnishing Services',
    description: 'Tailored furnishing solutions for Studios, 1-Bedroom, and 2-Bedroom unit typologies. We provide turn-key furniture packages optimized for short-stay units.',
    image: '/images/furnishing.png',
    priceRange: 'Package Based'
  },
  {
    id: 'consultancy',
    name: 'Property Consultancy',
    description: 'Expert advisory for property investment, fractional ownership models, and premium asset management in the short-stay and luxury residential sector.',
    image: '/images/consultancy.png',
    priceRange: 'Advisory Rates'
  }
];

export default function ServicesPage() {
  const WHATSAPP_NUMBER = '254712345678'; // Placeholder for user to update
  const PHONE_NUMBER = '+254712345678';   // Placeholder for user to update

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      
      <section style={{ 
        paddingTop: '10rem', paddingBottom: '4rem', background: 'var(--primary-green)', 
        color: 'white', textAlign: 'center' 
      }}>
        <div className="container">
          <h1 className="luxury-text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
            Premium Services
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', maxWidth: '750px', marginInline: 'auto' }}>
            From bespoke interior design to strategic property consultancy, explore our curated suite of luxury services.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '3rem' 
        }}>
          {SERVICES.map(service => (
            <div key={service.id} className="glass-card" style={{ 
              background: 'var(--card-bg)', borderRadius: '20px', overflow: 'hidden', 
              border: '1px solid var(--card-border)', position: 'relative', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }} onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}>
              <div style={{ position: 'relative', height: '260px' }}>
                <Image 
                  src={service.image} 
                  alt={service.name} 
                  fill 
                  style={{ objectFit: 'cover' }}
                />
                <div style={{ 
                  position: 'absolute', bottom: '1rem', right: '1rem', 
                  background: 'rgba(var(--primary-gold-rgb), 0.9)', color: 'white', 
                  padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 
                }}>
                  {service.priceRange}
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--title-color)', marginBottom: '1rem', fontFamily: 'var(--font-playfair)' }}>
                  {service.name}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.7, minHeight: '5.1em' }}>
                  {service.description}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a 
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi BEWA, I am interested in ${service.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-button" 
                    style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.512-2.96-2.626-.087-.114-.694-.924-.694-1.769 0-.845.433-1.261.587-1.42.155-.159.337-.199.45-.199.113 0 .225.001.322.006.101.005.237-.039.371.285.138.332.473 1.155.514 1.237.041.083.068.18.013.29-.054.11-.082.18-.163.275-.082.094-.173.209-.247.28-.081.078-.166.163-.072.326.095.163.421.694.904 1.125.621.554 1.144.726 1.306.808.163.082.257.068.351-.041.094-.109.405-.473.514-.635.109-.163.218-.136.366-.082.148.054.939.444 1.101.526.163.082.272.122.311.19.039.067.039.39-.105.795z" /></svg>
                    Business Matter Africa
                  </a>
                  <a 
                    href={`tel:${PHONE_NUMBER}`}
                    className="premium-button-outline" 
                    style={{ width: '100%', padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Call Us Directly
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)' }}>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-playfair)', color: 'var(--title-color)', marginBottom: '1.5rem' }}>
          Real Estate Partnership
        </h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 2.5rem', color: 'var(--muted)', lineHeight: 1.8 }}>
          Are you a developer or property owner looking for a management partner? Let's discuss how we can maximize your asset's potential.
        </p>
        <a href={`tel:${PHONE_NUMBER}`} className="premium-button" style={{ padding: '1rem 3rem' }}>
          Schedule a Consultation
        </a>
      </div>
    </main>
  );
}
