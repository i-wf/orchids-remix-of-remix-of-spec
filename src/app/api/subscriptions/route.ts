import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, users, lessonFolders } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_SUBSCRIPTION_TYPES = ['free_trial', 'premium', 'premium_plus', 'owner_granted'];
const VALID_PAYMENT_METHODS = ['vodafone_cash', 'fawry', 'instapay', 'owner_granted'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single subscription by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, parseInt(id)))
        .limit(1);

      if (subscription.length === 0) {
        return NextResponse.json(
          { error: 'Subscription not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(subscription[0], { status: 200 });
    }

    // List subscriptions with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const folderId = searchParams.get('folderId');
    const subscriptionType = searchParams.get('subscriptionType');
    const isActive = searchParams.get('isActive');

    let query = db.select().from(subscriptions);

    const conditions = [];

    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(subscriptions.studentId, parseInt(studentId)));
    }

    if (folderId) {
      if (isNaN(parseInt(folderId))) {
        return NextResponse.json(
          { error: 'Valid folderId is required', code: 'INVALID_FOLDER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(subscriptions.folderId, parseInt(folderId)));
    }

    if (subscriptionType) {
      if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
        return NextResponse.json(
          { error: 'Invalid subscription type', code: 'INVALID_SUBSCRIPTION_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(subscriptions.subscriptionType, subscriptionType));
    }

    if (isActive !== null && isActive !== undefined) {
      const isActiveBool = isActive === 'true';
      conditions.push(eq(subscriptions.isActive, isActiveBool));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      folderId,
      subscriptionType,
      startDate,
      endDate,
      paymentMethod,
      paymentScreenshotUrl,
      monthlyPrice,
      grantedByOwnerId,
      isActive,
    } = body;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required', code: 'MISSING_STUDENT_ID' },
        { status: 400 }
      );
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required', code: 'MISSING_FOLDER_ID' },
        { status: 400 }
      );
    }

    if (!subscriptionType) {
      return NextResponse.json(
        { error: 'subscriptionType is required', code: 'MISSING_SUBSCRIPTION_TYPE' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required', code: 'MISSING_START_DATE' },
        { status: 400 }
      );
    }

    if (!endDate) {
      return NextResponse.json(
        { error: 'endDate is required', code: 'MISSING_END_DATE' },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      return NextResponse.json(
        {
          error: `Invalid subscription type. Must be one of: ${VALID_SUBSCRIPTION_TYPES.join(', ')}`,
          code: 'INVALID_SUBSCRIPTION_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        {
          error: `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
          code: 'INVALID_PAYMENT_METHOD',
        },
        { status: 400 }
      );
    }

    // Validate studentId exists and is a student
    const student = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(studentId)))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json(
        { error: 'Student not found', code: 'STUDENT_NOT_FOUND' },
        { status: 400 }
      );
    }

    if (student[0].role !== 'student') {
      return NextResponse.json(
        { error: 'User is not a student', code: 'NOT_A_STUDENT' },
        { status: 400 }
      );
    }

    // Validate folderId exists
    const folder = await db
      .select()
      .from(lessonFolders)
      .where(eq(lessonFolders.id, parseInt(folderId)))
      .limit(1);

    if (folder.length === 0) {
      return NextResponse.json(
        { error: 'Lesson folder not found', code: 'FOLDER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate grantedByOwnerId if provided
    if (grantedByOwnerId) {
      const owner = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(grantedByOwnerId)))
        .limit(1);

      if (owner.length === 0) {
        return NextResponse.json(
          { error: 'Owner not found', code: 'OWNER_NOT_FOUND' },
          { status: 400 }
        );
      }

      if (owner[0].role !== 'owner') {
        return NextResponse.json(
          { error: 'User is not an owner', code: 'NOT_AN_OWNER' },
          { status: 400 }
        );
      }
    }

    // Create subscription
    const newSubscription = await db
      .insert(subscriptions)
      .values({
        studentId: parseInt(studentId),
        folderId: parseInt(folderId),
        subscriptionType,
        startDate,
        endDate,
        isActive: isActive !== undefined ? isActive : true,
        paymentMethod: paymentMethod || null,
        paymentScreenshotUrl: paymentScreenshotUrl || null,
        monthlyPrice: monthlyPrice ? parseInt(monthlyPrice) : null,
        grantedByOwnerId: grantedByOwnerId ? parseInt(grantedByOwnerId) : null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newSubscription[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      subscriptionType,
      startDate,
      endDate,
      isActive,
      paymentMethod,
      paymentScreenshotUrl,
      monthlyPrice,
    } = body;

    // Check if subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate subscription type if provided
    if (subscriptionType && !VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      return NextResponse.json(
        {
          error: `Invalid subscription type. Must be one of: ${VALID_SUBSCRIPTION_TYPES.join(', ')}`,
          code: 'INVALID_SUBSCRIPTION_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        {
          error: `Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
          code: 'INVALID_PAYMENT_METHOD',
        },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (subscriptionType !== undefined) updates.subscriptionType = subscriptionType;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (isActive !== undefined) updates.isActive = isActive;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (paymentScreenshotUrl !== undefined) updates.paymentScreenshotUrl = paymentScreenshotUrl;
    if (monthlyPrice !== undefined) updates.monthlyPrice = monthlyPrice ? parseInt(monthlyPrice) : null;

    // Update subscription
    const updated = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete subscription
    const deleted = await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Subscription deleted successfully',
        subscription: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}