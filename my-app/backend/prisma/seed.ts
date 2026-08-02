import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const courses = [
    { code: 'csce-221', semester: 'Fall 2026' },
    { code: 'csce-313', semester: 'Fall 2026' },
    { code: 'csce-350', semester: 'Fall 2026' },
];

async function main() {
    for (const course of courses) {
        const result = await prisma.course.upsert({
            where: { code: course.code },
            update: {},
            create: course,
        });
        console.log(`Upserted course ${result.code} (${result.id})`);
    }
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
