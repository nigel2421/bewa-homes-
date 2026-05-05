'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  createdAt?: any;
}

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super admin';

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      setLoadingUsers(true);
      const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as UserData));
        setUsersList(users);
        setLoadingUsers(false);
      }, (error) => {
        console.error("Error fetching users:", error);
        setLoadingUsers(false);
      });

      return () => unsubscribe();
    }
  }, [activeTab, isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    
    setUpdatingRole(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = ['profile', 'security'];
  if (isAdmin) tabs.push('users');
  tabs.push('billing', 'notifications');

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 className="luxury-text-gradient" style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          {activeTab === 'users' ? 'User Management' : 'Account Settings'}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {activeTab === 'users' ? 'Manage system users and their access roles.' : 'Manage your account preferences and security.'}
        </p>
      </header>

      <div style={{ display: 'flex', gap: '3rem' }}>
        {/* Sidebar Nav */}
        <nav style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                textAlign: 'left',
                padding: '1rem',
                borderRadius: '0.75rem',
                background: activeTab === tab ? 'var(--primary-gold-transparent)' : 'transparent',
                color: activeTab === tab ? 'var(--primary-gold)' : 'var(--muted)',
                border: 'none',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
              }}
            >
              {tab === 'users' && <span>👥</span>}
              {tab === 'profile' && <span>👤</span>}
              {tab === 'security' && <span>🔒</span>}
              {tab === 'billing' && <span>💳</span>}
              {tab === 'notifications' && <span>🔔</span>}
              {tab}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div style={{
          flex: 1,
          background: 'var(--card-bg)',
          backdropFilter: 'blur(10px)',
          borderRadius: '2rem',
          padding: '2.5rem',
          border: '1px solid var(--card-border)',
          minHeight: '600px'
        }}>
          {activeTab === 'profile' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem', marginBottom: '2rem' }}>Profile Information</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                  border: '4px solid rgba(142,201,63,0.3)'
                }}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '2rem' }}>
                      {user?.displayName?.[0] ?? 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <button style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.5rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Change Photo
                  </button>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>JPG, GIF or PNG. Max size of 2MB</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Display Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.displayName ?? ''}
                    style={{
                      width: '100%',
                      background: 'var(--background)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem 1rem',
                      color: 'var(--foreground)',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
                  <input 
                    type="email" 
                    disabled
                    defaultValue={user?.email ?? ''}
                    style={{
                      width: '100%',
                      background: 'var(--background)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '0.75rem',
                      padding: '0.75rem 1rem',
                      color: 'var(--muted)',
                      cursor: 'not-allowed',
                      opacity: 0.6
                    }}
                  />
                </div>
              </div>
              
              <button style={{
                marginTop: '3rem',
                background: 'var(--primary-green)',
                color: 'white',
                padding: '0.8rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--foreground)', fontSize: '1.5rem' }}>System Users</h2>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'var(--background)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '2rem',
                      padding: '0.6rem 1.2rem 0.6rem 2.5rem',
                      color: 'var(--foreground)',
                      outline: 'none',
                      width: '250px'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                </div>
              </div>

              {loadingUsers ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                  <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8ec93f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--muted)', fontWeight: '500', fontSize: '0.9rem' }}>User</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--muted)', fontWeight: '500', fontSize: '0.9rem' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--muted)', fontWeight: '500', fontSize: '0.9rem' }}>Role</th>
                        <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--muted)', fontWeight: '500', fontSize: '0.9rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }} className="user-row">
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                                {u.photoURL ? <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>{u.displayName?.[0] || 'U'}</div>}
                              </div>
                              <span style={{ color: 'var(--foreground)', fontWeight: '500' }}>{u.displayName || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{u.email}</td>
                          <td style={{ padding: '1rem' }}>
                            <select 
                              value={u.role || 'guest'}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={updatingRole === u.id || (user?.role !== 'super admin' && u.id === user?.uid)}
                              style={{
                                background: 'var(--background)',
                                border: '1px solid var(--card-border)',
                                borderRadius: '0.5rem',
                                padding: '0.4rem 0.8rem',
                                color: 'var(--foreground)',
                                outline: 'none',
                                cursor: (updatingRole === u.id || (user?.role !== 'super admin' && u.id === user?.uid)) ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              <option value="guest" style={{ color: 'black' }}>Guest</option>
                              <option value="unit owner" style={{ color: 'black' }}>Unit Owner</option>
                              <option value="admin" style={{ color: 'black' }}>Admin</option>
                              <option value="super admin" style={{ color: 'black' }}>Super Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {updatingRole === u.id ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--primary-gold)' }}>Saving...</span>
                            ) : (
                              <button 
                                disabled={u.id === user?.uid}
                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: u.id === user?.uid ? 'not-allowed' : 'pointer', opacity: u.id === user?.uid ? 0.3 : 1, fontSize: '0.85rem' }}
                                onClick={() => alert("Delete functionality would go here.")}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'users' && (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(255,255,255,0.2)' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1.5rem' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '500' }}>Feature Coming Soon</h3>
              <p style={{ marginTop: '0.5rem' }}>We're working hard to bring this to you.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .user-row:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
