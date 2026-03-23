import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, withErrorHandler } from '@/lib/auth';
import * as adminService from '@/lib/services/admin.service';

const getHandler = async (req: NextRequest) => {
    await requireAdmin(req);

    const stats = await adminService.getDashboardStats();
    return NextResponse.json(stats);
};

export const GET = withErrorHandler(getHandler);
