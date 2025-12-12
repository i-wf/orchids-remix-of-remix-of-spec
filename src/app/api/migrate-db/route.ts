import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST() {
  try {
    // Create a client directly to execute raw SQL
    const client = createClient({
      url: process.env.DATABASE_URL || 'file:local.db',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    // Add new columns if they don't exist
    try {
      await client.execute('ALTER TABLE users ADD COLUMN bio TEXT');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) {
        console.log('bio column error:', e.message);
      }
    }

    try {
      await client.execute('ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) {
        console.log('is_banned column error:', e.message);
      }
    }

    try {
      await client.execute('ALTER TABLE users ADD COLUMN banned_until TEXT');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) {
        console.log('banned_until column error:', e.message);
      }
    }

    try {
      await client.execute('ALTER TABLE users ADD COLUMN ban_reason TEXT');
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) {
        console.log('ban_reason column error:', e.message);
      }
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