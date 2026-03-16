import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Global error handler — replaces NestJS GlobalExceptionFilter
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
    logger.error('API Error: %s %O', err.message, { stack: err.stack, ...err });

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Custom HTTP error class
 */
export class HttpError extends Error {
    statusCode: number;
    errors?: string[];

    constructor(statusCode: number, message: string, errors?: string[]) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'HttpError';
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string) { super(400, message); }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string) { super(401, message); }
}

export class ForbiddenError extends HttpError {
    constructor(message: string) { super(403, message); }
}

export class ConflictError extends HttpError {
    constructor(message: string) { super(409, message); }
}
