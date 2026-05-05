import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'nigel2421@gmail.com', role: 'admin', displayName: 'Nigel' },
    loading: false
  })
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }: any) => <div>{children}</div>
}));

describe('Navbar Component', () => {
  it('renders the brand logo correctly as an image', () => {
    render(<Navbar />);
    expect(screen.getByAltText(/Bewa Homes/i)).toBeInTheDocument();
  });

  it('renders navigation links for an authenticated user', () => {
    render(<Navbar />);
    // Check for dashboard links (might be multiple due to mobile/desktop views)
    const dashboardLinks = screen.getAllByText(/Dashboard/i);
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(dashboardLinks[0]).toBeInTheDocument();
  });
});
