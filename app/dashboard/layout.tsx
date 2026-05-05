'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LoadingScreen from '@/components/LoadingScreen';
import ProviderRequestModal from '@/components/ProviderRequestModal';
import TenantSelector from '@/components/TenantSelector';


const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, error: authError, login, sendEmailLink, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  // Email link form state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setSending] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setEmailError('');
    try {
      await sendEmailLink(email.trim());
      setEmailSent(true);
    } catch (err: any) {
      setEmailError(err?.message ?? 'Failed to send link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Login gate
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
        {/* Left panel */}
        <div className="auth-left-panel" style={{
          flex: 1, background: 'var(--primary-green)', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '3rem', color: 'white',
        }}>
          <h1 className="luxury-text-gradient" style={{ fontSize: '3.5rem', fontFamily: 'var(--font-playfair)', marginBottom: '1rem' }}>Bewa Homes</h1>
          <p style={{ textAlign: 'center', opacity: 0.7, maxWidth: '300px', lineHeight: 1.9 }}>
            The premium platform for short-stay management, land sales & interior services.
          </p>
        </div>

        {/* Right login panel */}
        <div style={{
          width: '480px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '3rem', background: 'var(--background)', gap: '1.5rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>Owner Dashboard</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Sign in to manage your properties</p>
          </div>

          <button
            onClick={login}
            id="google-login-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px',
              padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer', width: '100%', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)', transition: 'box-shadow 0.2s ease', color: 'var(--foreground)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M46.145 24.503c0-1.617-.144-3.17-.413-4.66H24v8.815h12.433c-.537 2.892-2.167 5.342-4.618 6.988v5.808h7.476c4.37-4.023 6.854-9.947 6.854-16.951z" />
              <path fill="#34A853" d="M24 47c6.237 0 11.466-2.067 15.29-5.605l-7.476-5.808c-2.07 1.388-4.714 2.21-7.814 2.21-6.007 0-11.092-4.057-12.908-9.517H3.387v6.001C7.198 41.832 15 47 24 47z" />
              <path fill="#FBBC05" d="M11.092 28.28A13.995 13.995 0 0 1 10.5 24c0-1.49.257-2.94.592-4.28V13.72H3.387A22.998 22.998 0 0 0 1 24c0 3.71.889 7.224 2.387 10.28l7.705-6z" />
              <path fill="#EA4335" d="M24 10.2c3.384 0 6.42 1.163 8.808 3.448l6.602-6.603C35.46 3.295 30.237 1 24 1 15 1 7.198 6.168 3.387 13.72l7.705 6.001C12.908 14.257 17.993 10.2 24 10.2z" />
            </svg>
            Continue with Google
          </button>

          {authError && (
            <div style={{
              width: '100%', padding: '0.8rem', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <strong>Login Error:</strong> {authError}
              <br /><small style={{ opacity: 0.8 }}>Ensure BEWA is added to authorized domains.</small>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
          </div>

          {!emailSent ? (
            <form onSubmit={handleSendLink} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', padding: '0.85rem 1rem', borderRadius: '8px',
                  border: '1px solid var(--card-border)', fontSize: '1rem',
                  background: 'var(--background)', color: 'var(--foreground)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={emailSending}
                style={{
                  width: '100%', padding: '0.85rem', borderRadius: '8px',
                  background: 'var(--primary-green)', color: 'white',
                  border: 'none', fontWeight: 600, fontSize: '0.95rem',
                  cursor: emailSending ? 'wait' : 'pointer',
                  opacity: emailSending ? 0.7 : 1, transition: 'opacity 0.2s',
                }}
              >
                {emailSending ? 'Sending…' : 'Send Sign-in Link'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-gold)' }}>Link Sent!</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Check your email to finish logging in.</p>
            </div>
          )}

          <Link href="/" style={{ color: 'var(--primary-gold)', fontSize: '0.85rem' }}>
            ← Back to Marketplace
          </Link>
        </div>

        <style>{`
          @media (max-width: 768px) { .auth-left-panel { display: none !important; } }
        `}</style>
      </div>
    );
  }

  // Authenticated dashboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Dashboard is full height on desktop, no main site Navbar */}
      <div className="md:hidden">
        <Navbar />
      </div>

      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--primary-gold)', color: 'white',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer'
        }}
        className="dashboard-fab"
        aria-label="Open sidebar menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div style={{ display: 'flex', flex: 1, paddingTop: '0', position: 'relative' }}>
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 115, backdropFilter: 'blur(4px)'
            }}
            className="md:hidden"
          />
        )}

        <aside style={{
          width: '260px', background: 'var(--primary-green)', color: 'white',
          padding: '1.5rem', display: 'flex', flexDirection: 'column',
          position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 120, overflowY: 'auto',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}
          className={`${isSidebarOpen ? 'sidebar-open' : ''} dashboard-sidebar`}
        >
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white', fontSize: '1.2rem' }}
            className="md:hidden"
          >
            ✕
          </button>

          <div style={{ marginBottom: '2rem' }}>
            <TenantSelector />
          </div>

          {/* Become a Provider Link for Guest */}
        {user?.role === 'guest' && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Want to list your own property?</p>
            <button 
              onClick={() => setModalOpen(true)}
              style={{ 
                width: '100%', padding: '0.6rem', borderRadius: '8px', 
                background: 'var(--primary-gold)', color: 'white', 
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' 
              }}
            >
              Become a Provider
            </button>
          </div>
        )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
            {[
                { href: '/', label: 'Marketplace', icon: '🏛️' },
                ...(user?.role === 'guest' ? [
                  { href: '/dashboard/guest', label: 'My Experience', icon: '🏠' },
                  { href: '/dashboard/bookings', label: 'My Bookings', icon: '📅' },
                  { href: '/dashboard/chats', label: 'Messages', icon: '💬' },
                ] : [
                  { href: '/dashboard', label: 'Overview', icon: '📊' },
                  { href: '/dashboard/units', label: 'My Units', icon: '🏠' },
                  { href: '/dashboard/subscription', label: 'Subscription', icon: '💎' },
                  { href: '/dashboard/profile', label: 'Brand Profile', icon: '✨' },
                  { href: '/dashboard/bookings', label: 'Bookings', icon: '📅' },
                  { href: '/dashboard/reviews', label: 'Reviews', icon: '⭐' },
                  { href: '/dashboard/finances', label: 'Finances', icon: '💰' },
                   { href: '/dashboard/reports', label: 'Reports & AI', icon: '🤖' },
                  { href: '/dashboard/leads', label: 'Leads & CRM', icon: '👥' },
                  { href: '/dashboard/contracts', label: 'Digital Contracts', icon: '📝' },
                  { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
                  { href: '/dashboard/support', label: 'Support & Help', icon: '❓' },
                ]),

                ...((user?.role === 'admin' || user?.role === 'super admin') ? [
                  { href: '/dashboard/admin/partners', label: 'Manage Partners', icon: '🤝' },
                  { href: '/dashboard/admin/subscriptions', label: 'Sub Approvals', icon: '✅' },
                  { href: '/dashboard/settings', label: 'Admin Settings', icon: '⚙️' }
                ] : []),
              ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
                padding: '0.8rem 1rem', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'all 0.3s ease', fontWeight: 500, fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.8)',
              }}
                className="sidebar-link"
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
            <button
              onClick={logout}
              style={{
                width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              Logout
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px' }} className="dashboard-content-wrapper">
          {/* Dashboard Internal Header */}
          <header style={{
            height: '64px', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem',
            position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }} className="dashboard-internal-header">
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <button 
                 onClick={() => setSidebarOpen(true)}
                 style={{ 
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   width: '32px', height: '32px', borderRadius: '6px',
                   background: 'rgba(0, 77, 64, 0.05)', color: 'var(--primary-green)',
                   border: '1px solid rgba(0, 77, 64, 0.1)'
                 }}
                 className="desktop-hide"
                 aria-label="Open menu"
               >
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <line x1="3" y1="12" x2="21" y2="12"></line>
                   <line x1="3" y1="6" x2="21" y2="6"></line>
                   <line x1="3" y1="18" x2="21" y2="18"></line>
                 </svg>
               </button>
               <div style={{ fontSize: '0.85rem', color: 'var(--title-color)', fontWeight: 700 }} className="mobile-hide">
                  {user?.role === 'super admin' ? '⚡ Super Admin Dashboard' : 
                   user?.role === 'admin' ? '🔧 Administrator Dashboard' :
                   user?.role === 'host' ? '🏠 Partner Dashboard' : '👤 User Dashboard'}
               </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }} className="mobile-hide">
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{user?.displayName || 'User'}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--muted)', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
                </div>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(212,175,55,0.4)' }}>
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
             </div>
          </header>

          <main style={{ padding: '2.5rem', background: 'var(--background)', minHeight: 'calc(100vh - 64px)' }} className="dashboard-main">
            {children}
          </main>
          <ProviderRequestModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
        </div>
      </div>


      <style jsx global>{`
         /* Sidebar FAB: secondary toggle */
         .dashboard-fab {
           display: none;
         }

         .desktop-hide {
           display: none;
         }

        .dashboard-sidebar {
          transform: translateX(0);
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.1);
          color: white !important;
          transform: translateX(4px);
        }
        .sidebar-link.active {
          background: var(--primary-gold);
          color: white !important;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }
        
        @media (max-width: 768px) {
           /* Show the toggles on mobile */
           .dashboard-fab, .desktop-hide {
             display: flex !important;
           }

          .dashboard-sidebar {
            transform: translateX(-100%);
            top: 0;
            height: 100vh;
            width: min(280px, 85vw);
            padding: 1.25rem;
          }
          .dashboard-sidebar.sidebar-open {
            transform: translateX(0);
          }
          .dashboard-content-wrapper {
            margin-left: 0 !important;
          }
          .dashboard-internal-header {
            padding: 0 1rem !important;
            top: 0 !important;
            position: sticky;
            height: 52px !important;
          }
          .dashboard-main {
            padding: 1.25rem !important;
          }
        }

        @media (max-width: 480px) {
          .dashboard-sidebar {
            width: 90vw;
          }
          .dashboard-main {
            padding: 0.75rem !important;
          }
          .dashboard-internal-header {
            padding: 0 0.75rem !important;
          }
        }
      `}</style>

    </div>
  );
};

export default DashboardLayout;
