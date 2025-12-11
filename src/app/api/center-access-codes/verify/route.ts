import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { centerAccessCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    // Validate required field
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Code is required and must be a non-empty string',
          code: 'MISSING_CODE'
        },
        { status: 400 }
      );
    }

    // Normalize code: trim and uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Find code in database
    const accessCode = await db
      .select()
      .from(centerAccessCodes)
      .where(eq(centerAccessCodes.code, normalizedCode))
      .limit(1);

    // Code not found
    if (accessCode.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid code'
        },
        { status: 200 }
      );
    }

    const foundCode = accessCode[0];

    // Code already used
    if (foundCode.used) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Code already used'
        },
        { status: 200 }
      );
    }

    // Valid code - return verification success
    return NextResponse.json(
      {
        valid: true,
        code: foundCode.code,
        centerName: foundCode.centerName,
        createdByOwnerId: foundCode.createdByOwnerId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/center-access-codes/verify error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}