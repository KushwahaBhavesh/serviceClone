import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    // ─── Categories ───
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'cleaning' },
            update: {},
            create: {
                name: 'Cleaning',
                slug: 'cleaning',
                description: 'Home & office cleaning services',
                sortOrder: 1,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'plumbing' },
            update: {},
            create: {
                name: 'Plumbing',
                slug: 'plumbing',
                description: 'Plumbing repairs and installations',
                sortOrder: 2,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'electrical' },
            update: {},
            create: {
                name: 'Electrical',
                slug: 'electrical',
                description: 'Electrical repairs and wiring',
                sortOrder: 3,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'painting' },
            update: {},
            create: {
                name: 'Painting',
                slug: 'painting',
                description: 'Interior & exterior painting',
                sortOrder: 4,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'ac-repair' },
            update: {},
            create: {
                name: 'AC Repair',
                slug: 'ac-repair',
                description: 'Air conditioner servicing & repair',
                sortOrder: 5,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'carpentry' },
            update: {},
            create: {
                name: 'Carpentry',
                slug: 'carpentry',
                description: 'Furniture repair and woodwork',
                sortOrder: 6,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'pest-control' },
            update: {},
            create: {
                name: 'Pest Control',
                slug: 'pest-control',
                description: 'Termite, cockroach, and pest treatment',
                sortOrder: 7,
            },
        }),
        prisma.category.upsert({
            where: { slug: 'appliance-repair' },
            update: {},
            create: {
                name: 'Appliance Repair',
                slug: 'appliance-repair',
                description: 'Washing machine, fridge, microwave repair',
                sortOrder: 8,
            },
        }),
    ]);

    console.log(`✅ ${categories.length} categories seeded`);

    // ─── Services ───
    const [cleaning, plumbing, electrical, painting, acRepair, carpentry, pestControl, applianceRepair] = categories;

    const services = await Promise.all([
        // Cleaning
        prisma.service.upsert({ where: { slug: 'deep-cleaning' }, update: {}, create: { name: 'Deep Cleaning', slug: 'deep-cleaning', description: 'Full home deep cleaning including kitchen & bathroom', basePrice: 1999, unit: 'per_visit', duration: 180, categoryId: cleaning.id } }),
        prisma.service.upsert({ where: { slug: 'bathroom-cleaning' }, update: {}, create: { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', description: 'Professional bathroom scrubbing & sanitization', basePrice: 499, unit: 'per_visit', duration: 60, categoryId: cleaning.id } }),
        prisma.service.upsert({ where: { slug: 'sofa-cleaning' }, update: {}, create: { name: 'Sofa Cleaning', slug: 'sofa-cleaning', description: 'Upholstery steam cleaning', basePrice: 799, unit: 'per_visit', duration: 90, categoryId: cleaning.id } }),

        // Plumbing
        prisma.service.upsert({ where: { slug: 'tap-repair' }, update: {}, create: { name: 'Tap & Faucet Repair', slug: 'tap-repair', description: 'Fix leaky taps, replace faucets', basePrice: 299, unit: 'per_visit', duration: 45, categoryId: plumbing.id } }),
        prisma.service.upsert({ where: { slug: 'pipe-leak-fix' }, update: {}, create: { name: 'Pipe Leak Fix', slug: 'pipe-leak-fix', description: 'Repair leaking pipes and joints', basePrice: 499, unit: 'per_visit', duration: 60, categoryId: plumbing.id } }),
        prisma.service.upsert({ where: { slug: 'drain-cleaning' }, update: {}, create: { name: 'Drain Cleaning', slug: 'drain-cleaning', description: 'Unclog and clean blocked drains', basePrice: 399, unit: 'per_visit', duration: 45, categoryId: plumbing.id } }),

        // Electrical
        prisma.service.upsert({ where: { slug: 'fan-installation' }, update: {}, create: { name: 'Fan Installation', slug: 'fan-installation', description: 'Ceiling fan fitting & wiring', basePrice: 349, unit: 'per_visit', duration: 60, categoryId: electrical.id } }),
        prisma.service.upsert({ where: { slug: 'wiring-repair' }, update: {}, create: { name: 'Wiring Repair', slug: 'wiring-repair', description: 'Fix short circuits and faulty wiring', basePrice: 499, unit: 'per_hour', duration: 60, categoryId: electrical.id } }),
        prisma.service.upsert({ where: { slug: 'switchboard-repair' }, update: {}, create: { name: 'Switchboard Repair', slug: 'switchboard-repair', description: 'Replace or fix switchboards and MCBs', basePrice: 299, unit: 'per_visit', duration: 45, categoryId: electrical.id } }),

        // Painting
        prisma.service.upsert({ where: { slug: 'room-painting' }, update: {}, create: { name: 'Room Painting', slug: 'room-painting', description: 'Full room painting (walls + ceiling)', basePrice: 2499, unit: 'per_sqft', duration: 480, categoryId: painting.id } }),

        // AC Repair
        prisma.service.upsert({ where: { slug: 'ac-service' }, update: {}, create: { name: 'AC Service', slug: 'ac-service', description: 'Split/window AC service with gas check', basePrice: 599, unit: 'per_visit', duration: 60, categoryId: acRepair.id } }),
        prisma.service.upsert({ where: { slug: 'ac-installation' }, update: {}, create: { name: 'AC Installation', slug: 'ac-installation', description: 'New AC installation with copper piping', basePrice: 1499, unit: 'per_visit', duration: 120, categoryId: acRepair.id } }),

        // Carpentry
        prisma.service.upsert({ where: { slug: 'furniture-assembly' }, update: {}, create: { name: 'Furniture Assembly', slug: 'furniture-assembly', description: 'Assemble new furniture (bed, table, wardrobe)', basePrice: 499, unit: 'per_visit', duration: 120, categoryId: carpentry.id } }),
        prisma.service.upsert({ where: { slug: 'door-repair' }, update: {}, create: { name: 'Door Repair', slug: 'door-repair', description: 'Fix hinges, handles, and alignment', basePrice: 349, unit: 'per_visit', duration: 60, categoryId: carpentry.id } }),

        // Pest Control
        prisma.service.upsert({ where: { slug: 'cockroach-treatment' }, update: {}, create: { name: 'Cockroach Treatment', slug: 'cockroach-treatment', description: 'Gel-based cockroach control for kitchen & home', basePrice: 799, unit: 'per_visit', duration: 60, categoryId: pestControl.id } }),

        // Appliance Repair
        prisma.service.upsert({ where: { slug: 'washing-machine-repair' }, update: {}, create: { name: 'Washing Machine Repair', slug: 'washing-machine-repair', description: 'Diagnose and fix washing machine issues', basePrice: 399, unit: 'per_visit', duration: 60, categoryId: applianceRepair.id } }),
        prisma.service.upsert({ where: { slug: 'fridge-repair' }, update: {}, create: { name: 'Fridge Repair', slug: 'fridge-repair', description: 'Fridge cooling issue diagnosis and repair', basePrice: 499, unit: 'per_visit', duration: 60, categoryId: applianceRepair.id } }),
    ]);

    console.log(`✅ ${services.length} services seeded`);
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
