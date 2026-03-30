import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { HttpError, UnauthorizedError, ForbiddenError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'homeservice-jwt-secret-dev-2026';

/**
 * Validates the request's Bearer token and ensures the caller is an active Admin.
 * Returns the admin record on success, throws on failure.
 */
export async function requireAdmin(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch {
        throw new UnauthorizedError('Invalid or expired token');
    }

    // Only check the Admin table
    const admin = await prisma.admin.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, status: true },
    });

    if (!admin) {
        throw new UnauthorizedError('Admin not found');
    }

    if (admin.status === 'DEACTIVATED' || admin.status === 'SUSPENDED') {
        throw new ForbiddenError(`Account is ${admin.status.toLowerCase()}`);
    }

    return admin;
}

/**
 * Wraps an API handler with consistent error handling.
 */
export function withErrorHandler(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
        try {
            return await handler(req, ...args);
        } catch (error: any) {
            console.error('API Error:', error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Internal server error';
            return NextResponse.json(
                { success: false, statusCode, message, errors: error.errors },
                { status: statusCode }
            );
        }
    };
}
