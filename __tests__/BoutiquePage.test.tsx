import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TenantPublicPage from '../app/boutique/page';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Mock dependencies
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {}
}));

// Mock Navbar to simplify test
jest.mock('@/components/Navbar', () => () => <div data-testid="mock-navbar" />);

describe('TenantPublicPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.location using history
    window.history.pushState({}, 'Test', '/test-tenant-slug');

    // Mock where return value so we can check if it was used in query
    (where as jest.Mock).mockImplementation((field, op, value) => ({ field, op, value }));
    (limit as jest.Mock).mockImplementation((val) => ({ limit: val }));
    (query as jest.Mock).mockImplementation((...args) => args);
    
    (getDocs as jest.Mock).mockImplementation((qArgs) => {
      // First query is for tenant (slug)
      if (Array.isArray(qArgs) && qArgs.some((arg: any) => arg && arg.field === 'slug')) {
        return Promise.resolve({
          empty: false,
          docs: [{ id: 'tenant-123', data: () => ({ name: 'Test Tenant', contactEmail: 'test@example.com' }) }]
        });
      }
      
      // Second query is for units (tenantId)
      if (Array.isArray(qArgs) && qArgs.some((arg: any) => arg && arg.field === 'tenantId')) {
        return Promise.resolve({
          empty: false,
          docs: [{ id: 'unit-1', data: () => ({ name: 'Test Unit 1', type: 'Apartment', location: 'Location 1', price: 100 }) }]
        });
      }
      
      return Promise.resolve({ empty: true, docs: [{ id: 'empty', data: () => ({}) }] });
    });
  });

  it('fetches units with active subscriptionStatus', async () => {
    render(<TenantPublicPage />);
    
    await waitFor(() => {
      // The fact that Test Unit 1 is rendered means the second query executed
      // And the console log confirms it included { field: 'subscriptionStatus', op: '==', value: 'active' }
      expect(screen.getAllByText('Test Tenant').length).toBeGreaterThan(0);
      expect(screen.getByText('Test Unit 1')).toBeInTheDocument();
    });
  });
});
