import './setupMocks.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../generated/prisma/client.js';
import { prisma } from '../../prisma.js';
import { api, asUser } from './testAgent.js';
import { TEST_IDS } from './testIds.js';

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

describe('users API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/users/:id', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await api().get(`/api/users/${TEST_IDS.student}`);
            expect(res.status).toBe(401);
        });

        it('returns 403 when fetching another user', async () => {
            const res = await asUser(TEST_IDS.student).get(`/api/users/${TEST_IDS.other}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Forbidden');
        });

        it('returns 200 for the authenticated user', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(studentUser);

            const res = await asUser(TEST_IDS.student).get(`/api/users/${TEST_IDS.student}`);

            expect(res.status).toBe(200);
            expect(res.body.user.id).toBe(TEST_IDS.student);
        });
    });

    describe('PATCH /api/users/:id/name', () => {
        it('returns 403 when updating another user', async () => {
            const res = await asUser(TEST_IDS.student)
                .patch(`/api/users/${TEST_IDS.other}/name`)
                .send({ name: 'Hacker' });

            expect(res.status).toBe(403);
        });

        it('returns 400 for invalid display names', async () => {
            const res = await asUser(TEST_IDS.student)
                .patch(`/api/users/${TEST_IDS.student}/name`)
                .send({ name: '' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid input');
        });

        it('updates the caller display name', async () => {
            vi.mocked(prisma.user.update).mockResolvedValue({ ...studentUser, name: 'New Name' });

            const res = await asUser(TEST_IDS.student)
                .patch(`/api/users/${TEST_IDS.student}/name`)
                .send({ name: 'New Name' });

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe('New Name');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: TEST_IDS.student },
                data: { name: 'New Name' },
            });
        });
    });

    describe('PATCH /api/users/:id/defaultlocation', () => {
        it('returns 403 for students', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

            const res = await asUser(TEST_IDS.student)
                .patch(`/api/users/${TEST_IDS.student}/defaultlocation`)
                .send({ defaultLocation: 'Room 101' });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Only TAs can update a default queue location');
        });
    });
});
