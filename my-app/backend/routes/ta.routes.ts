import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { Role } from "../generated/prisma/client.js";
import { requireSelf } from "../middlewares/authz.middleware.js";

const router = Router();

// POST /api/tas/:id/verification
router.post(`/:id/verification`, requireSelf('id'), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const role = Role.TA
        const response = await prisma.user.findFirst({
            where: { id, role: role }
        })
        if (!response) {
            return res.status(404).json({
                message: `No TA found with id ${id}`,
                success: false,
            });
        }
        // console.log('TA verification complete', JSON.stringify(response));
        return res.status(200).json({
            message: 'TA verification complete',
            success: true,
        });
    } catch (error) {
        console.error('Failed to verify TA\'s status', error);
        return res.status(500).json({
            message: 'Failed to verify TA\'s status',
            success: false,
        });
    }
})


export const taRouter = router;