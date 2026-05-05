'use client';

import React, { useState } from 'react';

const SupportPage = () => {
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  const faqs = [
    {
      q: 'How do I join BEWA Homes?',
      a: (
        <>
          Joining is simple and free! <br />
          1. Click the "Log In / Sign Up" button on the homepage.<br />
          2. Sign in using your Google Account, or email and password.<br />
          3. Once logged in, you will be directed to your Dashboard.
        </>
      )
    },
    {
      q: 'How do I list my property on the platform?',
      a: (
        <>
          To add a new property:<br />
          1. Navigate to your Dashboard.<br />
          2. Click the "Add Property" or "Create Listing" button.<br />
          3. Fill out the Details: Name, description, price, and amenities.<br />
          4. Location: Use the built-in map search to pinpoint your property.<br />
          5. Upload Photos: High-quality images are best. <i>(Note: Our system automatically adds a subtle watermark of your business name)</i>.<br />
          6. Click "Save" or "Submit".
        </>
      )
    },
    {
      q: 'I added my unit, but it is not showing up on the public Explore page. Why?',
      a: 'For a property to be publicly visible to potential renters, it needs an active subscription.'
    },
    {
      q: 'How do I purchase a subscription for my unit?',
      a: (
        <>
          Follow these steps to activate your listing:<br />
          1. Go to your Dashboard and navigate to your Units list.<br />
          2. Find the unit and click on it to manage its details.<br />
          3. Look for the "Subscription" or "Upgrade" section.<br />
          4. Choose a Plan (e.g., Bronze, Silver, Gold).<br />
          5. Click "Pay with M-Pesa" (or preferred method).<br />
          6. A prompt will appear on your phone. Enter your PIN.<br />
          7. Once verified, your unit becomes Active and visible on the map!
        </>
      )
    },
    {
      q: 'How do I know if someone wants to book my property?',
      a: (
        <>
          1. You will receive a notification on your Dashboard.<br />
          2. Navigate to the "Leads" or "Inquiries" tab.<br />
          3. View contact details and reach out directly to finalize the booking.
        </>
      )
    },
    {
      q: 'Can I edit my business name or contact details?',
      a: 'Yes! Go to your Profile Settings from the dashboard. Here you can update your business name, which will automatically update the watermark applied to any future photos you upload.'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1
          className="luxury-text-gradient"
          style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '800' }}
        >
          How can we help?
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Our team is here to ensure your experience with Bewa Homes is seamless and exceptional.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
        {/* Contact Form */}
        <div
          className="glass-card"
          style={{
            borderRadius: '2rem',
            padding: '2.5rem',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)',
          }}
        >
          <h2 style={{ color: 'var(--title-color)', fontSize: '1.5rem', marginBottom: '2rem', fontWeight: '600' }}>
            Send us a message
          </h2>
          <form
            onSubmit={(e) => { e.preventDefault(); setTicketStatus('sent'); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div>
              <label style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>
                Subject
              </label>
              <input
                type="text"
                placeholder="What's your query about?"
                style={{
                  width: '100%',
                  background: 'var(--background)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  color: 'var(--foreground)',
                  outline: 'none',
                  fontSize: '0.95rem',
                }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Describe your issue in detail..."
                style={{
                  width: '100%',
                  background: 'var(--background)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  color: 'var(--foreground)',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <button
              disabled={ticketStatus === 'sent'}
              style={{
                background: 'var(--primary-green)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontWeight: '600',
                cursor: ticketStatus === 'sent' ? 'default' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '0.5rem',
                opacity: ticketStatus === 'sent' ? 0.6 : 1,
                fontSize: '1rem',
              }}
            >
              {ticketStatus === 'sent' ? '✓ Message Sent!' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ color: 'var(--title-color)', fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Frequently Asked Questions
          </h2>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                borderRadius: '1.25rem',
                padding: '1.5rem',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg)',
                transition: 'all 0.2s',
              }}
            >
              <h3 style={{ color: 'var(--primary-green)', fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                {faq.q}
              </h3>
              <div style={{ color: 'var(--muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {faq.a}
              </div>
            </div>
          ))}

          {/* Direct Line card */}
          <div
            style={{
              marginTop: 'auto',
              padding: '2rem',
              borderRadius: '1.5rem',
              background: 'rgba(var(--primary-green-rgb), 0.08)',
              border: '1px solid rgba(var(--primary-green-rgb), 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                flexShrink: 0,
                borderRadius: '50%',
                background: 'var(--primary-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                Direct Line
              </p>
              <p style={{ color: 'var(--foreground)', fontWeight: '700', fontSize: '1.1rem' }}>
                +254 700 000 000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
