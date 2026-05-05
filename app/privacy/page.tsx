'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
      <Navbar />
      
      <main className="container" style={{ padding: '8rem 2rem 5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="luxury-text-gradient" style={{ fontSize: '3rem', fontFamily: 'var(--font-playfair)', marginBottom: '1.5rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>Last Updated: April 20, 2026</p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                We collect information you provide directly to us, such as your name, email address, phone number, and business details when you register as a Host or Guest. We also collect usage data and location information when you interact with our map and marketplace.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                Your data helps us process bookings, verify property ownership, and improve the personalized marketplace experience. We use your contact information to send transaction receipts and onboarding materials.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Data Sharing & Security</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                We do not sell your personal data. We share only necessary details with Hosts or Guests to facilitate bookings. We implement industry-standard encryption and Firebase security protocols to protect your sensitive information.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. Cookies & Tracking</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                We use cookies to maintain your session and remember your preferences (e.g., Dark Mode settings). You can disable cookies in your browser, but some features of the Platform may become unavailable.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>5. Your Rights</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                You have the right to access, correct, or delete your personal data at any time through your Dashboard profile settings. For complete data deletion requests, contact our support team.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>6. Changes to this Policy</h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
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
