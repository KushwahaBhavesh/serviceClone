import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function seed() {
    console.log('🌱 Seeding Admin Web Database...');

    const adminEmail = 'admin@ondemand.com';
    const adminPassword = 'admin'; // Same as configured in API seed for consistency
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    await prisma.admin.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Platform Admin',
            passwordHash: hashedPassword,
            status: 'ACTIVE',
        },
    });

    console.log(`✅ Admin user seeded: ${adminEmail} / ${adminPassword}`);
    console.log('🌱 Seeding complete!');
}

seed()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
