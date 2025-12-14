"use client";

import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

export function RatingPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const checkAndShowPopup = async () => {
      const lastShown = localStorage.getItem('ratingPopupLastShown');
      const hasRated = localStorage.getItem('hasRatedWebsite');

      if (hasRated) return;

      const now = new Date().getTime();
      const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;

      if (!lastShown) {
        localStorage.setItem('ratingPopupLastShown', now.toString());
        setTimeout(() => setIsOpen(true), 3000);
        return;
      }

      const lastShownTime = parseInt(lastShown);
      if (now - lastShownTime >= fiveDaysInMs) {
        localStorage.setItem('ratingPopupLastShown', now.toString());
        setTimeout(() => setIsOpen(true), 3000);
      }
    };

    checkAndShowPopup();
  }, [user]);

  const handleSubmit = async () => {
    if (rating === 0 || !user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/website-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          rating,
          reviewText,
          studentName: user.name,
          studentGrade: user.grade || 'غير محدد',
        }),
      });

      if (response.ok) {
        localStorage.setItem('hasRatedWebsite', 'true');
        setIsOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || 'حدث خطأ في حفظ التقييم');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('حدث خطأ في حفظ التقييم');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !user || user.role !== 'student') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-br from-[#000] to-[#1A2428] border border-blue-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            قيّم تجربتك معنا
          </h2>
          <p className="text-neutral-400 text-sm">
            رأيك يهمنا! ساعدنا في تحسين خدماتنا
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-neutral-600'
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="اكتب رأيك (اختياري)..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="mb-6 bg-neutral-900/50 border-neutral-700 text-white placeholder:text-neutral-500 min-h-[100px]"
        />

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </Button>
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            ليس الآن
          </Button>
        </div>
      </div>
    </div>
  );
}
