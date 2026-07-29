import { Router, Request, Response } from 'express';

// Initialize the router instance
const router: Router = Router();

// Define routes using built-in Express types
router.get('/', (req: Request, res: Response): void => {
  res.json({ message: "Fetch all TS items" });
});

router.post('/', (req: Request, res: Response): void => {
  res.json({ message: "Create a TS item" });
});

// Export the router using a named export
export const itemRouter = router;
