import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentRequests, users, lessonFolders } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_SUBSCRIPTION_TYPES = ['premium', 'premium_plus'];
const VALID_PAYMENT_METHODS = ['vodafone_cash', 'fawry', 'instapay'];
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const paymentRequest = await db
        .select()
        .from(paymentRequests)
        .where(eq(paymentRequests.id, parseInt(id)))
        .limit(1);

      if (paymentRequest.length === 0) {
        return NextResponse.json(
          { error: 'Payment request not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(paymentRequest[0], { status: 200 });
    }

    // List with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const studentId = searchParams.get('studentId');
    const folderId = searchParams.get('folderId');
    const status = searchParams.get('status');
    const subscriptionType = searchParams.get('subscriptionType');

    let query = db.select().from(paymentRequests);

    // Build filter conditions
    const conditions = [];

    if (studentId) {
      if (isNaN(parseInt(studentId))) {
        return NextResponse.json(
          { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(paymentRequests.studentId, parseInt(studentId)));
    }

    if (folderId) {
      if (isNaN(parseInt(folderId))) {
        return NextResponse.json(
          { error: 'Valid folderId is required', code: 'INVALID_FOLDER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(paymentRequests.folderId, parseInt(folderId)));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(paymentRequests.status, status));
    }

    if (subscriptionType) {
      if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
        return NextResponse.json(
          {
            error: `Subscription type must be one of: ${VALID_SUBSCRIPTION_TYPES.join(', ')}`,
            code: 'INVALID_SUBSCRIPTION_TYPE',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(paymentRequests.subscriptionType, subscriptionType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(paymentRequests.createdAt))
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
      paymentMethod,
      amount,
      screenshotUrl,
      ownerNote,
      status,
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

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'paymentMethod is required', code: 'MISSING_PAYMENT_METHOD' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (!screenshotUrl) {
      return NextResponse.json(
        { error: 'screenshotUrl is required', code: 'MISSING_SCREENSHOT_URL' },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
      return NextResponse.json(
        {
          error: `Subscription type must be one of: ${VALID_SUBSCRIPTION_TYPES.join(', ')}`,
          code: 'INVALID_SUBSCRIPTION_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        {
          error: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
          code: 'INVALID_PAYMENT_METHOD',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    const requestStatus = status || 'pending';
    if (!VALID_STATUSES.includes(requestStatus)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate amount is positive integer
    if (isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive integer', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Validate studentId is valid integer
    if (isNaN(parseInt(studentId))) {
      return NextResponse.json(
        { error: 'Valid studentId is required', code: 'INVALID_STUDENT_ID' },
        { status: 400 }
      );
    }

    // Validate folderId is valid integer
    if (isNaN(parseInt(folderId))) {
      return NextResponse.json(
        { error: 'Valid folderId is required', code: 'INVALID_FOLDER_ID' },
        { status: 400 }
      );
    }

    // Check if student exists and is a student
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
        { error: 'User must be a student', code: 'INVALID_USER_ROLE' },
        { status: 400 }
      );
    }

    // Check if folder exists
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

    const now = new Date().toISOString();

    const newPaymentRequest = await db
      .insert(paymentRequests)
      .values({
        studentId: parseInt(studentId),
        folderId: parseInt(folderId),
        subscriptionType: subscriptionType.trim(),
        paymentMethod: paymentMethod.trim(),
        amount: parseInt(amount),
        screenshotUrl: screenshotUrl.trim(),
        status: requestStatus,
        ownerNote: ownerNote ? ownerNote.trim() : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newPaymentRequest[0], { status: 201 });
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
      status,
      ownerNote,
      subscriptionType,
      paymentMethod,
      amount,
      screenshotUrl,
    } = body;

    // Check if payment request exists
    const existing = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add optional fields
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (ownerNote !== undefined) {
      updates.ownerNote = ownerNote ? ownerNote.trim() : null;
    }

    if (subscriptionType !== undefined) {
      if (!VALID_SUBSCRIPTION_TYPES.includes(subscriptionType)) {
        return NextResponse.json(
          {
            error: `Subscription type must be one of: ${VALID_SUBSCRIPTION_TYPES.join(', ')}`,
            code: 'INVALID_SUBSCRIPTION_TYPE',
          },
          { status: 400 }
        );
      }
      updates.subscriptionType = subscriptionType.trim();
    }

    if (paymentMethod !== undefined) {
      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return NextResponse.json(
          {
            error: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
            code: 'INVALID_PAYMENT_METHOD',
          },
          { status: 400 }
        );
      }
      updates.paymentMethod = paymentMethod.trim();
    }

    if (amount !== undefined) {
      if (isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive integer', code: 'INVALID_AMOUNT' },
          { status: 400 }
        );
      }
      updates.amount = parseInt(amount);
    }

    if (screenshotUrl !== undefined) {
      if (!screenshotUrl || screenshotUrl.trim() === '') {
        return NextResponse.json(
          { error: 'screenshotUrl cannot be empty', code: 'INVALID_SCREENSHOT_URL' },
          { status: 400 }
        );
      }
      updates.screenshotUrl = screenshotUrl.trim();
    }

    const updated = await db
      .update(paymentRequests)
      .set(updates)
      .where(eq(paymentRequests.id, parseInt(id)))
      .returning();

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

    // Check if payment request exists
    const existing = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(paymentRequests)
      .where(eq(paymentRequests.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Payment request deleted successfully',
        paymentRequest: deleted[0],
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