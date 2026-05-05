'use client';

import React from 'react';

const LoadingScreen = () => {
  return (
    <div style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #052c14 0%, #0a4d25 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Decorative background circles */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(142,201,63,0.15) 0%, transparent 70%)',
        top: '-100px',
        right: '-100px',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(142,201,63,0.1) 0%, transparent 70%)',
        bottom: '-50px',
        left: '-50px',
        filter: 'blur(30px)',
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        animation: 'fadeIn 0.8s ease-out forwards',
        backdropFilter: 'blur(10px)',
        padding: '3rem',
        borderRadius: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Animated Logo / Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: '#8ec93f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(142, 201, 63, 0.4)',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ 
            color: 'white', 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            letterSpacing: '0.05em'
          }}>
            BEWA HOMES
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div className="loader-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8ec93f', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
            <div className="loader-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8ec93f', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}></div>
            <div className="loader-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8ec93f', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 20px rgba(142, 201, 63, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(142, 201, 63, 0.6); }
          100% { transform: scale(1); box-shadow: 0 0 20px rgba(142, 201, 63, 0.4); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
