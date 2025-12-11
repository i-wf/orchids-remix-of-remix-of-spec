import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { 
          error: 'Phone number is required',
          code: 'MISSING_PHONE' 
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { 
          error: 'Password is required',
          code: 'MISSING_PASSWORD' 
        },
        { status: 400 }
      );
    }

    // Find user by phone
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    // User not found
    if (userResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS' 
        },
        { status: 401 }
      );
    }

    const user = userResult[0];

    console.log('Login attempt for:', phone);
    console.log('Stored hash:', user.password);
    console.log('Provided password:', password);

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Invalid phone number or password',
          code: 'INVALID_CREDENTIALS' 
        },
        { status: 401 }
      );
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}