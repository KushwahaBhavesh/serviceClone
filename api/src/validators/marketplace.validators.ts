import { z } from 'zod';

// ─── Categories ───

export const createCategorySchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    iconUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    sortOrder: z.number().int().optional(),
    parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── Services ───

export const createServiceSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    basePrice: z.number().positive(),
    unit: z.enum(['per_visit', 'per_hour', 'per_sqft']).optional(),
    duration: z.number().int().positive().optional(),
    categoryId: z.string().min(1),
});

export const updateServiceSchema = createServiceSchema.partial();

// ─── Bookings ───

const BookingStatusEnum = z.enum([
    'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED',
]);

export const createBookingSchema = z.object({
    addressId: z.string().min(1),
    scheduledAt: z.string().datetime(),
    notes: z.string().optional(),
    items: z.array(z.object({
        serviceId: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        notes: z.string().optional(),
    })).min(1, 'At least one service item is required'),
});

export const updateBookingStatusSchema = z.object({
    status: BookingStatusEnum,
    cancellationReason: z.string().optional(),
});

// ─── Reviews ───

export const createReviewSchema = z.object({
    bookingId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    imageUrls: z.array(z.string().url()).optional(),
});

// ─── Addresses ───

export const createAddressSchema = z.object({
    label: z.string().optional(),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

// ─── Type exports ───

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
