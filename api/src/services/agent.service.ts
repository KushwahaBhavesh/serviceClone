import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get dashboard KPIs for the agent
 */
export async function getDashboardStats(agentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayJobs, completedJobs] = await Promise.all([
        prisma.booking.count({
            where: {
                agentId,
                scheduledAt: {
                    gte: today
                }
            }
        }),
        prisma.booking.count({
            where: {
                agentId,
                status: 'COMPLETED',
                scheduledAt: {
                    gte: today
                }
            }
        })
    ]);

    // Calculate approximate earnings for today
    const earningsData = await prisma.booking.aggregate({
        _sum: {
            total: true
        },
        where: {
            agentId,
            status: 'COMPLETED',
            scheduledAt: { gte: today }
        }
    });

    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { rating: true, status: true, isActive: true }
    });

    return {
        todayAssigned: todayJobs,
        todayCompleted: completedJobs,
        todayEarnings: earningsData._sum.total || 0,
        rating: agent?.rating || 0,
        status: agent?.status || 'OFFLINE'
    };
}

/**
 * Get jobs assigned to the agent
 */
export async function getAssignedJobs(agentId: string) {
    const activeJobs = await prisma.booking.findMany({
        where: {
            agentId,
            status: {
                in: ['AGENT_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS']
            }
        },
        include: {
            address: true,
            customer: {
                select: { name: true, phone: true }
            },
            items: {
                include: { service: true }
            }
        },
        orderBy: { scheduledAt: 'asc' }
    });

    const upcomingJobs = await prisma.booking.findMany({
        where: {
            agentId,
            status: 'CONFIRMED' as any,
            scheduledAt: { gte: new Date() }
        },
        include: {
            address: true,
            customer: { select: { name: true } }
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10
    });

    return { activeJobs, upcomingJobs };
}

/**
 * Get job history for the agent
 */
export async function getJobHistory(agentId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
        prisma.booking.findMany({
            where: {
                agentId,
                status: {
                    in: ['COMPLETED', 'CANCELLED', 'REJECTED']
                }
            },
            include: {
                address: true,
                customer: { select: { name: true } },
                items: { include: { service: true } }
            },
            orderBy: { completedAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.booking.count({
            where: {
                agentId,
                status: {
                    in: ['COMPLETED', 'CANCELLED', 'REJECTED']
                }
            }
        })
    ]);

    return {
        jobs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get full details of a specific job assigned to the agent
 */
export async function getJobDetails(agentId: string, jobId: string) {
    const job = await prisma.booking.findFirst({
        where: {
            id: jobId,
            agentId
        },
        include: {
            address: true,
            customer: {
                select: { id: true, name: true, phone: true, avatarUrl: true }
            },
            items: {
                include: { service: true }
            }
        }
    });

    if (!job) return null;

    return job;
}

/**
 * Update job status with transition validation
 */
export async function updateJobStatus(agentId: string, bookingId: string, nextStatus: string, proofOfWorkUrls?: string[], otp?: string) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, agentId },
    });
    if (!booking) throw new Error('Booking not found or not assigned to you');

    const updateData: any = { status: nextStatus };

    if (nextStatus === 'IN_PROGRESS') {
        // Generate a 6-digit OTP when starting the job
        updateData.completionOtp = Math.floor(100000 + Math.random() * 900000).toString();
    } else if (nextStatus === 'COMPLETED') {
        // Verify OTP when completing the job
        const b = booking as any;
        if (!b.completionOtp) {
            throw new Error('Completion OTP not generated. Please restart the job flow.');
        }
        if (b.completionOtp !== otp) {
            throw new Error('Invalid completion OTP');
        }

        updateData.completedAt = new Date();
        if (proofOfWorkUrls) {
            updateData.proofOfWorkUrls = proofOfWorkUrls;
        }
    } else if (nextStatus === 'CANCELLED') {
        updateData.cancelledAt = new Date();
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
    });
}

/**
 * Update agent's real-time location
 */
export async function updateLocation(agentId: string, lat: number, lng: number) {
    const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
            lastLocationLat: lat,
            lastLocationLng: lng,
            lastLocationAt: new Date()
        }
    });

    return updatedAgent;
}

/**
 * Toggle Agent's online/offline availability
 */
export async function updateAvailability(agentId: string, isOnline: boolean) {
    const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
            status: isOnline ? 'AVAILABLE' : 'OFFLINE'
        }
    });

    return { status: updatedAgent.status };
}
