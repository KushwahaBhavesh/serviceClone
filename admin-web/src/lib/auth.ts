import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { HttpError, UnauthorizedError, ForbiddenError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'homeservice-jwt-secret-dev-2026';

export async function requireAdmin(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw new UnauthorizedError('Invalid or expired token');
    }

    // Check both Admin and User tables for the ADMIN role
    const [admin, user] = await Promise.all([
        prisma.admin.findUnique({
            where: { id: decoded.userId },
            select: { id: true, status: true },
        }),
        prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, status: true, email: true, name: true },
        })
    ]);

    const record = admin || user;

    if (!record) {
        throw new UnauthorizedError('User not found');
    }

    // Check if it's from the user table, it MUST have the ADMIN role
    if (!admin && user && user.role !== 'ADMIN') {
        throw new ForbiddenError('Forbidden. Requires ADMIN role.');
    }

    if (record.status === 'DEACTIVATED' || record.status === 'SUSPENDED') {
        throw new ForbiddenError(`Account is ${record.status.toLowerCase()}`);
    }

    return record;
}

// Wrapper for error handling
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
