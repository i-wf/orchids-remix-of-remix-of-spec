import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { websiteReviews } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allReviews = await db.select().from(websiteReviews).orderBy(websiteReviews.createdAt);
    return NextResponse.json(allReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب التقييمات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, rating, reviewText, studentName, studentGrade } = body;

    if (!userId || !rating || !studentName || !studentGrade) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'التقييم يجب أن يكون بين 1 و 5' },
        { status: 400 }
      );
    }

    const existingReview = await db
      .select()
      .from(websiteReviews)
      .where(eq(websiteReviews.userId, userId))
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { error: 'لقد قمت بالتقييم من قبل' },
        { status: 400 }
      );
    }

    const [newReview] = await db
      .insert(websiteReviews)
      .values({
        userId,
        rating,
        reviewText: reviewText || null,
        studentName,
        studentGrade,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'حدث خطأ في حفظ التقييم' }, { status: 500 });
  }
}
