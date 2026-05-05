import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GlobalMapPage from '../app/map/page';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Mock dependencies
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn((q, callback) => {
    // Call the callback immediately with some mock data
    callback({
      docs: [
        { id: '1', data: () => ({ name: 'Test Unit 1', location: 'Location 1', price: 100, subscriptionStatus: 'active' }) },
      ]
    });
    return jest.fn(); // return unsubscribe function
  }),
}));

jest.mock('@/lib/firebase', () => ({
  db: {}
}));

// Mock next/image and next/script
jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('next/script', () => () => <div data-testid="mock-script" />);

// Mock Navbar to simplify test
jest.mock('@/components/Navbar', () => () => <div data-testid="mock-navbar" />);

describe('GlobalMapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock where return value so we can check if it was used in query
    (where as jest.Mock).mockImplementation((field, op, value) => ({ field, op, value }));
    (query as jest.Mock).mockImplementation((...args) => args);
  });

  it('fetches units with active subscriptionStatus', async () => {
    render(<GlobalMapPage />);
    
    await waitFor(() => {
      // Check that where was called with the correct arguments
      expect(where).toHaveBeenCalledWith('subscriptionStatus', '==', 'active');
      
      // Check that query was called
      expect(query).toHaveBeenCalled();
      
      // Check that the returned units are rendered
      expect(screen.getByText('Test Unit 1')).toBeInTheDocument();
    });
  });
});
