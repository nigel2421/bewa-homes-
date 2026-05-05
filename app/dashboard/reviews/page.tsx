'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Review {
  id: string;
  targetId: string;
  targetType: string;
  rating: number;
  comment: string;
  userName: string;
  userImage: string;
  createdAt: any;
  categoryRatings?: { [key: string]: number };
  isRecommended?: boolean;
}

interface Unit {
  id: string;
  name: string;
  ownerId?: string;
}

interface Tenant {
  id: string;
  name: string;
  logo?: string;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<{ [key: string]: Tenant }>({});
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState('all');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      let unitsList: Unit[] = [];
      
      try {
        // 1. Fetch units
        if (isAdmin) {
          const unitsSnap = await getDocs(collection(db, 'units'));
          unitsList = unitsSnap.docs.map(doc => ({ 
            id: doc.id, 
            name: doc.data().name,
            ownerId: doc.data().ownerId
          }));

          // 2. Fetch all tenants for admin mapping
          const tenantsSnap = await getDocs(collection(db, 'tenants'));
          const tenantsMap: { [key: string]: Tenant } = {};
          tenantsSnap.docs.forEach(doc => {
            tenantsMap[doc.id] = { id: doc.id, ...doc.data() } as Tenant;
          });
          setTenants(tenantsMap);
        } else {
          const unitsQ = query(collection(db, 'units'), where('ownerId', '==', user.uid));
          const unitsSnap = await getDocs(unitsQ);
          unitsList = unitsSnap.docs.map(doc => ({ 
            id: doc.id, 
            name: doc.data().name,
            ownerId: doc.data().ownerId
          }));
        }
        setUnits(unitsList);

        if (unitsList.length === 0 && !isAdmin) {
          setLoading(false);
          return;
        }

        // 3. Listen to reviews
        const reviewsQ = query(
          collection(db, 'reviews'),
          where('targetType', '==', 'unit'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(reviewsQ, (snapshot) => {
          const allReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
          
          if (isAdmin) {
            setReviews(allReviews);
          } else {
            const unitIds = unitsList.map(u => u.id);
            const filteredReviews = allReviews.filter(r => unitIds.includes(r.targetId));
            setReviews(filteredReviews);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    const unsubPromise = fetchAllData();
    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, [user, isAdmin]);

  // Filtering logic
  const filteredReviews = reviews.filter(review => {
    const matchesUnit = selectedUnit === 'all' || review.targetId === selectedUnit;
    
    let matchesTenant = true;
    if (isAdmin && selectedTenant !== 'all') {
      const unit = units.find(u => u.id === review.targetId);
      matchesTenant = unit?.ownerId === selectedTenant;
    }
    
    return matchesUnit && matchesTenant;
  });

  const averageRating = filteredReviews.length > 0
    ? filteredReviews.reduce((acc, curr) => acc + curr.rating, 0) / filteredReviews.length
    : 0;

  const totalRecommended = filteredReviews.filter(r => r.isRecommended === true).length;
  const totalNotRecommended = filteredReviews.filter(r => r.isRecommended === false).length;
  const satisfactionRate = filteredReviews.length > 0
    ? (totalRecommended / filteredReviews.length) * 100
    : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loader" style={{ border: '3px solid var(--card-border)', borderTop: '3px solid var(--primary-gold)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--title-color)', marginBottom: '0.4rem', fontFamily: 'var(--font-playfair)' }}>Guest Reviews</h1>
          <p style={{ color: 'var(--muted)' }}>
            {isAdmin ? "Monitoring feedback across all business profiles and units." : "Monitor feedback and improve your guest experience."}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Business Profile</span>
              <select 
                value={selectedTenant} 
                onChange={(e) => {
                  setSelectedTenant(e.target.value);
                  setSelectedUnit('all'); // Reset unit filter when tenant changes
                }}
                style={{ 
                  padding: '0.7rem 1.2rem', borderRadius: '10px', 
                  border: '1px solid var(--card-border)', background: 'var(--card-bg)', 
                  color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none',
                  cursor: 'pointer', boxShadow: 'var(--shadow-sm)', minWidth: '180px'
                }}
              >
                <option value="all">All Businesses</option>
                {Object.values(tenants).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Unit</span>
            <select 
              value={selectedUnit} 
              onChange={(e) => setSelectedUnit(e.target.value)}
              style={{ 
                padding: '0.7rem 1.2rem', borderRadius: '10px', 
                border: '1px solid var(--card-border)', background: 'var(--card-bg)', 
                color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)', minWidth: '180px'
              }}
            >
              <option value="all">All Units</option>
              {units
                .filter(u => selectedTenant === 'all' || u.ownerId === selectedTenant)
                .map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))
              }
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card stats-card" style={{ padding: '2rem', transition: 'transform 0.3s' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Feedback</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--title-color)' }}>{filteredReviews.length}</h3>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Reviews</span>
          </div>
        </div>
        <div className="glass-card stats-card" style={{ padding: '2rem', transition: 'transform 0.3s' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Average Rating</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-gold)' }}>{averageRating.toFixed(1)}</h3>
            <span style={{ color: 'var(--primary-gold)', fontSize: '1.5rem' }}>★</span>
          </div>
        </div>
        <div className="glass-card stats-card" style={{ padding: '2rem', transition: 'transform 0.3s' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Satisfaction Rate</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{satisfactionRate.toFixed(0)}%</h3>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.2rem' }}>
                <span title="Recommended">👍</span>
                <span title="Not Recommended" style={{ opacity: totalNotRecommended > 0 ? 1 : 0.3 }}>👎</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              <span>{totalRecommended} Yes</span>
              <span>•</span>
              <span>{totalNotRecommended} No</span>
            </div>
          </div>
        </div>
        <div className="glass-card stats-card" style={{ padding: '2rem', transition: 'transform 0.3s' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Guest Sentiment</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: averageRating >= 4 ? '#10b981' : (averageRating >= 3 ? '#f59e0b' : '#ef4444') }}>
              {filteredReviews.length === 0 ? 'N/A' : (averageRating >= 4.5 ? 'Excellent' : averageRating >= 4 ? 'Great' : averageRating >= 3 ? 'Good' : 'Needs Work')}
            </h3>
            <span style={{ fontSize: '1.5rem' }}>
              {averageRating >= 4.5 ? '🏆' : averageRating >= 4 ? '✨' : averageRating >= 3 ? '🙂' : '📈'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {filteredReviews.map(review => {
          const unit = units.find(u => u.id === review.targetId);
          const tenant = unit?.ownerId ? tenants[unit.ownerId] : null;

          return (
            <div key={review.id} className="glass-card review-card" style={{ 
              padding: '2.5rem', 
              transition: 'all 0.3s ease',
              animation: 'fadeIn 0.5s ease forwards'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary-green), var(--primary-gold))', 
                    padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--card-bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {review.userImage ? <img src={review.userImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.8rem' }}>👤</span>}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--title-color)' }}>{review.userName}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                      <span style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>{unit?.name || 'Unit'}</span>
                      {isAdmin && tenant && (
                        <span> • Business: <span style={{ color: 'var(--primary-green)', fontWeight: 600 }}>{tenant.name}</span></span>
                      )}
                      {" • "}
                      {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: '1.4rem', color: s <= review.rating ? 'var(--primary-gold)' : 'var(--card-border)' }}>★</span>
                    ))}
                  </div>
                  {review.isRecommended !== undefined && (
                    <div style={{ 
                      padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 800,
                      background: review.isRecommended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: review.isRecommended ? '#10b981' : '#ef4444',
                      border: `1px solid ${review.isRecommended ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <span style={{ fontSize: '1rem' }}>{review.isRecommended ? '👍' : '👎'}</span>
                      {review.isRecommended ? 'Highly Recommended' : 'Not Recommended'}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <span style={{ position: 'absolute', top: '-10px', left: '-15px', fontSize: '3rem', color: 'var(--primary-gold)', opacity: 0.2, fontFamily: 'serif' }}>"</span>
                <p style={{ lineHeight: 1.8, color: 'var(--foreground)', fontSize: '1.05rem', fontStyle: 'italic' }}>{review.comment}</p>
              </div>
              
              {review.categoryRatings && (
                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)',
                  background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '12px'
                }}>
                  {Object.entries(review.categoryRatings).map(([cat, score]) => (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{cat.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--title-color)' }}>{score}/5</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--card-border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${(score/5)*100}%`, 
                          height: '100%', 
                          background: score >= 4 ? 'var(--primary-gold)' : (score >= 3 ? '#f59e0b' : '#ef4444'), 
                          borderRadius: '2px',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '2rem', filter: 'grayscale(1)', opacity: 0.5 }}>💬</div>
            <h3 style={{ fontSize: '1.8rem', color: 'var(--title-color)', marginBottom: '0.8rem', fontFamily: 'var(--font-playfair)' }}>No guest reviews found</h3>
            <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>Try adjusting your filters or wait for more guest feedback.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .stats-card:hover { transform: translateY(-8px); }
        .review-card:hover { border-color: var(--primary-gold); transform: scale(1.01); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
