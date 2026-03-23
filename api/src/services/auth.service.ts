import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthProvider, UserRole } from '@prisma/client';
import { env } from '../config/env';
import logger from '../utils/logger';
import {
    BadRequestError,
    ConflictError,
    UnauthorizedError,
} from '../middleware/error-handler';
import type {
    RegisterInput,
    LoginInput,
    SendOtpInput,
    VerifyOtpInput,
    SocialLoginInput,
    CompleteOnboardingInput,
    UpdateProfileInput,
} from '../validators/auth.validators';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

// ─── Helpers ───

function sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
}

async function generateTokens(
    userId: string,
    email: string | null | undefined,
    phone: string | null | undefined,
    role: string,
) {
    const payload = { sub: userId, email, phone, role };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRATION as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'],
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
        data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
}

// ─── AUTH SERVICE ───

export async function register(data: RegisterInput) {
    const { email, phone, name, password, role } = data;

    if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) throw new ConflictError('Email already registered');
    }
    if (phone) {
        const existing = await prisma.user.findUnique({ where: { phone } });
        if (existing) throw new ConflictError('Phone number already registered');
    }

    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;

    const user = await prisma.user.create({
        data: {
            email,
            phone,
            name,
            passwordHash,
            role: (role as UserRole) || UserRole.CUSTOMER,
            authProvider: email ? AuthProvider.EMAIL : AuthProvider.PHONE,
            status: 'ONBOARDING',
        },
    });

    const tokens = await generateTokens(user.id, user.email, user.phone, user.role);
    return { user: sanitizeUser(user), ...tokens };
}

export async function login(data: LoginInput) {
    const { email, phone, password } = data;

    const user = await prisma.user.findFirst({
        where: email ? { email } : { phone },
    });

    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }

    if (password) {
        if (!user.passwordHash) throw new UnauthorizedError('Account does not have a password. Use OTP to login.');
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) throw new UnauthorizedError('Invalid credentials');
    } else {
        // If no password provided, user MUST use OTP (this should be blocked at the route level or redirect to OTP)
        throw new UnauthorizedError('Password or OTP required');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    const tokens = await generateTokens(user.id, user.email, user.phone, user.role);
    return { user: sanitizeUser(user), ...tokens };
}

export async function sendOtp(data: SendOtpInput) {
    const { phone } = data;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
        where: { phone, verified: false },
        data: { verified: true },
    });

    await prisma.otpCode.create({ data: { phone, code, expiresAt } });
    logger.info('[DEV] OTP for %s: %s', phone, code);

    return {
        message: 'OTP sent successfully',
        expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
        ...(env.NODE_ENV !== 'production' && { devCode: code }),
    };
}

export async function verifyOtp(data: VerifyOtpInput) {
    const { phone, code, name } = data;

    const otpRecord = await prisma.otpCode.findFirst({
        where: { phone, code, verified: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new UnauthorizedError('Invalid or expired OTP');
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        throw new UnauthorizedError('Too many attempts. Request a new OTP.');
    }

    await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
    });

    await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
    });

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                phone,
                name,
                authProvider: AuthProvider.PHONE,
                status: 'ONBOARDING'
            },
        });
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                ...(name && !user.name && { name }) // Update name if provided and not set
            },
        });
    }

    const tokens = await generateTokens(user.id, user.email, user.phone, user.role);
    return { user: sanitizeUser(user), isNewUser: !user.onboardingCompleted, ...tokens };
}

export async function googleLogin(data: SocialLoginInput) {
    const { idToken } = data;

    let payload: { sub?: string; email?: string; name?: string; picture?: string };
    try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
            payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        } else {
            throw new Error('Invalid token format');
        }
    } catch {
        throw new UnauthorizedError('Invalid Google ID token');
    }

    const { sub: googleId, email, name, picture } = payload;
    if (!googleId || !email) throw new UnauthorizedError('Invalid Google token payload');

    let user = await prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId, avatarUrl: picture || user.avatarUrl, lastLoginAt: new Date() },
            });
        } else {
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }
    } else {
        user = await prisma.user.create({
            data: {
                email, name, googleId, avatarUrl: picture,
                authProvider: AuthProvider.GOOGLE, status: 'ONBOARDING',
            },
        });
    }

    const tokens = await generateTokens(user.id, user.email, user.phone, user.role);
    return { user: sanitizeUser(user), isNewUser: !user.onboardingCompleted, ...tokens };
}

