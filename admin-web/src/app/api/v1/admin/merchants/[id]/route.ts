import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const getHandler = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    await requireAdmin(req);
    const { id } = await params;

    const merchant = await adminService.getMerchantDetail(id);
    return NextResponse.json(merchant);
};

export const GET = withErrorHandler(getHandler);
