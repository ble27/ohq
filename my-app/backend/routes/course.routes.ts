import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type { CoursesListResponse } from '../../shared/types.js';

const router: Router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const courses = await prisma.course.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
        });
        const body: CoursesListResponse = { courses, message: 'SUCCESS' };
        res.status(200).json(body);
    } catch (error: unknown) {
        const message = error instanceof Error
            ? error.message
            : 'Failed to fetch courses';
        res.status(500).json({ message });
    }
});

export const courseRouter = router;
