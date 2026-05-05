import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HostDetail from '../app/host/view/HostDetail';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

// Mock dependencies
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {}
}));

// Mock Navbar
jest.mock('@/components/Navbar', () => () => <div data-testid="mock-navbar" />);

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, login: jest.fn() })
}));

// We need to mock React.use because the component uses it for params
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    use: jest.fn((promiseOrContext) => {
      // Simple mock for the params promise
      return { id: 'test-host-id' };
    })
  };
});

describe('HostDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (where as jest.Mock).mockImplementation((field, op, value) => ({ field, op, value }));
    (query as jest.Mock).mockImplementation((...args) => args);
    (doc as jest.Mock).mockImplementation((...args) => args);
    
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Test Host Name', bio: 'Test Bio' })
    });
    
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: 'unit-1', data: () => ({ name: 'Host Test Unit', price: 100 }) }]
    });
  });

  it('fetches units with active subscriptionStatus', async () => {
    // Pass a fake promise to satisfy TypeScript
    render(<HostDetail params={Promise.resolve({ id: 'test-host-id' })} />);
    
    await waitFor(() => {
      // Check that where was called with subscriptionStatus == active
      expect(where).toHaveBeenCalledWith('subscriptionStatus', '==', 'active');
      
      // Check that query was called
      expect(query).toHaveBeenCalled();
      
      // Verify rendered content
      expect(screen.getByText('Test Host Name')).toBeInTheDocument();
    });
  });
});
