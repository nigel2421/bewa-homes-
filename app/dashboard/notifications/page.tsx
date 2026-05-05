'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  category: 'System' | 'Account' | 'Booking' | 'Finance' | 'Review';
}

const CATEGORY_COLORS: Record<Notification['category'], string> = {
  System:  'var(--primary-green)',
  Account: 'var(--primary-gold)',
  Booking: '#3b82f6',
  Finance: '#8b5cf6',
  Review:  '#f59e0b',
};

const CATEGORY_ICONS: Record<Notification['category'], string> = {
  System:  '🔔',
  Account: '✅',
  Booking: '📅',
  Finance: '💰',
  Review:  '⭐',
};

const NotificationsPage = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Welcome to Bewa Homes!',
      message: 'Thank you for joining our exclusive platform. Start exploring our premium collection of homes.',
      time: 'Just now',
      unread: true,
      category: 'System',
    },
    {
      id: 2,
      title: 'Profile Verified',
      message: 'Your account has been successfully verified. You now have full access to host features.',
      time: '2 hours ago',
      unread: false,
      category: 'Account',
    },
    {
      id: 3,
      title: 'New Booking Request',
      message: 'You have received a new booking request for Lekki Phase 1 Suite. Review and confirm.',
      time: 'Yesterday',
      unread: true,
      category: 'Booking',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  const markRead = (id: number) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );

  return (
    <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Page Header ─────────────────────────────── */}
      <header style={{
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1
            className="luxury-text-gradient"
            style={{ fontSize: '2.2rem', marginBottom: '0.4rem', fontWeight: 700 }}
          >
            Notifications
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
              : 'You\'re all caught up! No new notifications.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '10px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-gold)';
              e.currentTarget.style.color = 'var(--primary-gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--card-border)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
          >
            ✓ Mark all as read
          </button>
        )}
      </header>

      {/* ── Notification List ────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              style={{
                background: notif.unread
                  ? 'var(--card-bg)'
                  : 'transparent',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                border: notif.unread
                  ? `1px solid var(--card-border)`
                  : '1px solid transparent',
                borderLeft: notif.unread
                  ? `4px solid ${CATEGORY_COLORS[notif.category]}`
                  : '4px solid var(--card-border)',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                cursor: 'pointer',
                boxShadow: notif.unread ? 'var(--shadow-sm)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = notif.unread ? 'var(--shadow-sm)' : 'none';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: notif.unread
                  ? CATEGORY_COLORS[notif.category]
                  : 'var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '1.2rem',
                transition: 'background 0.2s ease',
              }}>
                {CATEGORY_ICONS[notif.category]}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.3rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}>
                  <h3 style={{
                    color: 'var(--foreground)',
                    fontWeight: notif.unread ? 700 : 500,
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-inter)',
                    margin: 0,
                  }}>
                    {notif.title}
                  </h3>
                  <span style={{
                    color: 'var(--muted)',
                    fontSize: '0.78rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {notif.time}
                  </span>
                </div>

                <p style={{
                  color: 'var(--muted)',
                  lineHeight: '1.55',
                  fontSize: '0.88rem',
                  margin: '0 0 0.75rem',
                }}>
                  {notif.message}
                </p>

                {/* Category badge */}
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  background: `${CATEGORY_COLORS[notif.category]}18`,
                  color: CATEGORY_COLORS[notif.category],
                  border: `1px solid ${CATEGORY_COLORS[notif.category]}35`,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>
                  {notif.category}
                </span>
              </div>

              {/* Unread dot */}
              {notif.unread && (
                <div style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'var(--primary-gold)',
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  flexShrink: 0,
                  boxShadow: '0 0 6px rgba(212,175,55,0.6)',
                }} />
              )}
            </div>
          ))
        ) : (
          /* Empty State */
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: 'var(--card-bg)',
            borderRadius: '20px',
            border: '1px dashed var(--card-border)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>🔔</div>
            <h3 style={{
              color: 'var(--foreground)',
              fontWeight: 500,
              opacity: 0.6,
              fontFamily: 'var(--font-inter)',
              margin: 0,
            }}>
              No notifications yet
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              We'll notify you when something arrives.
            </p>
          </div>
        )}
      </div>

      {/* Mobile responsive styles */}
      <style jsx>{`
        @media (max-width: 480px) {
          h1 { font-size: 1.75rem !important; }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
