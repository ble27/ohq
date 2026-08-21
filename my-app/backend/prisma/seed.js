import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const courses = [
    // CSCE
    { code: 'CSCE 120', semester: 'Fall 2026' },
    { code: 'CSCE 221', semester: 'Fall 2026' },
    { code: 'CSCE 313', semester: 'Fall 2026' },
    { code: 'CSCE 314', semester: 'Fall 2026' },
    // ECEN
    { code: 'ECEN 248', semester: 'Fall 2026' },
    { code: 'ECEN 214', semester: 'Fall 2026' },
    { code: 'ECEN 314', semester: 'Fall 2026' },
    { code: 'ECEN 350', semester: 'Fall 2026' },
    // ENGR
    { code: 'ENGR 102', semester: 'Fall 2026' },
    { code: 'ENGR 216', semester: 'Fall 2026' },
    { code: 'ENGR 217', semester: 'Fall 2026' },
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
//# sourceMappingURL=seed.js.map