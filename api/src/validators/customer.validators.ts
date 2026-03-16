import { z } from 'zod';

export const addressSchema = z.object({
    label: z.string().min(2),
    line1: z.string().min(5),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    zipCode: z.string().min(5),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();

export const topupSchema = z.object({
    amount: z.number().positive(),
    paymentMethod: z.string().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
