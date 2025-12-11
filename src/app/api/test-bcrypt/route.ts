import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Validate required field
    if (!password) {
      return NextResponse.json({ 
        error: "Password is required",
        code: "MISSING_PASSWORD" 
      }, { status: 400 });
    }

    // Validate password is a string
    if (typeof password !== 'string') {
      return NextResponse.json({ 
        error: "Password must be a string",
        code: "INVALID_PASSWORD_TYPE" 
      }, { status: 400 });
    }

    // Hash the password with 10 salt rounds
    const generatedHash = await bcrypt.hash(password, 10);

    // Compare the original password with the generated hash
    const comparisonResult = await bcrypt.compare(password, generatedHash);

    // Return the test results
    return NextResponse.json({
      originalPassword: password,
      generatedHash: generatedHash,
      comparisonResult: comparisonResult,
      hashLength: generatedHash.length
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}