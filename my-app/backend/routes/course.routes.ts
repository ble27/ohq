import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import type { CoursesListResponse } from '../../shared/types.js';

const router: Router = Router();

// GET /api/courses — list all active courses
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

// Fetch course id from course code
router.get('/:code', async (req: Request, res: Response): Promise<void> => {
    try {
        const code = req.params.code as string;

        const course = await prisma.course.findUnique({
            where: { code },
        });
        const body = { courseId: course?.id, message: 'SUCCESS'};
        // console.log('successfully retrieved course id from course code');
        res.status(200).json(body);
    } catch (error: unknown) {
        const message = error instanceof Error
            ? error.message
            : 'Failed to fetch course ID from course code';
        // console.log('failed to retrieved course id from course code');
        res.status(500).json({ message });
    }
});

export const courseRouter = router;
