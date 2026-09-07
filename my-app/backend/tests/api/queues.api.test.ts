import './setupMocks.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../generated/prisma/client.js';
import { prisma } from '../../prisma.js';
import { asUser } from './testAgent.js';
import { TEST_IDS } from './testIds.js';

const taUser = {
    id: TEST_IDS.ta,
    email: 'ta@test.example',
    name: 'TA',
    role: Role.TA,
    defaultLocation: 'Room 1',
    notifyJoin: true,
    notifyLeave: true,
    notifySound: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const studentUser = {
    id: TEST_IDS.student,
    email: 'student@test.example',
    name: 'Student',
    role: Role.STUDENT,
    defaultLocation: null,
    notifyJoin: false,
    notifyLeave: false,
    notifySound: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('queues API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/queues/mine', () => {
        it('returns 403 for students', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(studentUser);

            const res = await asUser(TEST_IDS.student).get('/api/queues/mine');

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Forbidden: insufficient role');
        });

        it('returns TA-owned queues', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(taUser);
            vi.mocked(prisma.queue.findMany).mockResolvedValue([
                {
                    id: TEST_IDS.queue,
                    courseId: TEST_IDS.course,
                    taId: TEST_IDS.ta,
                    location: 'Room 1',
                    zoomLink: null,
                    isOpen: true,
                    startsAt: new Date(),
                    endsAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);

            const res = await asUser(TEST_IDS.ta).get('/api/queues/mine');

            expect(res.status).toBe(200);
            expect(res.body.queues).toHaveLength(1);
            expect(prisma.queue.findMany).toHaveBeenCalledWith({
                where: { taId: TEST_IDS.ta },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
});
