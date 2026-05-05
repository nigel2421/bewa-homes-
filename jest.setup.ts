import '@testing-library/jest-dom';

// Mock window.alert
global.alert = jest.fn();

// Polyfill environment for Firebase SDK
if (!global.fetch) {
  (global as any).fetch = jest.fn();
  (global as any).Request = jest.fn();
  (global as any).Response = jest.fn();
  (global as any).Headers = jest.fn();
}

// Mock Next.js fonts
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
  Playfair_Display: () => ({ className: 'playfair' }),
}));

// Mock our internal firebase lib instead of the whole SDK sometimes helps
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  googleProvider: {},
  storage: {}
}));

// Mock Firebase globally to prevent initialization errors
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  signInWithRedirect: jest.fn(),
  getRedirectResult: jest.fn(),
  signInWithEmailLink: jest.fn(),
  isSignInWithEmailLink: jest.fn(),
  sendSignInLinkToEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));


