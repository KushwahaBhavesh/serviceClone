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

        // 1. Try Admin table first
        const admin = await prisma.admin.findUnique({ where: { email } });

        if (admin) {
            const isValid = await bcrypt.compare(password, admin.passwordHash);
            if (!isValid) {
                return NextResponse.json(
                    { success: false, message: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            // Update last login
            await prisma.admin.update({
                where: { id: admin.id },
                data: { lastLoginAt: new Date() },
            });

            // Generate Token
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
                token
            });
        }

        // 2. Fallback to User table for potential admins there (optional, but keep for compatibility during migration)
        const user = await prisma.user.findFirst({
            where: { email, role: 'ADMIN' }
        });

        if (user) {
            if (!user.passwordHash) {
                return NextResponse.json(
                    { success: false, message: 'Account has no password. Contact support.' },
                    { status: 401 }
                );
            }

            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                return NextResponse.json(
                    { success: false, message: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: 'ADMIN' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: 'ADMIN',
                },
                token
            });
        }

        return NextResponse.json(
            { success: false, message: 'Invalid credentials or not an admin' },
            { status: 401 }
        );

    } catch (error: any) {
        console.error('Admin Login Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
