import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BadRequestError } from '@/lib/errors';

const getHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            customer: {
                select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
            },
            merchant: {
                select: { id: true, name: true },
            },
            items: {
                include: {
                    service: { select: { name: true, basePrice: true } },
                },
            },
            address: true,
            agent: {
                include: {
                    user: { select: { name: true, phone: true, avatarUrl: true } },
                },
            },
        },
    });

    if (!booking) {
        throw new BadRequestError('Booking not found');
    }

    return NextResponse.json(booking);
};

export const GET = withErrorHandler(getHandler);
