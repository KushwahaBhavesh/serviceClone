import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to the Express error handler.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
