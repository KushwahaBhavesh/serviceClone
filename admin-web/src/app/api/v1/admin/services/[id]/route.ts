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

    const result = await adminService.updateService(id, body);
    return NextResponse.json(result);
};

export const PUT = withErrorHandler(putHandler);

export const DELETE = withErrorHandler(async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);

    const { id } = await params;
    const result = await adminService.deleteService(id);
    return NextResponse.json(result);
});
