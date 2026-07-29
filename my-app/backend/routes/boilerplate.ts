import { Router } from 'express';
import type { Request, Response } from 'express';

const router: Router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Fetch all TS items' });
});

router.post('/', (req: Request, res: Response): void => {
  res.json({ message: 'Create a TS item' });
});

export const itemRouter = router;
