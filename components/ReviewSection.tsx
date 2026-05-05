'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface CategoryRatings {
  [key: string]: number;
}

interface Review {
  id: string;
  userName: string;
  rating: number; // Overall rating (1-5)
  ratings?: CategoryRatings; // Detailed categories
  recommend?: boolean; // Thumbs up/down
  comment: string;
  createdAt: Timestamp;
  userId: string;
  targetId: string;
  targetType: 'unit' | 'tenant';
}

interface ReviewSectionProps {
  targetId?: string;
  targetType?: 'unit' | 'tenant';
  unitId?: string;
  title?: string;
}

const UNIT_CATEGORIES = ['Cleanliness', 'Accuracy', 'Communication', 'Location', 'Value'];
const TENANT_CATEGORIES = ['Professionalism', 'Reliability', 'Ethics', 'Quality'];

const UNIT_QUESTIONS: { [key: string]: string } = {
  'Cleanliness': 'How was the cleanliness of the unit?',
  'Accuracy': 'Was the unit as described in the listing?',
  'Communication': 'How was the host\'s communication?',
  'Location': 'Did you find the location convenient?',
  'Value': 'Was the stay worth the price?',
};

const TENANT_QUESTIONS: { [key: string]: string } = {
  'Professionalism': 'How professional was the interaction?',
  'Reliability': 'Was the individual reliable?',
  'Ethics': 'Did they demonstrate high ethical standards?',
  'Quality': 'How would you rate the overall quality?',
};

