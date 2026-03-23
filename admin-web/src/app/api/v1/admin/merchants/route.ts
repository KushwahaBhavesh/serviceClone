import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const getHandler = async (req: NextRequest) => {
    const auth = await requireAdmin(req);
    if (!auth.success) return auth as unknown as NextResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await adminService.listMerchants({ status, page, limit });
    return NextResponse.json(result);
};

export const GET = withErrorHandler(getHandler);
