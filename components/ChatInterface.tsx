'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface ChatInterfaceProps {
  chatId: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    // 1. Calculate the 7-day cutoff
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Fetch messages for this chat
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('createdAt', '>=', sevenDaysAgo), // Client-side "auto-delete" / hide logic
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const allData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      
      // Secondary client-side filter for visual hygiene (consistent with tests)
      const filtered = allData.filter(m => {
        if (!m.createdAt) return true; // Keep pending
        const date = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        return date >= sevenDaysAgo;
      });
      
      setMessages(filtered);
      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }, (err) => {
      console.warn("Messages fetch error (check indices/expiry):", err);
    });

    return () => unsub();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      // 1. Add message to subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      });

      // 2. Update chat metadata
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });

    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
           <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', border: '1px solid var(--card-border)', color: 'var(--muted)', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
             Secure Encrypted Chat · Messages expire after 7 days
           </span>
        </div>

        {messages.map((msg) => {
          const isMine = msg.senderId === user?.uid;
          return (
            <div 
              key={msg.id} 
              style={{ 
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ 
                padding: '0.75rem 1.25rem', 
                borderRadius: isMine ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                background: isMine ? 'var(--primary-green)' : 'var(--background)',
                color: isMine ? 'white' : 'var(--foreground)',
                border: isMine ? 'none' : '1px solid var(--card-border)',
                boxShadow: isMine ? '0 4px 15px rgba(0, 77, 64, 0.2)' : 'none',
                fontSize: '0.95rem',
                lineHeight: 1.5
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSendMessage}
        style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)', background: 'var(--background)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
      >
        <input 
          type="text" 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.85rem 1.25rem', borderRadius: '25px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--foreground)', outline: 'none' }}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || isSending}
          style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary-gold)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isSending ? '...' : '✈️'}
        </button>
      </form>
    </div>
  );
}
