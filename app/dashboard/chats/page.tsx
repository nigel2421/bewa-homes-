'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: any;
  unitName?: string;
  otherParticipantName?: string;
}

export default function ChatsPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch chats where user is a participant
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
      const chatData = await Promise.all(snap.docs.map(async (chatDoc) => {
        const data = chatDoc.data() as Chat;
        const otherId = data.participants.find(p => p !== user.uid);
        
        // Fetch other participant name (simplification for this example)
        let otherName = 'User';
        if (otherId) {
          const userSnap = await getDoc(doc(db, 'users', otherId));
          if (userSnap.exists()) {
            otherName = userSnap.data().displayName || 'User';
          }
        }

        return { ...data, id: chatDoc.id, otherParticipantName: otherName };
      }));
      
      setChats(chatData);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading conversations...</div>;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1rem' }}>
      {/* Sidebar: Chat List */}
      <div className="glass-card" style={{ background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--title-color)', fontWeight: 600 }}>Conversations</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length > 0 ? chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat.id)}
              style={{ 
                padding: '1.25rem', borderBottom: '1px solid var(--card-border)', 
                cursor: 'pointer', transition: 'background 0.2s',
                background: selectedChat === chat.id ? 'var(--background)' : 'transparent',
                display: 'flex', gap: '1rem', alignItems: 'center'
              }}
              onMouseEnter={e => !selectedChat && (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
              onMouseLeave={e => !selectedChat && (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                {chat.otherParticipantName?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--title-color)' }}>{chat.otherParticipantName}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.lastMessage || 'Start a conversation'}</p>
              </div>
            </div>
          )) : (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>No messages yet.</p>
          )}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="glass-card" style={{ background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
        {selectedChat ? (
          <ChatInterface chatId={selectedChat} />
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <p style={{ fontSize: '4rem' }}>💬</p>
            <p style={{ fontWeight: 600 }}>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
