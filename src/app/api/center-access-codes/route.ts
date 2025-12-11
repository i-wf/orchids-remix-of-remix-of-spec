import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { centerAccessCodes, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

      const record = await db
        .select()
        .from(centerAccessCodes)
        .where(eq(centerAccessCodes.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const usedParam = searchParams.get('used');
    const createdByOwnerIdParam = searchParams.get('createdByOwnerId');

    let query = db.select().from(centerAccessCodes);

    const conditions = [];

    // Filter by used status
    if (usedParam !== null) {
      const usedValue = usedParam === 'true';
      conditions.push(eq(centerAccessCodes.used, usedValue));
    }

    // Filter by createdByOwnerId
    if (createdByOwnerIdParam !== null) {
      if (isNaN(parseInt(createdByOwnerIdParam))) {
        return NextResponse.json(
          { error: 'Valid createdByOwnerId is required', code: 'INVALID_OWNER_ID' },
          { status: 400 }
        );
      }

      const ownerId = parseInt(createdByOwnerIdParam);

      // Validate owner exists and has role='owner'
      const owner = await db
        .select()
        .from(users)
        .where(and(eq(users.id, ownerId), eq(users.role, 'owner')))
        .limit(1);

      if (owner.length === 0) {
        return NextResponse.json(
          { error: 'Owner not found or user is not an owner', code: 'INVALID_OWNER' },
          { status: 400 }
        );
      }

      conditions.push(eq(centerAccessCodes.createdByOwnerId, ownerId));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by createdAt desc and apply pagination
    const results = await query
      .orderBy(desc(centerAccessCodes.createdAt))
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
    const { code, centerName, createdByOwnerId } = body;

    // Validate required fields
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { error: 'Code is required and must be a non-empty string', code: 'INVALID_CODE' },
        { status: 400 }
      );
    }

    if (!centerName || typeof centerName !== 'string' || centerName.trim() === '') {
      return NextResponse.json(
        { error: 'Center name is required and must be a non-empty string', code: 'INVALID_CENTER_NAME' },
        { status: 400 }
      );
    }

    if (!createdByOwnerId || isNaN(parseInt(createdByOwnerId))) {
      return NextResponse.json(
        { error: 'Valid createdByOwnerId is required', code: 'INVALID_OWNER_ID' },
        { status: 400 }
      );
    }

    const ownerId = parseInt(createdByOwnerId);

    // Validate createdByOwnerId exists and has role='owner'
    const owner = await db
      .select()
      .from(users)
      .where(and(eq(users.id, ownerId), eq(users.role, 'owner')))
      .limit(1);

    if (owner.length === 0) {
      return NextResponse.json(
        { error: 'Owner not found or user is not an owner', code: 'INVALID_OWNER' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await db
      .select()
      .from(centerAccessCodes)
      .where(eq(centerAccessCodes.code, code.trim()))
      .limit(1);

    if (existingCode.length > 0) {
      return NextResponse.json(
        { error: 'Code already exists', code: 'DUPLICATE_CODE' },
        { status: 400 }
      );
    }

    // Create new center access code
    const newRecord = await db
      .insert(centerAccessCodes)
      .values({
        code: code.trim(),
        centerName: centerName.trim(),
        createdByOwnerId: ownerId,
        used: false,
        usedByUserId: null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
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

    const recordId = parseInt(id);
    const body = await request.json();

    // Check for forbidden fields
    const forbiddenFields = ['code', 'used', 'usedByUserId', 'createdByOwnerId'];
    for (const field of forbiddenFields) {
      if (field in body) {
        return NextResponse.json(
          { error: `Cannot modify ${field} field`, code: 'FORBIDDEN_FIELD' },
          { status: 400 }
        );
      }
    }

    const { centerName } = body;

    // Validate centerName if provided
    if (centerName !== undefined) {
      if (typeof centerName !== 'string' || centerName.trim() === '') {
        return NextResponse.json(
          { error: 'Center name must be a non-empty string', code: 'INVALID_CENTER_NAME' },
          { status: 400 }
        );
      }
    }

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(centerAccessCodes)
      .where(eq(centerAccessCodes.id, recordId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update record
    const updates: { centerName?: string } = {};
    if (centerName !== undefined) {
      updates.centerName = centerName.trim();
    }

    const updated = await db
      .update(centerAccessCodes)
      .set(updates)
      .where(eq(centerAccessCodes.id, recordId))
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

    const recordId = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(centerAccessCodes)
      .where(eq(centerAccessCodes.id, recordId))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if code has been used
    if (existingRecord[0].used) {
      return NextResponse.json(
        { error: 'Cannot delete used codes', code: 'CODE_ALREADY_USED' },
        { status: 400 }
      );
    }

    // Delete record
    const deleted = await db
      .delete(centerAccessCodes)
      .where(eq(centerAccessCodes.id, recordId))
      .returning();

    return NextResponse.json(
      { message: 'Center access code deleted successfully', record: deleted[0] },
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