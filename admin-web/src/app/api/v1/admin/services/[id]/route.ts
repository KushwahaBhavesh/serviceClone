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
    const body = await req.json();

    const result = await adminService.updateService(id, body);
    return NextResponse.json(result);
};

export const PUT = withErrorHandler(putHandler);
