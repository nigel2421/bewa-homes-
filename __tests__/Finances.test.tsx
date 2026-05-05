import React from 'react';
import { render, screen } from '@testing-library/react';
import FinancesPage from '../app/dashboard/finances/page';

// 1. Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id', tenantId: 'test-tenant-id', role: 'admin' },
    loading: false
  })
}));

// 2. Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, path) => ({ type: 'collection', path })),
  query: jest.fn((col) => col),
  where: jest.fn(() => (q: any) => q),
  orderBy: jest.fn(() => (q: any) => q),
  onSnapshot: jest.fn((q, callback) => {
    callback({
      docs: (q && q.path === 'bookings')
        ? [{ id: 'inc-1', data: () => ({ type: 'Income', total: 5000, category: 'Stay', date: '2026-04-19', status: 'Confirmed' }) }]
        : [{ id: 'exp-1', data: () => ({ type: 'Expense', amount: 2000, category: 'Maintenance', date: '2026-04-19', status: 'Confirmed' }) }]
    });
    return () => {};
  }),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  getFirestore: jest.fn()
}));

describe('Finances Dashboard', () => {
  it('calculates Net Profit correctly', async () => {
    render(<FinancesPage />);
    // Income: 5000, Expense: 2000, Net: 3000
    // Component renders "KES 3,000"
    const netProfit = await screen.findByText(/3,000/, {}, { timeout: 4000 });
    expect(netProfit).toBeInTheDocument();
  });
});
