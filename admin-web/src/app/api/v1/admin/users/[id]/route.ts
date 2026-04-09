import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';
import prisma from '@/lib/prisma';
import { BadRequestError } from '@/lib/errors';

const getHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);
    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            avatarUrl: true,
            onboardingCompleted: true,
            merchantProfile: {
                select: {
                    id: true,
                    businessName: true,
                    verificationStatus: true,
                },
            },
            _count: {
                select: {
                    bookings: true,
                },
            },
        },
    });

    if (!user) {
        throw new BadRequestError('User not found');
    }

    return NextResponse.json(user);
};

export const GET = withErrorHandler(getHandler);

const putHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const { role } = body;
    if (role) {
        await adminService.updateUserRole(id, role);
    }

    // Support other updates if needed
    return NextResponse.json({ success: true });
};

const deleteHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);
    const { id } = await params;
    await adminService.deleteUser(id);
    return NextResponse.json({ success: true });
};

export const PUT = withErrorHandler(putHandler);
export const DELETE = withErrorHandler(deleteHandler);
