import './setupMocks.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../generated/prisma/client.js';
import { prisma } from '../../prisma.js';
import { joinQueue, leaveQueue, listActiveTickets } from '../../services/queue.services.js';
import { asUser } from './testAgent.js';
import { TEST_IDS } from './testIds.js';

const queue = {
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
};

const ticket = {
    id: TEST_IDS.ticket,
    queueId: TEST_IDS.queue,
    studentId: TEST_IDS.student,
    status: 'WAITING' as const,
    position: 1,
    joinedAt: new Date(),
    updatedAt: new Date(),
};

describe('queueTicket API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(listActiveTickets).mockResolvedValue([]);
    });

    describe('GET /api/queueticket/queues/:queueId', () => {
        it('returns 403 for users without queue access', async () => {
            vi.mocked(prisma.queue.findUnique).mockResolvedValue(queue);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: TEST_IDS.other,
                email: 'other@test.example',
                name: 'Other',
                role: Role.STUDENT,
                defaultLocation: null,
                notifyJoin: false,
                notifyLeave: false,
                notifySound: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            vi.mocked(prisma.queueTicket.findFirst).mockResolvedValue(null);

            const res = await asUser(TEST_IDS.other).get(`/api/queueticket/queues/${TEST_IDS.queue}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You do not have access to this queue');
        });

        it('allows the queue TA to list tickets', async () => {
            vi.mocked(prisma.queue.findUnique).mockResolvedValue(queue);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
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
            });
            vi.mocked(listActiveTickets).mockResolvedValue([ticket]);

            const res = await asUser(TEST_IDS.ta).get(`/api/queueticket/queues/${TEST_IDS.queue}`);

            expect(res.status).toBe(200);
            expect(res.body.tickets).toHaveLength(1);
        });

        it('allows a student who holds a ticket in the queue', async () => {
            vi.mocked(prisma.queue.findUnique).mockResolvedValue(queue);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
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
            });
            vi.mocked(prisma.queueTicket.findFirst).mockResolvedValue(ticket);
            vi.mocked(listActiveTickets).mockResolvedValue([ticket]);

            const res = await asUser(TEST_IDS.student).get(`/api/queueticket/queues/${TEST_IDS.queue}`);

            expect(res.status).toBe(200);
            expect(res.body.tickets).toHaveLength(1);
        });
    });

    describe('PATCH /api/queueticket/:queueTicketId (leave)', () => {
        it('returns 403 when leaving another student ticket', async () => {
            vi.mocked(prisma.queueTicket.findUnique).mockResolvedValue({
                ...ticket,
                studentId: TEST_IDS.other,
            });

            const res = await asUser(TEST_IDS.student)
                .patch(`/api/queueticket/${TEST_IDS.ticket}`)
                .send({ status: 'LEFT' });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('You cannot leave another student’s ticket');
        });

        it('allows the ticket owner to leave', async () => {
            vi.mocked(prisma.queueTicket.findUnique).mockResolvedValue(ticket);
            vi.mocked(leaveQueue).mockResolvedValue({ ...ticket, status: 'LEFT' });

            const res = await asUser(TEST_IDS.student)
                .patch(`/api/queueticket/${TEST_IDS.ticket}`)
                .send({ status: 'LEFT' });

            expect(res.status).toBe(200);
            expect(leaveQueue).toHaveBeenCalledWith(TEST_IDS.queue, TEST_IDS.student);
        });
    });

    describe('POST /api/queueticket/queues/:queueId (join)', () => {
        it('returns 409 when already active in another queue', async () => {
            vi.mocked(prisma.queueTicket.findFirst).mockResolvedValue({
                ...ticket,
                queueId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            });

            const res = await asUser(TEST_IDS.student)
                .post(`/api/queueticket/queues/${TEST_IDS.queue}`)
                .send({ status: 'WAITING' });

            expect(res.status).toBe(409);
            expect(joinQueue).not.toHaveBeenCalled();
        });

        it('creates a ticket when no conflicting active ticket exists', async () => {
            vi.mocked(prisma.queueTicket.findFirst).mockResolvedValue(null);
            vi.mocked(joinQueue).mockResolvedValue(ticket);

            const res = await asUser(TEST_IDS.student)
                .post(`/api/queueticket/queues/${TEST_IDS.queue}`)
                .send({ status: 'WAITING' });

            expect(res.status).toBe(201);
            expect(joinQueue).toHaveBeenCalledWith(TEST_IDS.queue, TEST_IDS.student);
        });
    });
});
