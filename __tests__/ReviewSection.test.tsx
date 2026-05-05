import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewSection from '../components/ReviewSection';
import { useAuth } from '../context/AuthContext';

// Mock window.alert
window.alert = jest.fn();

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn((q, cb) => {
    cb({
      docs: [
        { id: 'r1', data: () => ({ userName: 'Alice', rating: 5, comment: 'Great stay!', createdAt: { toDate: () => new Date() } }) }
      ]
    });
    return () => {};
  }),
  getDocs: jest.fn(() => Promise.resolve({
    empty: false // Simulate having a completed booking
  })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-review' })),
  serverTimestamp: jest.fn()
}));

describe('ReviewSection Component', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'u1', displayName: 'Test User', email: 'test@example.com', role: 'guest' },
      loading: false
    });
  });

  it('renders existing reviews', async () => {
    render(<ReviewSection unitId="unit-1" />);
    await waitFor(() => {
      expect(screen.getByText(/Great stay!/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    });
  });

  it('allows submission if user has a completed booking', async () => {
    render(<ReviewSection unitId="unit-1" />);
    // Wait for eligibility check
    const commentInput = await screen.findByPlaceholderText(/Share details about your stay.../i);
    expect(commentInput).toBeInTheDocument();
    
    fireEvent.change(commentInput, { target: { value: 'Amazing experience!' } });
    const thumbsUp = screen.getByRole('button', { name: /Thumbs Up/i });
    fireEvent.click(thumbsUp);
    const submitBtn = screen.getByText(/Publish Review/i);
    fireEvent.click(submitBtn);
    
    await waitFor(() => expect(commentInput).toHaveValue(''), { timeout: 4000 });
  });
});
