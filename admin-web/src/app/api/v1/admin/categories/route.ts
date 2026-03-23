import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const getHandler = async (req: NextRequest) => {
    await requireAdmin(req);

    const result = await adminService.listCategories();
    return NextResponse.json(result);
};

const postHandler = async (req: NextRequest) => {
    await requireAdmin(req);

    const body = await req.json();
    const result = await adminService.createCategory(body);
    return NextResponse.json(result, { status: 201 });
};

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
