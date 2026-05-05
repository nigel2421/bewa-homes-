'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const tenantId = user.selectedTenantId || user.tenantId;

    let bQ;
    if (isAdmin && !tenantId) {
      bQ = query(collection(db, 'bookings'));
    } else {
      bQ = query(collection(db, 'bookings'), where('tenantId', '==', tenantId));
    }

    let eQ;
    if (isAdmin && !tenantId) {
      eQ = query(collection(db, 'expenses'));
    } else {
      eQ = query(collection(db, 'expenses'), where('tenantId', '==', tenantId));
    }

    const unsubB = onSnapshot(bQ, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error('Bookings subscription error:', err);
      setError('Failed to load bookings data.');
    });

    const unsubE = onSnapshot(eQ, (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Expenses subscription error:', err);
      setError('Failed to load expenses data.');
      setLoading(false);
    });

    return () => {
      unsubB();
      unsubE();
    };
  }, [user]);

  const stats = useMemo(() => {
    const totalIncome = bookings
      .filter(b => ['Confirmed', 'Checked In', 'Checked Out', 'Completed', 'confirmed', 'checked-out'].includes(b.status))
      .reduce((sum, b) => sum + (parseFloat(b.actualAmount) || parseFloat(b.total) || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const avgBooking = bookings.length > 0 ? totalIncome / bookings.length : 0;

    // Unit-wise breakdown
    const unitBreakdown: Record<string, { income: number; expenses: number; bookings: number }> = {};
    bookings.forEach(b => {
      const unitName = b.unit || 'Unknown Unit';
      if (!unitBreakdown[unitName]) unitBreakdown[unitName] = { income: 0, expenses: 0, bookings: 0 };
      if (['Confirmed', 'Checked In', 'Checked Out', 'Completed', 'confirmed', 'checked-out'].includes(b.status)) {
        unitBreakdown[unitName].income += (parseFloat(b.actualAmount) || parseFloat(b.total) || 0);
        unitBreakdown[unitName].bookings += 1;
      }
    });

    expenses.forEach(e => {
      const unitName = e.unit || 'General';
      if (!unitBreakdown[unitName]) unitBreakdown[unitName] = { income: 0, expenses: 0, bookings: 0 };
      unitBreakdown[unitName].expenses += (parseFloat(e.amount) || 0);
    });

    return { totalIncome, totalExpenses, netProfit, margin, avgBooking, count: bookings.length, unitBreakdown };
  }, [bookings, expenses]);

  const generateAIInsight = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const { totalIncome, totalExpenses, margin, count, unitBreakdown } = stats;
      let insight = `Financial Intelligence Report Summary:\n\n`;
      
      insight += `📊 PERFORMANCE OVERVIEW\n`;
      insight += `You have managed ${count} active records this period with a net profit margin of ${margin.toFixed(1)}%.\n\n`;

      if (margin > 30) {
        insight += "✅ Healthy Growth: Your operations are lean. Consider expanding your portfolio or increasing marketing spend for underperforming units.";
      } else {
        insight += "⚠️ Optimization Needed: Your margins are tight. Focus on reducing variable expenses like utilities or maintenance for high-cost units.";
      }

      const topUnit = Object.entries(unitBreakdown).sort((a, b) => b[1].income - a[1].income)[0];
      if (topUnit) {
        insight += `\n\n🏆 TOP PERFORMER\n${topUnit[0]} generated KES ${topUnit[1].income.toLocaleString()} this month.`;
      }

      const highExpenseUnit = Object.entries(unitBreakdown).sort((a, b) => b[1].expenses - a[1].expenses)[0];
      if (highExpenseUnit && highExpenseUnit[1].expenses > highExpenseUnit[1].income * 0.4) {
        insight += `\n\n🚩 EXPENSE WARNING\n${highExpenseUnit[0]} has high overhead costs (KES ${highExpenseUnit[1].expenses.toLocaleString()}). Check for leakages or unusual maintenance bills.`;
      }

      setAiInsight(insight);
      setIsGenerating(false);
    }, 1500);
  };

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div style={{ 
        height: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="glass-card" style={{ 
          padding: '2.5rem', 
          borderRadius: '24px', 
          textAlign: 'center',
          border: '1px solid #ef4444'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-playfair)' }}>Something went wrong</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="premium-button">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="luxury-text-gradient" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-playfair)', marginBottom: '0.5rem' }}>Financial Intelligence</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Comprehensive record of expenses vs actual bookings.</p>
        </div>
        <button 
          onClick={generateAIInsight}
          disabled={isGenerating}
          className="premium-button"
          style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isGenerating ? 'Analyzing...' : '✨ Generate AI Report'}
        </button>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        {[
          { label: 'Total Revenue', value: stats.totalIncome, color: 'var(--primary-green)', icon: '💰' },
          { label: 'Total Expenses', value: stats.totalExpenses, color: '#ef4444', icon: '💸' },
          { label: 'Net Profit', value: stats.netProfit, color: 'var(--primary-gold)', icon: '📈' },
          { label: 'Profit Margin', value: stats.margin.toFixed(1) + '%', color: 'var(--primary-green)', icon: '🎯' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ 
            padding: '1.5rem', 
            borderRadius: '20px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>
              {typeof s.value === 'number' ? `KES ${s.value.toLocaleString()}` : s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }} className="mobile-grid-1">
        {/* Visual Report & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ 
            padding: '2rem', 
            borderRadius: '24px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--card-border)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-playfair)' }}>Unit Performance Breakdown</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Unit Name</th>
                    <th style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Bookings</th>
                    <th style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Revenue</th>
                    <th style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Expenses</th>
                    <th style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.unitBreakdown).map(([name, data]: any) => (
                    <tr key={name} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{name}</td>
                      <td style={{ padding: '1rem' }}>{data.bookings}</td>
                      <td style={{ padding: '1rem', color: 'var(--primary-green)' }}>KES {data.income.toLocaleString()}</td>
                      <td style={{ padding: '1rem', color: '#ef4444' }}>KES {data.expenses.toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>KES {(data.income - data.expenses).toLocaleString()}</td>
                    </tr>
                  ))}
                  {Object.keys(stats.unitBreakdown).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No data available for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Insight Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ 
            padding: '2rem', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(0, 77, 64, 0.05))', 
            border: '1px solid var(--primary-gold)',
            flex: 1,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.05 }}>🤖</div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI Performance Insight
            </h3>
            <div style={{ 
              fontSize: '0.95rem', 
              lineHeight: 1.6, 
              color: 'var(--foreground)', 
              whiteSpace: 'pre-wrap',
              minHeight: '200px'
            }}>
              {aiInsight || (
                <div style={{ color: 'var(--muted)', fontStyle: 'italic', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
                  <p>Click "Generate AI Report" to analyze your portfolio performance.</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            borderRadius: '20px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--card-border)' 
          }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Portfolio Efficiency</h4>
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: `${Math.min(stats.margin, 100)}%`, height: '100%', background: 'var(--primary-gold)' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }}>
              <span>Low</span>
              <span style={{ color: 'var(--primary-gold)', fontWeight: 700 }}>{stats.margin.toFixed(0)}% ROI</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
