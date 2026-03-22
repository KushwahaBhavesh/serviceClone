import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validate request body against a Zod schema
 */
export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => e.message);
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: messages[0],
                    errors: messages,
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            next(error);
        }
    };
}

/**
 * Validate request query against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Note: query parameters are often strings, Zod schema should handle coercions if needed.
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => e.message);
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: messages[0],
                    errors: messages,
                    timestamp: new Date().toISOString(),
                });
            } else {
                next(error);
            }
        }
    };
}
