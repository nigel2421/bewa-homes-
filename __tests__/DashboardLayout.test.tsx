import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayout from '../app/dashboard/layout';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1', email: 'nigel2421@gmail.com', role: 'admin', displayName: 'Nigel' },
    loading: false
  })
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock Navbar component
jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="main-navbar" className="mobile-hide">Navbar</div>;
  };
});

describe('DashboardLayout Component', () => {
  it('renders the dashboard layout with internal header', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Nigel/i)).toBeInTheDocument();
  });

  it('contains the mobile-only hamburger toggle', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    // The hamburger toggle has class 'desktop-hide'
    const toggle = screen.getByLabelText(/Open menu/i);
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass('desktop-hide');
  });

  it('contains the Marketplace link in the sidebar', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    const marketplaceLink = screen.getByText(/Marketplace/i);
    expect(marketplaceLink).toBeInTheDocument();
    expect(marketplaceLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('hides the main Navbar on mobile via mobile-hide class', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );
    const navbar = screen.getByTestId('main-navbar');
    expect(navbar).toHaveClass('mobile-hide');
  });
});
