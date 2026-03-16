import { z } from 'zod';

export const phoneSchema = z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits');

export const otpSchema = z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only digits');

export const loginSchema = z.object({
    phone: phoneSchema,
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
    phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
    phone: phoneSchema,
    code: otpSchema,
    name: z.string().min(2).max(50).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
export type SendOtpFormData = z.infer<typeof loginSchema>;
