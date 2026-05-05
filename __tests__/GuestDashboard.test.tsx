import React from 'react';
import { render, screen } from '@testing-library/react';
import GuestDashboard from '../app/dashboard/guest/page';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'guest-123', email: 'guest@example.com', role: 'guest', displayName: 'Nigel' },
    loading: false
  })
}));

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  db: {}
}));

describe('GuestDashboard', () => {
  it('renders guest welcome message', () => {
    render(<GuestDashboard />);
    expect(screen.getByText(/Welcome, Nigel/i)).toBeInTheDocument();
  });

  it('displays the stays section', () => {
    render(<GuestDashboard />);
    expect(screen.getByText(/Manage your stays/i)).toBeInTheDocument();
  });
});
