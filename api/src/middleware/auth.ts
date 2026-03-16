import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
    sub: string;
    email?: string;
    phone?: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email?: string;
        phone?: string;
        role: string;
    };
}

/**
 * JWT auth middleware — replaces NestJS JwtAuthGuard + JwtStrategy
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Missing or invalid authorization header',
            timestamp: new Date().toISOString(),
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const payload = jwt.verify(token, secret) as JwtPayload;

        (req as AuthenticatedRequest).user = {
            id: payload.sub,
            email: payload.email,
            phone: payload.phone,
            role: payload.role,
        };

        next();
    } catch {
        res.status(401).json({
            success: false,
            statusCode: 401,
            message: 'Invalid or expired access token',
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Role-based access — replaces NestJS RolesGuard
 */
export function requireRoles(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
            res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Not authenticated',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (roles.length > 0 && !roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                statusCode: 403,
                message: `Requires one of: ${roles.join(', ')}`,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        next();
    };
}
