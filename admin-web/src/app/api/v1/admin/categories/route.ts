import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const getHandler = async (req: NextRequest) => {
    const auth = await requireAdmin(req);
    if (!auth.success) return auth as unknown as NextResponse;

    const result = await adminService.listCategories();
    return NextResponse.json(result);
};

const postHandler = async (req: NextRequest) => {
    const auth = await requireAdmin(req);
    if (!auth.success) return auth as unknown as NextResponse;

    const body = await req.json();
    const result = await adminService.createCategory(body);
    return NextResponse.json(result, { status: 201 });
};

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
