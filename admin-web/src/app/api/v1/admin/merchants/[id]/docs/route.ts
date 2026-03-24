import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

// PUT /api/v1/admin/merchants/[merchantId]/docs
// Body: { id: docId, status: 'APPROVED'|'REJECTED', reviewNote?: string }
const putHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);

    const { id: docId, status, reviewNote } = await req.json();

    if (!docId || !status) {
        return NextResponse.json(
            { success: false, statusCode: 400, message: 'Document ID and status are required' },
            { status: 400 }
        );
    }

    const result = await adminService.updateDocVerification(docId, status, reviewNote);
    return NextResponse.json({ success: true, data: result });
};

export const PUT = withErrorHandler(putHandler);
