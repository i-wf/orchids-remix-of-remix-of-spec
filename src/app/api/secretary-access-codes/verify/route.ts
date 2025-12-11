import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { secretaryAccessCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    // Validate code is provided
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({
        error: 'Code is required',
        code: 'MISSING_CODE'
      }, { status: 400 });
    }

    // Trim and convert to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Find the code in database
    const accessCode = await db.select()
      .from(secretaryAccessCodes)
      .where(eq(secretaryAccessCodes.code, normalizedCode))
      .limit(1);

    // Code not found
    if (accessCode.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid code'
      }, { status: 200 });
    }

    const foundCode = accessCode[0];

    // Code already used
    if (foundCode.used) {
      return NextResponse.json({
        valid: false,
        error: 'Code already used'
      }, { status: 200 });
    }

    // Valid code - return success with details
    return NextResponse.json({
      valid: true,
      code: foundCode.code,
      secretaryName: foundCode.secretaryName,
      teacherId: foundCode.teacherId
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}