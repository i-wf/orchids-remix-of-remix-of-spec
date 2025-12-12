import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Add new columns if they don't exist
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN bio TEXT`);
    } catch (e) {
      console.log('bio column already exists or error:', e);
    }

    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0`);
    } catch (e) {
      console.log('is_banned column already exists or error:', e);
    }

    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN banned_until TEXT`);
    } catch (e) {
      console.log('banned_until column already exists or error:', e);
    }

    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN ban_reason TEXT`);
    } catch (e) {
      console.log('ban_reason column already exists or error:', e);
    }

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}