export default function ReviewSection({ targetId, targetType = 'unit', unitId, title }: ReviewSectionProps) {
  const finalId = targetId || unitId;
  if (!finalId) return null;

  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>({});
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  const categories = targetType === 'unit' ? UNIT_CATEGORIES : TENANT_CATEGORIES;
  const questions = targetType === 'unit' ? UNIT_QUESTIONS : TENANT_QUESTIONS;

  useEffect(() => {
    // 1. Fetch Reviews
    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', finalId),
      where('targetType', '==', targetType),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      setReviews(data);
      setLoading(false);
    });

    // 2. Check if user can review
    const checkEligibility = async () => {
      if (!user) return;

      // Admin can always review anything (especially tenants)
      if (user.role === 'admin') {
        setCanReview(true);
        return;
      }

      // Tenants (Hosts) cannot review themselves or their units
      if (user.role === 'host') {
        setCanReview(false);
        return;
      }

      // For Guests:
      if (targetType === 'unit') {
        // Must have a completed booking for this unit
        const qBookings = query(
          collection(db, 'bookings'),
          where('email', '==', user.email),
          where('unitId', '==', finalId),
          where('status', '==', 'Completed') 
        );
        const snap = await getDocs(qBookings);
        if (!snap.empty) setCanReview(true);
      } else {
        // Business Profile reviews are ADMIN ONLY for now as per requirements
        setCanReview(false);
      }
    };

    checkEligibility();

    return () => unsub();
  }, [finalId, targetType, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (recommend === null) {
      alert("Please give a thumbs up or down!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        targetId: finalId,
        targetType,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating, // Base rating
        ratings: categoryRatings, // Detailed categories (optional)
        recommend, // Thumbs up/down
        comment,
        createdAt: serverTimestamp()
      });
      
      // Reset form
      setComment('');
      setRating(5);
      setCategoryRatings({});
      setRecommend(null);
      setShowDetailed(false);
      alert("Thank you for your feedback!");
    } catch (err) {
      console.error(err);
      alert("Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const thumbsUpCount = reviews.filter(r => r.recommend).length;
  const thumbsDownCount = reviews.filter(r => r.recommend === false).length;
  const totalThumbs = thumbsUpCount + thumbsDownCount;
  const satisfactionRate = totalThumbs > 0 ? Math.round((thumbsUpCount / totalThumbs) * 100) : 0;

  const getCategoryAvg = (cat: string) => {
    const ratedReviews = reviews.filter(r => r.ratings && r.ratings[cat]);
    if (ratedReviews.length === 0) return 0;
    return (ratedReviews.reduce((acc, r) => acc + (r.ratings![cat] || 0), 0) / ratedReviews.length).toFixed(1);
  };

  return (
    <div style={{ marginTop: '4rem', padding: '2.5rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--title-color)', fontFamily: 'var(--font-playfair)', marginBottom: '0.75rem' }}>
            {title || (targetType === 'unit' ? 'Guest Experience' : 'Business Integrity')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            {reviews.length} total reviews. Verified feedback from our community.
          </p>
          
          {/* Satisfaction Bar */}
          <div style={{ marginTop: '1.5rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <span>Community Satisfaction</span>
                <span style={{ color: satisfactionRate >= 80 ? '#10b981' : 'var(--primary-gold)' }}>{satisfactionRate}% Thumbs Up</span>
             </div>
             <div style={{ height: '8px', background: 'var(--background)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                <div style={{ height: '100%', width: `${satisfactionRate}%`, background: 'linear-gradient(90deg, var(--primary-gold), #ffd700)', borderRadius: '4px' }} />
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', background: 'var(--background)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--card-border)', paddingRight: '2rem' }}>
             <p style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--primary-gold)', margin: 0, lineHeight: 1 }}>{avgRating}</p>
             <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '0.5rem' }}>
               {[1,2,3,4,5].map(s => (
                 <span key={s} style={{ color: Number(avgRating) >= s ? 'var(--primary-gold)' : 'var(--card-border)', fontSize: '1.2rem' }}>★</span>
               ))}
             </div>
          </div>
          <div style={{ textAlign: 'center' }}>
             <p style={{ fontSize: '2.8rem', fontWeight: 800, color: satisfactionRate >= 80 ? '#10b981' : 'var(--title-color)', margin: 0, lineHeight: 1 }}>
                {satisfactionRate}%
             </p>
             <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Positive Rate</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown (Grid) */}
      {reviews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
          {categories.map(cat => {
            const val = Number(getCategoryAvg(cat));
            return (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{cat}</span>
                  <span style={{ fontWeight: 700 }}>{val > 0 ? val : '-'}</span>
                </div>
                <div style={{ height: '4px', background: 'var(--background)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${(val/5)*100}%`, background: 'var(--primary-gold)', borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Form */}
      {canReview && (
        <section style={{ marginBottom: '4rem', padding: '2rem', background: 'var(--background)', borderRadius: '24px', border: '1px solid var(--primary-gold)', boxShadow: '0 0 20px rgba(184, 150, 87, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--title-color)', margin: 0 }}>Share your experience</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button 
                type="button"
                onClick={() => setRecommend(true)}
                style={{ 
                  padding: '0.6rem 1.2rem', borderRadius: '30px', border: '1px solid var(--card-border)', 
                  background: recommend === true ? '#10b981' : 'transparent',
                  color: recommend === true ? 'white' : 'var(--foreground)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}
               >
                 👍 Thumbs Up
               </button>
               <button 
                type="button"
                onClick={() => setRecommend(false)}
                style={{ 
                  padding: '0.6rem 1.2rem', borderRadius: '30px', border: '1px solid var(--card-border)', 
                  background: recommend === false ? '#ef4444' : 'transparent',
                  color: recommend === false ? 'white' : 'var(--foreground)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}
               >
                 👎 Thumbs Down
               </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Overall Rating:</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1,2,3,4,5].map(s => (
                      <button 
                        key={s} 
                        type="button" 
                        onClick={() => setRating(s)}
                        style={{ 
                          background: 'none', border: 'none', fontSize: '1.8rem', 
                          color: rating >= s ? 'var(--primary-gold)' : 'var(--card-border)', 
                          cursor: 'pointer', padding: 0 
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
               </div>
               
               <button 
                 type="button"
                 onClick={() => setShowDetailed(!showDetailed)}
                 style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'underline' }}
               >
                 {showDetailed ? 'Hide Detailed Ratings' : 'Add Detailed Ratings (Optional)'}
               </button>
            </div>

            {showDetailed && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid var(--card-border)' }}>
                {categories.map(cat => (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--title-color)', fontWeight: 600 }}>{questions[cat] || cat}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1,2,3,4,5].map(s => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => setCategoryRatings(prev => ({ ...prev, [cat]: s }))}
                          style={{ 
                            background: 'none', border: 'none', fontSize: '1.8rem', 
                            color: (categoryRatings[cat] || 0) >= s ? 'var(--primary-gold)' : 'var(--card-border)', 
                            cursor: 'pointer', padding: 0,
                            transition: 'transform 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <textarea 
              required
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={targetType === 'unit' ? "Share details about your stay..." : "Provide an honest assessment of this business profile..."}
              style={{ width: '100%', padding: '1.2rem', borderRadius: '15px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', minHeight: '120px', resize: 'vertical', outline: 'none', fontSize: '1rem', lineHeight: 1.6 }}
            />
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="premium-button" 
              style={{ alignSelf: 'flex-start', padding: '1rem 3rem', fontSize: '1rem' }}
            >
              {isSubmitting ? 'Publishing Feedback...' : 'Publish Review'}
            </button>
          </form>
        </section>
      )}

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Latest Reviews</h3>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '100px', background: 'var(--background)', borderRadius: '15px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} style={{ padding: '2rem', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--card-border)', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'linear-gradient(135deg, var(--primary-gold), #ffd700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: '1.2rem' }}>
                     {review.userName[0].toUpperCase()}
                   </div>
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--title-color)', fontSize: '1.1rem' }}>{review.userName}</p>
                        {review.recommend !== undefined && (
                          <span style={{ fontSize: '1.2rem' }}>{review.recommend ? '👍' : '👎'}</span>
                        )}
                     </div>
                     <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                       {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Verified Stay'}
                     </p>
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <div style={{ color: 'var(--primary-gold)', fontSize: '1.1rem' }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                  </div>
                  {review.ratings && Object.keys(review.ratings).length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--card-bg)', padding: '2px 8px', borderRadius: '10px' }}>Detailed Ratings Included</span>
                  )}
                </div>
              </div>
              
              <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--foreground)', fontSize: '1rem', fontStyle: 'italic' }}>
                "{review.comment}"
              </p>

              {/* Show categories if they exist for this specific review */}
              {review.ratings && Object.keys(review.ratings).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
                   {Object.entries(review.ratings).map(([cat, val]) => (
                     <div key={cat} style={{ fontSize: '0.75rem', background: 'var(--background)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--card-border)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--muted)' }}>{cat}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-gold)' }}>{val}★</span>
                     </div>
                   ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.5, background: 'var(--background)', borderRadius: '20px', border: '1px dashed var(--card-border)' }}>
            <p style={{ fontSize: '1.1rem' }}>No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
