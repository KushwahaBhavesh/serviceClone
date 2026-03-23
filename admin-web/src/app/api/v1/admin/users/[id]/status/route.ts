import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const putHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const auth = await requireAdmin(req);
    if (!auth.success) return auth as unknown as NextResponse;

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
        return NextResponse.json(
            { success: false, statusCode: 400, message: 'Status is required' },
            { status: 400 }
        );
    }

    const result = await adminService.updateUserStatus(id, status);
    return NextResponse.json(result);
};

export const PUT = withErrorHandler(putHandler);
