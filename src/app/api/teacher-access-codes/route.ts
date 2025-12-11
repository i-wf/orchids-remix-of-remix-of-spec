import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teacherAccessCodes, users } from '@/db/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record retrieval
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(teacherAccessCodes)
        .where(eq(teacherAccessCodes.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ error: 'Access code not found' }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const usedFilter = searchParams.get('used');

    let query = db.select().from(teacherAccessCodes);
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(teacherAccessCodes.code, `%${search}%`),
          like(teacherAccessCodes.teacherName, `%${search}%`)
        )
      );
    }

    // Used status filter
    if (usedFilter !== null) {
      const usedValue = usedFilter === 'true';
      conditions.push(eq(teacherAccessCodes.used, usedValue));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query
      .orderBy(desc(teacherAccessCodes.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, teacherName, createdByOwnerId } = body;

    // Validate required fields
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({ 
        error: "Code is required and must be a non-empty string",
        code: "MISSING_CODE" 
      }, { status: 400 });
    }

    if (!teacherName || typeof teacherName !== 'string' || teacherName.trim() === '') {
      return NextResponse.json({ 
        error: "Teacher name is required and must be a non-empty string",
        code: "MISSING_TEACHER_NAME" 
      }, { status: 400 });
    }

    if (!createdByOwnerId || isNaN(parseInt(createdByOwnerId))) {
      return NextResponse.json({ 
        error: "Created by owner ID is required and must be a valid number",
        code: "MISSING_OWNER_ID" 
      }, { status: 400 });
    }

    // Validate createdByOwnerId exists and has role='owner'
    const owner = await db.select()
      .from(users)
      .where(and(
        eq(users.id, parseInt(createdByOwnerId)),
        eq(users.role, 'owner')
      ))
      .limit(1);

    if (owner.length === 0) {
      return NextResponse.json({ 
        error: "Invalid owner ID or user is not an owner",
        code: "INVALID_OWNER" 
      }, { status: 400 });
    }

    // Check code uniqueness
    const existingCode = await db.select()
      .from(teacherAccessCodes)
      .where(eq(teacherAccessCodes.code, code.trim()))
      .limit(1);

    if (existingCode.length > 0) {
      return NextResponse.json({ 
        error: "Access code already exists",
        code: "DUPLICATE_CODE" 
      }, { status: 400 });
    }

    // Create new access code
    const newAccessCode = await db.insert(teacherAccessCodes)
      .values({
        code: code.trim(),
        teacherName: teacherName.trim(),
        used: false,
        createdByOwnerId: parseInt(createdByOwnerId),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newAccessCode[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { code, teacherName, used, usedByUserId } = body;

    // Prevent manual modification of used status
    if (used !== undefined || usedByUserId !== undefined) {
      return NextResponse.json({ 
        error: "Cannot manually modify 'used' status or 'usedByUserId'. These fields are managed by the registration process.",
        code: "FORBIDDEN_FIELD_UPDATE" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(teacherAccessCodes)
      .where(eq(teacherAccessCodes.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Access code not found' }, { status: 404 });
    }

    // Prepare update object
    const updates: { code?: string; teacherName?: string } = {};

    // Validate and add code if provided
    if (code !== undefined) {
      if (typeof code !== 'string' || code.trim() === '') {
        return NextResponse.json({ 
          error: "Code must be a non-empty string",
          code: "INVALID_CODE" 
        }, { status: 400 });
      }

      // Check code uniqueness if being changed
      if (code.trim() !== existing[0].code) {
        const existingCode = await db.select()
          .from(teacherAccessCodes)
          .where(eq(teacherAccessCodes.code, code.trim()))
          .limit(1);

        if (existingCode.length > 0) {
          return NextResponse.json({ 
            error: "Access code already exists",
            code: "DUPLICATE_CODE" 
          }, { status: 400 });
        }
      }

      updates.code = code.trim();
    }

    // Validate and add teacherName if provided
    if (teacherName !== undefined) {
      if (typeof teacherName !== 'string' || teacherName.trim() === '') {
        return NextResponse.json({ 
          error: "Teacher name must be a non-empty string",
          code: "INVALID_TEACHER_NAME" 
        }, { status: 400 });
      }

      updates.teacherName = teacherName.trim();
    }

    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Update the record
    const updated = await db.update(teacherAccessCodes)
      .set(updates)
      .where(eq(teacherAccessCodes.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(teacherAccessCodes)
      .where(eq(teacherAccessCodes.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Access code not found' }, { status: 404 });
    }

    // Check if code is used
    if (existing[0].used) {
      return NextResponse.json({ 
        error: 'Cannot delete used access code',
        code: 'CODE_IN_USE' 
      }, { status: 400 });
    }

    // Delete the record
    const deleted = await db.delete(teacherAccessCodes)
      .where(eq(teacherAccessCodes.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Access code deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}