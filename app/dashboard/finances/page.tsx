'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FinancesPage() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', date: '', category: 'General', isRecurring: false, templateId: '' });
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'recurring'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Date Range Presets
  const getThisMonth = () => ({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const getThisYear = () => ({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
  });

  const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null, label: string }>({
    ...getThisYear(),
    label: 'This Year'
  });

  useEffect(() => {
    if (!user) return;

    const isAdmin = user?.role === 'admin' || user?.role === 'super admin';
    
    // Check if non-admin has tenantId
    if (!isAdmin && !user.tenantId) {
      setError('Your account is not associated with a tenant. Please contact support.');
      setLoading(false);
      return;
    }

    let unsubBookings = () => {};
    let unsubExpenses = () => {};
    let unsubRecurring = () => {};

    try {
      // Fetch Bookings (Income)
      let bookingsQ;
      if (isAdmin && !user.tenantId) {
        bookingsQ = query(collection(db, 'bookings'));
      } else {
        bookingsQ = query(collection(db, 'bookings'), where('tenantId', '==', user.tenantId));
      }

      // Fetch Expenses
      let expensesQ;
      if (isAdmin && !user.tenantId) {
        expensesQ = query(collection(db, 'expenses'));
      } else {
        expensesQ = query(collection(db, 'expenses'), where('tenantId', '==', user.tenantId));
      }

      let results = { bookings: [] as any[], expenses: [] as any[] };
      let loadingCount = 2;

      const updateLedger = () => {
        const merged = [
          ...results.bookings,
          ...results.expenses
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTransactions(merged);
        if (loadingCount <= 0) setLoading(false);
      };

      unsubBookings = onSnapshot(bookingsQ, (snap) => {
        results.bookings = snap.docs.map(doc => {
          const d = doc.data();
          const amount = Number(d?.actualAmount ?? d?.total ?? 0);
          const date = d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString();
          
          return {
            id: doc.id,
            type: 'Income',
            description: `Booking: ${d?.unit ?? 'Unknown Unit'} (${d?.guest ?? 'Unknown Guest'})`,
            amount: isNaN(amount) ? 0 : amount,
            date: date,
            status: d?.status ?? 'Pending'
          };
        }).filter(d => ['Confirmed', 'Checked In', 'Checked Out', 'Completed', 'confirmed', 'checked-out'].includes(d.status));

        if (loadingCount > 0) loadingCount--;
        updateLedger();
      }, (err) => {
        console.error('Bookings subscription error:', err);
        setError('Failed to load bookings data.');
        setLoading(false);
      });

      unsubExpenses = onSnapshot(expensesQ, (snap) => {
        results.expenses = snap.docs.map(doc => {
          const d = doc.data();
          const amount = Number(d?.amount ?? 0);
          return {
            id: doc.id,
            type: 'Expense',
            description: d?.description ?? 'Unspecified Expense',
            amount: isNaN(amount) ? 0 : amount,
            date: d?.date ?? new Date().toISOString(),
            category: d?.category ?? 'General',
            status: 'Confirmed',
            templateId: d?.templateId ?? null
          };
        });
        
        if (loadingCount > 0) loadingCount--;
        updateLedger();
      }, (err) => {
        console.error('Expenses subscription error:', err);
        setError('Failed to load expenses data.');
        setLoading(false);
      });

      // Fetch Recurring Templates
      let recurringQ;
      if (isAdmin && !user.tenantId) {
        recurringQ = query(collection(db, 'recurring_expenses'));
      } else {
        recurringQ = query(collection(db, 'recurring_expenses'), where('tenantId', '==', user.tenantId));
      }

      unsubRecurring = onSnapshot(recurringQ, (snap) => {
        setRecurringTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error('Recurring expenses error:', err);
      });

    } catch (err) {
      console.error('Finance page query initialization error:', err);
      setError('An error occurred while initializing financial data.');
      setLoading(false);
    }

    return () => { unsubBookings(); unsubExpenses(); unsubRecurring(); };
  }, [user?.uid, user?.tenantId, user?.role]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const templateId = expenseForm.templateId || null;
      const expenseData = {
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        date: expenseForm.date || new Date().toISOString(),
        category: expenseForm.category,
        tenantId: user.tenantId || 'global',
        templateId: templateId,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'expenses'), expenseData);

      if (expenseForm.isRecurring) {
        await addDoc(collection(db, 'recurring_expenses'), {
          description: expenseForm.description,
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          dayOfMonth: new Date(expenseForm.date).getDate(),
          tenantId: user.tenantId || 'global',
          createdAt: serverTimestamp()
        });
      }

      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: '', date: '', category: 'General', isRecurring: false, templateId: '' });
    } catch(err) {
       console.error(err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring template?')) return;
    try {
      await deleteDoc(doc(db, 'recurring_expenses', templateId));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date Range Filter
      let matchesDate = true;
      try {
        const txDate = new Date(t.date).toISOString().split('T')[0];
        matchesDate = (!dateRange.start || txDate >= dateRange.start) && 
                      (!dateRange.end || txDate <= dateRange.end);
      } catch (e) {
        console.warn('Invalid date in transaction:', t);
        matchesDate = false;
      }
                          
      return matchesType && matchesSearch && matchesDate;
    });
  }, [transactions, filterType, searchTerm, dateRange.start, dateRange.end]);

  const { totalIncome, totalExpenses, netProfit, marginStr } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = income - expenses;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(0) : '0';
    return { totalIncome: income, totalExpenses: expenses, netProfit: profit, marginStr: margin };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Status'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      `"${t.description.replace(/"/g, '""')}"`, // Robust CSV escaping
      `"${(t.category || 'N/A').replace(/"/g, '""')}"`,
      t.amount,
      t.status || 'Confirmed'
    ]);

    const csvContent = "sep=,\n" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bewa_Finances_${dateRange.label.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Chart Data (Filter by current selection's year if "This Year" or "All Time")
  const { INCOME_DATA, EXPENSE_DATA, displayYear, MAX_VALUE } = useMemo(() => {
    const year = dateRange.start ? new Date(dateRange.start).getFullYear() : new Date().getFullYear();
    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);

    transactions.forEach(t => {
      try {
        const d = new Date(t.date);
        if (!isNaN(d.getTime()) && d.getFullYear() === year) {
          const month = d.getMonth();
          if (t.type === 'Income') income[month] += (t.amount || 0);
          else expense[month] += (t.amount || 0);
        }
      } catch (e) {
        console.warn('Chart data error for transaction:', t);
      }
    });

    const maxValue = Math.max(...income, ...expense, 1000) * 1.1;
    return { INCOME_DATA: income, EXPENSE_DATA: expense, displayYear: year, MAX_VALUE: maxValue };
  }, [transactions, dateRange.start]);

  const displayMonths = MONTHS;


  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--primary-gold)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Loading Ledger...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', margin: '2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ color: 'var(--title-color)', marginBottom: '1rem' }}>Something went wrong</h2>
      <p style={{ color: '#ef4444', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="premium-button"
        style={{ padding: '0.8rem 2rem' }}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--title-color)', marginBottom: '0.4rem', fontFamily: 'var(--font-playfair)' }}>Finances</h1>
          <p style={{ color: 'var(--muted)' }}>Track income, expenses and profitability across all units.</p>
        </div>
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="premium-button" 
          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
        >
          + Log Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: 'Gross Revenue (Paid)', value: `KES ${totalIncome.toLocaleString()}`, color: '#10b981', icon: '↑' },
          { label: 'Total Expenses', value: `KES ${totalExpenses.toLocaleString()}`, color: '#ef4444', icon: '↓' },
          { label: 'Net Profit', value: `KES ${netProfit.toLocaleString()}`, color: 'var(--primary-gold)', icon: '💰' },
          { label: 'Profit Margin', value: `${marginStr}%`, color: '#8b5cf6', icon: '📈' },
          { label: 'Monthly Commitments', value: `KES ${recurringTemplates.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}`, color: '#3b82f6', icon: '🗓️' },
        ].map(card => (
          <div key={card.label} className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{card.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{card.icon}</span>
              {card.label === 'Profit Margin' && (
                <div style={{ width: '40px', height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, parseInt(marginStr)))}%`, height: '100%', background: card.color }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs System */}
      <div style={{ marginBottom: '2rem', background: 'var(--card-border)', padding: '0.3rem', borderRadius: '12px', display: 'inline-flex', gap: '4px' }}>
        {[
          { id: 'overview', label: 'Overview', count: null },
          { id: 'ledger', label: 'Detailed Ledger', count: transactions.length },
          { id: 'recurring', label: 'Monthly Recurring', count: recurringTemplates.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--background)' : 'transparent',
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: 'var(--card-border)', color: 'var(--muted)' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Date Range Selector & Export */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'This Month', range: getThisMonth() },
            { label: 'This Year', range: getThisYear() },
            { label: 'All Time', range: { start: null, end: null } }
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => setDateRange({ ...preset.range, label: preset.label })}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                border: '1px solid ' + (dateRange.label === preset.label ? 'var(--primary-gold)' : 'var(--card-border)'),
                background: dateRange.label === preset.label ? 'var(--primary-gold)' : 'var(--card-bg)',
                color: dateRange.label === preset.label ? 'white' : 'var(--muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: dateRange.label === preset.label ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {preset.label}
            </button>
          ))}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', background: 'var(--card-bg)', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
             <input 
               type="date" 
               value={dateRange.start || ''} 
               onChange={(e) => setDateRange({ ...dateRange, start: e.target.value, label: 'Custom' })}
               style={{ border: 'none', fontSize: '0.75rem', color: 'var(--foreground)', outline: 'none', background: 'transparent' }}
             />
             <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>-</span>
             <input 
               type="date" 
               value={dateRange.end || ''} 
               onChange={(e) => setDateRange({ ...dateRange, end: e.target.value, label: 'Custom' })}
               style={{ border: 'none', fontSize: '0.75rem', color: 'var(--foreground)', outline: 'none', background: 'transparent' }}
             />
          </div>
        </div>

        {activeTab === 'ledger' && (
           <button 
             onClick={handleExportCSV}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
           >
             📥 Export CSV
           </button>
        )}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Bar Chart */}
          <div className="glass-card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', marginBottom: '3rem', overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1.75rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Revenue Overview ({displayYear})</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '180px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              {displayMonths.map((month, i) => (
                <div key={month} className="chart-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', width: '100%', justifyContent: 'center', height: '100%' }}>
                    {/* Income Bar */}
                    <div className="chart-bar income" style={{
                      width: '35%', 
                      borderRadius: '6px 6px 0 0',
                      height: `${(INCOME_DATA[i] / MAX_VALUE) * 100}%`,
                      background: INCOME_DATA[i] > 0 ? 'linear-gradient(to top, #059669, #10b981)' : 'var(--card-border)',
                      minHeight: '2px', 
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      {INCOME_DATA[i] > 0 && (
                        <div className="chart-tooltip">
                          KES {INCOME_DATA[i].toLocaleString()}
                        </div>
                      )}
                    </div>
                    {/* Expense Bar */}
                    <div className="chart-bar expense" style={{
                      width: '35%', 
                      borderRadius: '6px 6px 0 0',
                      height: `${(EXPENSE_DATA[i] / MAX_VALUE) * 100}%`,
                      background: EXPENSE_DATA[i] > 0 ? 'linear-gradient(to top, #dc2626, #ef4444)' : 'var(--card-border)',
                      minHeight: '2px', 
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      {EXPENSE_DATA[i] > 0 && (
                        <div className="chart-tooltip">
                          KES {EXPENSE_DATA[i].toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
              {displayMonths.map(m => <span key={m} style={{ fontSize: '0.75rem', color: 'var(--muted)', flex: 1, textAlign: 'center' }}>{m}</span>)}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Income</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Expenses</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transactions / Recurring Logic */}
      {/* Transactions Ledger */}
      {(activeTab === 'ledger' || activeTab === 'overview') && (
        <div className="glass-card" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>
              {activeTab === 'ledger' ? 'Transaction Ledger' : 'Recent Transactions'}
            </h3>
            
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Search ledger..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '0.5rem 1rem 0.5rem 2.2rem', 
                    borderRadius: '20px', 
                    border: '1px solid var(--card-border)',
                    fontSize: '0.85rem',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    width: '200px'
                  }}
                />
                <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              </div>
              
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px', 
                  border: '1px solid var(--card-border)',
                  fontSize: '0.85rem',
                  background: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="All">All Types</option>
                <option value="Income">Income Only</option>
                <option value="Expense">Expenses Only</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                  {['Date', 'Description', 'Category', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions
                  .slice(0, activeTab === 'overview' ? 10 : 100)
                  .map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                      {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.description}</span>
                        {t.templateId && <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>🔄 Recurring</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', color: 'var(--muted)' }}>
                        {t.category || (t.type === 'Income' ? 'Booking' : 'General')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: t.type === 'Income' ? '#10b981' : '#ef4444' }}>
                      {t.type === 'Income' ? '+' : '-'} KES {t.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', 
                        background: t.type === 'Income' ? '#d1fae5' : '#fee2e2',
                        color: t.type === 'Income' ? '#065f46' : '#991b1b',
                        fontWeight: 600
                      }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                No transactions found matching your criteria.
              </div>
            )}
          </div>
          
          {activeTab === 'overview' && filteredTransactions.length > 10 && (
            <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--card-border)' }}>
              <button onClick={() => setActiveTab('ledger')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                View All Transactions →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recurring' && (
        <div className="glass-card" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
            <div>
              <h3 style={{ color: 'var(--title-color)', fontFamily: 'var(--font-playfair)' }}>Monthly Subscriptions & Utilities</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Manage fixed costs that recur every month.</p>
            </div>
            <button 
              onClick={() => setShowExpenseModal(true)}
              style={{ background: 'var(--primary-green)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              + Add Template
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--background)' }}>
                  {['Expense Name', 'Category', 'Monthly Amount', 'Due Day', 'Current Month Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recurringTemplates.map((r, i) => {
                  const isPaid = transactions.some(t => 
                    t.type === 'Expense' && 
                    (t.templateId === r.id || (t.description === r.description && !t.templateId)) && 
                    new Date(t.date).getMonth() === new Date().getMonth() &&
                    new Date(t.date).getFullYear() === new Date().getFullYear()
                  );
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600 }}>{r.description}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>ID: {r.id.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }}>
                          {r.category}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>KES {r.amount.toLocaleString()}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>Day {r.dayOfMonth || 'Any'}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                          background: isPaid ? '#d1fae5' : '#fef3c7', color: isPaid ? '#065f46' : '#92400e'
                        }}>
                          {isPaid ? '✓ Paid' : '⚠ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!isPaid && (
                            <button 
                              onClick={() => {
                                setExpenseForm({ 
                                  description: r.description, 
                                  amount: r.amount.toString(), 
                                  date: new Date().toISOString().split('T')[0], 
                                  category: r.category, 
                                  isRecurring: false,
                                  templateId: r.id 
                                });
                                setShowExpenseModal(true);
                              }}
                              style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                              Quick Log
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteTemplate(r.id)}
                            style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', position: 'relative' }}>
            <h2 style={{ color: 'var(--title-color)', marginBottom: '1.5rem', fontSize: '1.3rem', fontFamily: 'var(--font-playfair)' }}>Log Operational Expense</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Description</label>
                <input type="text" required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="e.g. WiFi Bill, Plumber" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Amount</label>
                <input type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                    <option value="Operational">Operational</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Date</label>
                  <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ flex: 1, padding: '0.9rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: 'var(--foreground)' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.9rem', background: 'var(--primary-green)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
