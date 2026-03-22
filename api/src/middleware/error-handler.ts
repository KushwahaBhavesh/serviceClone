import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Global error handler — catches all errors from routes and middleware.
 * Handles custom HttpError, Prisma errors, Zod errors, and unknown errors.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
    const requestId = req.id || 'unknown';

    // ─── Prisma-specific errors ───
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error('[%s] Prisma error %s: %s', requestId, err.code, err.message);

        switch (err.code) {
            case 'P2002': // Unique constraint violation
                res.status(409).json({
                    success: false,
                    statusCode: 409,
                    message: 'Resource already exists (duplicate entry)',
                    requestId,
                    timestamp: new Date().toISOString(),
                });
                return;
            case 'P2025': // Record not found
                res.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: 'Resource not found',
                    requestId,
                    timestamp: new Date().toISOString(),
                });
                return;
            case 'P2003': // Foreign key constraint failed
                res.status(400).json({
                    success: false,
                    statusCode: 400,
                    message: 'Invalid reference — related resource not found',
                    requestId,
                    timestamp: new Date().toISOString(),
                });
                return;
            default:
                res.status(500).json({
                    success: false,
                    statusCode: 500,
                    message: 'Database error',
                    requestId,
                    timestamp: new Date().toISOString(),
                });
                return;
        }
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
        logger.error('[%s] Prisma init error: %s', requestId, err.message);
        res.status(503).json({
            success: false,
            statusCode: 503,
            message: 'Service temporarily unavailable — database connection issue',
            requestId,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    if (err instanceof Prisma.PrismaClientRustPanicError) {
        logger.error('[%s] Prisma critical error: %s', requestId, err.message);
        res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            requestId,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // ─── Custom HttpError ───
    if (err instanceof HttpError) {
        if (err.statusCode >= 500) {
            logger.error('[%s] Server Error: %s %O', requestId, err.message, { stack: err.stack });
        } else {
            logger.warn('[%s] Client Error %d: %s', requestId, err.statusCode, err.message);
        }

        res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
            requestId,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // ─── Unknown errors ───
    logger.error('[%s] Unhandled Error: %s %O', requestId, err.message, { stack: err.stack });

    const statusCode = err.statusCode || err.status || 500;
    const message = statusCode === 500 ? 'Internal server error' : (err.message || 'Internal server error');

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        requestId,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Custom HTTP error class — base for all API errors
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

// ─── Convenience error classes ───

export class BadRequestError extends HttpError {
    constructor(message: string, errors?: string[]) { super(400, message, errors); this.name = 'BadRequestError'; }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string = 'Unauthorized') { super(401, message); this.name = 'UnauthorizedError'; }
}

export class ForbiddenError extends HttpError {
    constructor(message: string = 'Forbidden') { super(403, message); this.name = 'ForbiddenError'; }
}

export class NotFoundError extends HttpError {
    constructor(message: string = 'Resource not found') { super(404, message); this.name = 'NotFoundError'; }
}

export class ConflictError extends HttpError {
    constructor(message: string) { super(409, message); this.name = 'ConflictError'; }
}

export class TooManyRequestsError extends HttpError {
    constructor(message: string = 'Too many requests') { super(429, message); this.name = 'TooManyRequestsError'; }
}

export class ServiceUnavailableError extends HttpError {
    constructor(message: string = 'Service temporarily unavailable') { super(503, message); this.name = 'ServiceUnavailableError'; }
}
