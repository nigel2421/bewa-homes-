'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
      <Navbar />

      <main className="container" style={{ padding: '8rem 2rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="luxury-text-gradient" style={{ fontSize: '3rem', fontFamily: 'var(--font-playfair)', marginBottom: '1.5rem' }}>Terms of Service</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>Last Updated: April 20, 2026</p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                By accessing or using Bewa Homes (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Description of Service</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                Bewa Homes provides a property management suite (PMS), real estate marketplace, and interior design services. We facilitate the connection between property owners (Hosts) and property seekers (Guests).
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Host Responsibilities</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                Hosts are responsible for providing accurate property details, high-quality images, and maintaining the safety and cleanliness of their units. Any fraudulent listings or misrepresentation will result in immediate permanent suspension of your account and tenant status.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. Payments & Commissions</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                Payments processed through the Bewa Homes gateway are subject to a platform commission fee. Funds will be dispersed to Host accounts after successful guest check-in, minus applicable fees.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>5. Limitation of Liability</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                Bewa Homes acts as an intermediary platform. While we vet our hosts, we are not liable for disputes between Hosts and Guests, property damage, or financial losses incurred outside our managed payment systems.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>6. Termination</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                We reserve the right to terminate or suspend access to our Platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </div>
          </section>

          <div style={{ marginTop: '5rem', padding: '2rem', borderTop: '1px solid var(--card-border)', textAlign: 'center' }}>
            <Link href="/" style={{ color: 'var(--foreground)', textDecoration: 'underline' }}>Back to Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
