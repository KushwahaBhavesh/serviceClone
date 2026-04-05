import { z } from 'zod';

// ─── Merchant Profile / Settings ───

export const updateMerchantProfileSchema = z.object({
    businessName: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    serviceRadius: z.number().min(1).max(100).optional(),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
    bankAccountName: z.string().optional(),
    logoUrl: z.string().optional(),
    coverImageUrl: z.string().optional(),
});

export type UpdateMerchantProfileInput = z.infer<typeof updateMerchantProfileSchema>;

// ─── Merchant Service (enable platform service with custom price) ───

export const createMerchantServiceSchema = z.object({
    serviceId: z.string().cuid(),
    price: z.number().positive(),
    unit: z.string().optional(),
    description: z.string().max(1000).optional(),
});

export const updateMerchantServiceSchema = z.object({
    price: z.number().positive().optional(),
    unit: z.string().optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
});

export type CreateMerchantServiceInput = z.infer<typeof createMerchantServiceSchema>;
export type UpdateMerchantServiceInput = z.infer<typeof updateMerchantServiceSchema>;

// ─── Agent Management ───

export const createAgentSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().optional(),
    phone: z.string().min(10),
    skills: z.array(z.string()).default([]),
});

export const updateAgentSchema = z.object({
    skills: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

// ─── Slot Management ───

export const createSlotsSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slots: z.array(z.object({
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        agentId: z.string().cuid(),
    })).min(1),
});

export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;

// ─── Order Operations ───

export const assignAgentSchema = z.object({
    agentId: z.string().cuid(),
});

export type AssignAgentInput = z.infer<typeof assignAgentSchema>;

// ─── KYC / Verification ───

export const submitKycDocSchema = z.object({
    type: z.enum(['PAN_CARD', 'AADHAAR', 'GST_CERTIFICATE', 'BUSINESS_LICENSE', 'BANK_PROOF', 'OTHER']),
    fileUrl: z.string().min(1),
});

export type SubmitKycDocInput = z.infer<typeof submitKycDocSchema>;

// ─── Promotions ───

export const createPromotionSchema = z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    type: z.enum(['PERCENTAGE', 'FLAT']),
    value: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().nonnegative().optional(),
    startDate: z.string().datetime().optional(),
    expiryDate: z.string().datetime(),
    usageLimit: z.number().positive().optional(),
    isActive: z.boolean().optional(),
});

export const updatePromotionSchema = z.object({
    isActive: z.boolean(),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

// ─── Reviews ───

export const replyToReviewSchema = z.object({
    reply: z.string().min(1).max(1000),
});

export type ReplyToReviewInput = z.infer<typeof replyToReviewSchema>;

// ─── Chat ───

export const sendMessageSchema = z.object({
    content: z.string().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ─── Settings / Profile ───

export const updatePushTokenSchema = z.object({
    token: z.string(),
});
