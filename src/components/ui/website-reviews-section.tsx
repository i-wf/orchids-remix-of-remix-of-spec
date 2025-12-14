"use client";

import { useEffect, useState } from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Star, Quote } from 'lucide-react';

interface Review {
  id: number;
  userId: number;
  rating: number;
  reviewText: string | null;
  studentName: string;
  studentGrade: string;
  createdAt: string;
}

export function WebsiteReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/website-reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);

        if (data.length > 0) {
          const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
          setAverageRating(avg);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || reviews.length === 0) {
    return null;
  }

  const displayedReviews = reviews.slice(0, 6);

  return (
    <div className="w-full flex items-center justify-center bg-[#2d2d30] p-4 sm:p-10 py-16">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            آراء طلابنا
          </h2>
          <p className="text-neutral-400 text-lg mb-4">
            تقييمات حقيقية من طلاب المنصة
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.round(averageRating)
                      ? 'text-[#007acc] fill-[#007acc]'
                      : 'text-neutral-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-white text-xl font-semibold">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-neutral-400">
              ({reviews.length} تقييم)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedReviews.map((review, index) => (
            <SpotlightCard
              key={review.id}
              className={`p-6 h-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-${index * 100}`}
              spotlightColor="rgba(0, 122, 204, 0.15)"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {review.studentName}
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    {review.studentGrade}
                  </p>
                </div>
                <Quote className="w-8 h-8 text-[#007acc]/30" />
              </div>

              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'text-[#007acc] fill-[#007acc]'
                        : 'text-neutral-600'
                    }`}
                  />
                ))}
              </div>

              {review.reviewText && (
                <p className="text-neutral-300 text-sm leading-relaxed flex-1">
                  "{review.reviewText}"
                </p>
              )}

              <div className="text-xs text-neutral-500 pt-2 border-t border-[#3e3e42]">
                {new Date(review.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </div>
  );
}