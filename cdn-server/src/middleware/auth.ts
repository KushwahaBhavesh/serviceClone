import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';

export const authenticateInternal = (req: Request, res: Response, next: NextFunction) => {
    const authKey = req.headers['x-cdn-auth-key'];

    if (!authKey || authKey !== CONFIG.CDN_AUTH_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or missing CDN Auth Key'
        });
    }

    next();
};
