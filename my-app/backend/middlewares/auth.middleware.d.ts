import type { Request, Response, NextFunction } from 'express';
export default function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.middleware.d.ts.map