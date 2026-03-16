import { z } from 'zod';

const UserRoleEnum = z.enum(['CUSTOMER', 'MERCHANT', 'AGENT', 'ADMIN']);

export const registerSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().min(2),
    password: z.string().min(8).optional(),
    role: UserRoleEnum.optional(),
}).refine((data) => data.email || data.phone, {
    message: 'Email or phone number is required',
});

export const loginSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1).optional(),
}).refine((data) => data.email || data.phone, {
    message: 'Email or phone is required',
});

export const sendOtpSchema = z.object({
    phone: z.string().min(10),
});

export const verifyOtpSchema = z.object({
    phone: z.string().min(10),
    code: z.string().min(6).max(6),
    name: z.string().optional(),
});

export const socialLoginSchema = z.object({
    idToken: z.string().min(1),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});

export const completeOnboardingSchema = z.object({
    role: UserRoleEnum,
    email: z.string().email().optional(),
    name: z.string().optional(),
    businessName: z.string().min(2).max(100).optional(),
    skills: z.array(z.string()).optional(),
    avatarUrl: z.string().url().optional(),
    description: z.string().max(500).optional(),
    businessCategory: z.string().optional(),
    panNumber: z.string().max(10, 'PAN_TOO_LONG').or(z.literal('')).optional(),
    gstNumber: z.string().max(15, 'GST_TOO_LONG_DEBUG').or(z.literal('')).optional(),
    locationName: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
