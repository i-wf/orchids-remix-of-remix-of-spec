import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { secretaryAccessCodes, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

function generateSecretaryCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function ensureUniqueCode(): Promise<string> {
  let code = generateSecretaryCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await db.select()
      .from(secretaryAccessCodes)
      .where(eq(secretaryAccessCodes.code, code))
      .limit(1);

    if (existing.length === 0) {
      return code;
    }

    code = generateSecretaryCode();
    attempts++;
  }

  throw new Error('Failed to generate unique code after multiple attempts');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const teacherId = searchParams.get('teacherId');
    const usedParam = searchParams.get('used');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const code = await db.select()
        .from(secretaryAccessCodes)
        .where(eq(secretaryAccessCodes.id, parseInt(id)))
        .limit(1);

      if (code.length === 0) {
        return NextResponse.json({
          error: 'Secretary access code not found',
          code: 'CODE_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(code[0], { status: 200 });
    }

    let query = db.select().from(secretaryAccessCodes);
    const conditions = [];

    if (teacherId) {
      const teacherIdInt = parseInt(teacherId);
      if (isNaN(teacherIdInt)) {
        return NextResponse.json({
          error: 'Valid teacher ID is required',
          code: 'INVALID_TEACHER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(secretaryAccessCodes.teacherId, teacherIdInt));
    }

    if (usedParam !== null) {
      const usedValue = usedParam === 'true';
      conditions.push(eq(secretaryAccessCodes.used, usedValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const codes = await query
      .orderBy(desc(secretaryAccessCodes.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(codes, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, secretaryName } = body;

    if (!teacherId) {
      return NextResponse.json({
        error: 'Teacher ID is required',
        code: 'MISSING_TEACHER_ID'
      }, { status: 400 });
    }

    if (typeof teacherId !== 'number' || isNaN(teacherId)) {
      return NextResponse.json({
        error: 'Teacher ID must be a valid integer',
        code: 'INVALID_TEACHER_ID'
      }, { status: 400 });
    }

    if (!secretaryName || typeof secretaryName !== 'string' || secretaryName.trim() === '') {
      return NextResponse.json({
        error: 'Secretary name is required and must be a non-empty string',
        code: 'MISSING_SECRETARY_NAME'
      }, { status: 400 });
    }

    const teacher = await db.select()
      .from(users)
      .where(and(
        eq(users.id, teacherId),
        eq(users.role, 'teacher')
      ))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json({
        error: 'Teacher not found or user is not a teacher',
        code: 'INVALID_TEACHER'
      }, { status: 400 });
    }

    const code = await ensureUniqueCode();

    const newCode = await db.insert(secretaryAccessCodes)
      .values({
        code,
        secretaryName: secretaryName.trim(),
        teacherId,
        used: false,
        usedByUserId: null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newCode[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { secretaryName } = body;

    if (secretaryName !== undefined && (typeof secretaryName !== 'string' || secretaryName.trim() === '')) {
      return NextResponse.json({
        error: 'Secretary name must be a non-empty string if provided',
        code: 'INVALID_SECRETARY_NAME'
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(secretaryAccessCodes)
      .where(eq(secretaryAccessCodes.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Secretary access code not found',
        code: 'CODE_NOT_FOUND'
      }, { status: 404 });
    }

    const updates: { secretaryName?: string } = {};

    if (secretaryName !== undefined) {
      updates.secretaryName = secretaryName.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    const updated = await db.update(secretaryAccessCodes)
      .set(updates)
      .where(eq(secretaryAccessCodes.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(secretaryAccessCodes)
      .where(eq(secretaryAccessCodes.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Secretary access code not found',
        code: 'CODE_NOT_FOUND'
      }, { status: 404 });
    }

    if (existing[0].used) {
      return NextResponse.json({
        error: 'Cannot delete a code that has already been used',
        code: 'CODE_ALREADY_USED'
      }, { status: 400 });
    }

    const deleted = await db.delete(secretaryAccessCodes)
      .where(eq(secretaryAccessCodes.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Secretary access code deleted successfully',
      code: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}