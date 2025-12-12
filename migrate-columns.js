import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:local.db',
});

async function migrate() {
  try {
    await client.execute('ALTER TABLE users ADD COLUMN bio TEXT');
    console.log('✓ Added bio column');
  } catch (e) {
    console.log('bio column exists or error:', e.message);
  }

  try {
    await client.execute('ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0');
    console.log('✓ Added is_banned column');
  } catch (e) {
    console.log('is_banned column exists or error:', e.message);
  }

  try {
    await client.execute('ALTER TABLE users ADD COLUMN banned_until TEXT');
    console.log('✓ Added banned_until column');
  } catch (e) {
    console.log('banned_until column exists or error:', e.message);
  }

  try {
    await client.execute('ALTER TABLE users ADD COLUMN ban_reason TEXT');
    console.log('✓ Added ban_reason column');
  } catch (e) {
    console.log('ban_reason column exists or error:', e.message);
  }

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrate();
