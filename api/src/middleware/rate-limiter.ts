import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

/**
 * Global API rate limiter — 100 requests per minute per IP.
 * Protects against brute force and accidental DDoS.
 */
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    handler: (_req, res) => {
        logger.warn('Rate limit exceeded: %s %s from %s', _req.method, _req.url, _req.ip);
        res.status(429).json({
            success: false,
            statusCode: 429,
            message: 'Too many requests — please try again later',
            requestId: _req.id,
            timestamp: new Date().toISOString(),
        });
    },
});

/**
 * Strict rate limiter for auth endpoints — 10 requests per minute per IP.
 * Prevents brute force login/OTP attempts.
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        logger.warn('Auth rate limit exceeded from %s', _req.ip);
        res.status(429).json({
            success: false,
            statusCode: 429,
            message: 'Too many authentication attempts — please wait 1 minute',
            requestId: _req.id,
            timestamp: new Date().toISOString(),
        });
    },
});

/**
 * Upload rate limiter — 20 requests per minute per IP.
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        logger.warn('Upload rate limit exceeded from %s', _req.ip);
        res.status(429).json({
            success: false,
            statusCode: 429,
            message: 'Too many upload requests — please try again later',
            requestId: _req.id,
            timestamp: new Date().toISOString(),
        });
    },
});