export async function refreshTokens(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
    });

    const { user } = storedToken;
    const tokens = await generateTokens(user.id, user.email, user.phone, user.role);
    return { user: sanitizeUser(user), ...tokens };
}

export async function logout(userId: string) {
    await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
    });
    return { message: 'Logged out successfully' };
}

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');
    return { user: sanitizeUser(user) };
}

export async function completeOnboarding(userId: string, data: CompleteOnboardingInput) {
    const {
        role, email, name, businessName, skills, avatarUrl, locationName,
        latitude, longitude, description, businessCategory, selectedPlan
    } = data;

    // Check for duplicate email before the transaction
    let safeEmail = email || undefined;
    if (safeEmail) {
        const existingUser = await prisma.user.findFirst({
            where: { email: safeEmail, NOT: { id: userId } },
        });
        if (existingUser) {
            safeEmail = undefined; // Skip email update — already taken
        }
    }

    return await prisma.$transaction(async (tx) => {
        // Update user core profile
        const user = await tx.user.update({
            where: { id: userId },
            data: {
                role: role as UserRole,
                email: safeEmail,
                name,
                avatarUrl,
                locationName,
                latitude,
                longitude,
                onboardingCompleted: true,
                status: 'ACTIVE',
            },
        });

        // Role-specific profile creation
        if (role === UserRole.MERCHANT && businessName) {
            const merchantProfile = await tx.merchantProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    businessName,
                    businessCategory,
                    description,
                    latitude,
                    longitude,
                    address: locationName,
                },
                update: {
                    businessName,
                    businessCategory,
                    description,
                    latitude,
                    longitude,
                    address: locationName,
                },
            });

            // Handle Pricing/Subscription Plan
            if (selectedPlan) {
                const planTier = selectedPlan as 'STARTER' | 'PRO' | 'ELITE';
                let validUntil = null;

                // If PRO or ELITE, set a 30-day billing cycle
                if (planTier !== 'STARTER') {
                    validUntil = new Date();
                    validUntil.setDate(validUntil.getDate() + 30);
                }

                // @ts-ignore - Temporary fix for missing property in generated client
                await (tx as any).subscriptionPlan.upsert({
                    where: { merchantId: merchantProfile.id },
                    create: {
                        merchantId: merchantProfile.id,
                        tier: planTier,
                        currentPeriodEnd: validUntil,
                        status: 'ACTIVE'
                    },
                    update: {
                        tier: planTier,
                        currentPeriodEnd: validUntil,
                        status: 'ACTIVE'
                    }
                });
            }

        } else if (role === UserRole.AGENT) {
            // Check for existing merchant or find a fallback
            let merchantProfile = await tx.merchantProfile.findFirst({
                where: { userId: userId } // Check if they are their own merchant (independent)
            });

            if (!merchantProfile) {
                merchantProfile = await tx.merchantProfile.findFirst();
            }

            if (merchantProfile) {
                await tx.agent.upsert({
                    where: { userId },
                    create: {
                        userId,
                        merchantId: merchantProfile.id,
                        skills: skills || [],
                    },
                    update: {
                        skills: skills || [],
                    },
                });
            }
        }

        const tokens = await generateTokens(user.id, user.email, user.phone, user.role);

        return { user: sanitizeUser(user), ...tokens };
    });
}

export async function updateLocation(userId: string, data: { locationName: string; latitude: number; longitude: number }) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            locationName: data.locationName,
            latitude: data.latitude,
            longitude: data.longitude,
        },
    });
    return { user: sanitizeUser(user) };
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
    const { name, email, avatarUrl } = data;

    // Check if email already exists for another user
    if (email) {
        const existing = await prisma.user.findFirst({
            where: { email, NOT: { id: userId } }
        });
        if (existing) throw new ConflictError('Email already in use');
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name && { name }),
            ...(email && { email }),
            ...(avatarUrl && { avatarUrl }),
        },
    });
    return { user: sanitizeUser(user) };
}
