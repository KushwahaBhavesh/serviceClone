import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const putHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);

    const { id } = await params;
    const { status, reviewNote } = await req.json();

    if (!status) {
        return NextResponse.json(
            { success: false, statusCode: 400, message: 'Status is required' },
            { status: 400 }
        );
    }

    const result = await adminService.updateMerchantVerification(id, status, reviewNote);
    return NextResponse.json(result);
};

export const PUT = withErrorHandler(putHandler);
