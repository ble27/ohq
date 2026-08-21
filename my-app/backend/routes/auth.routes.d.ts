import { Router } from 'express';
import type { Response } from 'express';
export declare function setAuthCookies(res: Response, session: {
    access_token: string;
    refresh_token: string;
}): void;
export declare const authRouter: Router;
//# sourceMappingURL=auth.routes.d.ts.map