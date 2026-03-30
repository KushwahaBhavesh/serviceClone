import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'homeservice-jwt-secret-dev-2026';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Look up admin by email
        const admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, admin.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check account status
        if (admin.status === 'DEACTIVATED' || admin.status === 'SUSPENDED') {
            return NextResponse.json(
                { success: false, message: `Account is ${admin.status.toLowerCase()}` },
                { status: 403 }
            );
        }

        // Update last login
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: admin.id, email: admin.email, role: 'ADMIN' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            success: true,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: 'ADMIN',
            },
            token,
        });
    } catch (error: any) {
        console.error('Admin Login Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
