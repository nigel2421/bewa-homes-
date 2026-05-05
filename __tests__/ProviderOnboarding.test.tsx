import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProviderRequestModal from '../components/ProviderRequestModal';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'req-123' })),
  serverTimestamp: jest.fn()
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1', email: 'test@example.com', displayName: 'Nigel' }
  })
}));

describe('ProviderRequestModal Component', () => {
  it('submits the form with correct data', async () => {
    const onClose = jest.fn();
    render(<ProviderRequestModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText(/Royal Apartments/i), { target: { value: 'Bewa Homes' } });
    fireEvent.change(screen.getByPlaceholderText(/07\.\.\./i), { target: { value: '0711223344' } });
    fireEvent.change(screen.getByPlaceholderText(/City, Area/i), { target: { value: 'Nairobi' } });

    const submitBtn = screen.getByText(/Submit Onboarding Request/i);
    fireEvent.click(submitBtn);

    // Check if it closes after submission
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 4000 });
  });

  it('does not render if isOpen is false', () => {
    const { container } = render(<ProviderRequestModal isOpen={false} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
