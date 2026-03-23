import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'homeservice-jwt-secret-dev-2026';

export async function requireAdmin(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, statusCode: 401, message: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json(
                { success: false, statusCode: 401, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check if user exists and is an active ADMIN
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, status: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, statusCode: 401, message: 'User not found' },
                { status: 401 }
            );
        }

        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, statusCode: 403, message: 'Forbidden. Requires ADMIN role.' },
                { status: 403 }
            );
        }

        if (user.status === 'DEACTIVATED' || user.status === 'SUSPENDED') {
            return NextResponse.json(
                { success: false, statusCode: 403, message: `Account is ${user.status.toLowerCase()}` },
                { status: 403 }
            );
        }

        // If authenticated and is admin, return the user
        return { success: true, user };

    } catch (error: any) {
        console.error('requireAdmin error:', error);
        return NextResponse.json(
            { success: false, statusCode: 500, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
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
