import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Request timeout middleware.
 * Returns 408 if the request exceeds the specified duration.
 *
 * @param ms Timeout in milliseconds (default: 30000 = 30s)
 */
export function requestTimeout(ms: number = 30000) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                logger.warn('Request timeout: %s %s [%s] after %dms', req.method, req.url, req.id, ms);
                res.status(408).json({
                    success: false,
                    statusCode: 408,
                    message: 'Request timeout — the server took too long to respond',
                    requestId: req.id,
                    timestamp: new Date().toISOString(),
                });
            }
        }, ms);

        // Clear timer when response finishes
        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));

        next();
    };
}
