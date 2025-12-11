import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🔐 Generating password hashes...');
    console.log('Hashed password sample:', bcrypt.hashSync("123456", 10));

    const sampleUsers = [
        {
            phone: "01000000001",
            password: bcrypt.hashSync("123456", 10),
            role: "student",
            name: "أحمد محمد",
            grade: "1-secondary",
            age: 16,
            subjects: null,
            subscriptionType: "free",
            subscriptionExpiresAt: null,
            createdAt: new Date().toISOString()
        },
        {
            phone: "01000000002",
            password: bcrypt.hashSync("123456", 10),
            role: "teacher",
            name: "د. محمود حسن",
            grade: null,
            age: null,
            subjects: "رياضيات,فيزياء",
            subscriptionType: null,
            subscriptionExpiresAt: null,
            createdAt: new Date().toISOString()
        },
        {
            phone: "01000000003",
            password: bcrypt.hashSync("123456", 10),
            role: "owner",
            name: "المالك",
            grade: null,
            age: null,
            subjects: null,
            subscriptionType: null,
            subscriptionExpiresAt: null,
            createdAt: new Date().toISOString()
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
    console.log('📋 Created 3 test users:');
    console.log('   Student: 01000000001 / 123456');
    console.log('   Teacher: 01000000002 / 123456');
    console.log('   Owner:   01000000003 / 123456');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});