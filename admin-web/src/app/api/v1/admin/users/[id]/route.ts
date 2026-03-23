import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

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
