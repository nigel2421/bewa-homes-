import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from '../components/ChatInterface';
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
        { id: 'm1', data: () => ({ senderId: 'u2', senderName: 'Host', text: 'Recent message', createdAt: { toDate: () => new Date() } }) },
        { id: 'm2', data: () => ({ senderId: 'u1', senderName: 'Me', text: 'Old message (will be filtered)', createdAt: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }) }
      ]
    });
    return () => {};
  }),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-msg' })),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn()
}));

describe('ChatInterface Component', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'u1', displayName: 'Client' },
      loading: false
    });
  });

  it('renders recent messages and filters expired ones', () => {
    render(<ChatInterface chatId="c1" recipientName="Host" />);
    expect(screen.getByText('Recent message')).toBeInTheDocument();
    // In our component, we filter OLD messages on the client side for visual hygiene
    // The test mock sends both, component should only show the recent one if filter is applied
    expect(screen.queryByText('Old message (will be filtered)')).toBeNull();
  });

  it('allows sending a new message', async () => {
    render(<ChatInterface chatId="c1" recipientName="Host" />);
    const input = screen.getByPlaceholderText(/Type a message.../i);
    fireEvent.change(input, { target: { value: 'Hello there!' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => expect(input).toHaveValue('')); 
  });
});
