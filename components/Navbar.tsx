'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, login, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoContainer}>
            <Image
              src="/bewa-logo.png"
              alt="Bewa Homes"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </Link>

        <div className={styles.links}>
          <Link href="/stays" className={styles.link}>Short/Long Stays</Link>
          <Link href="/land" className={styles.link}>Plots</Link>
          <Link href="/services" className={styles.link}>Services</Link>
          <Link href="/map" className={`${styles.link} ${styles.exploreLink}`}>Explore Map</Link>

          {loading ? (
            <div className="premium-button" style={{ opacity: 0.5 }}>...</div>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/dashboard" className="premium-button" style={{ fontSize: '0.85rem' }}>Dashboard</Link>
            </div>
          ) : (
            <button onClick={login} className="premium-button" style={{ fontSize: '0.85rem' }}>Login</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <button onClick={logout} className="premium-button-outline mobile-hide" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Logout</button>
          )}
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle Theme"
            style={{
              background: 'rgba(var(--primary-gold-rgb), 0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-gold)'
            }}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            )}
          </button>

          <button
            className={`md:hidden ${styles.menuToggle}`}
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            style={{ color: 'var(--primary-brand)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '2rem', height: '2rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
        data-testid="mobile-menu"
      >
        <button onClick={toggleMenu} className={styles.closeBtn}>✕</button>
        <div className={styles.mobileLinks}>
          <Link href="/stays" onClick={toggleMenu}>Short Stays</Link>
          <Link href="/land" onClick={toggleMenu} >Plots</Link>
          <Link href="/services" onClick={toggleMenu}>Services</Link>
          <Link href="/map" onClick={toggleMenu} style={{ color: 'var(--primary-gold)' }}>Explore Map</Link>
          <Link href="/dashboard" onClick={toggleMenu} >Dashboard</Link>
          {user ? (
            <button onClick={() => { logout(); toggleMenu(); }} className="premium-button">Logout</button>
          ) : (
            <button onClick={() => { login(); toggleMenu(); }} className="premium-button">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
