import { z } from 'zod';
import logger from '../utils/logger';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // JWT
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),

    // CORS
    CORS_ORIGINS: z.string().default('*'),

    // File uploads
    MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024), // 5MB
    UPLOAD_DIR: z.string().default('public/uploads'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.format();
        logger.error('❌ Invalid environment variables:');

        for (const [key, value] of Object.entries(formatted)) {
            if (key === '_errors') continue;
            const errors = (value as any)?._errors;
            if (errors?.length) {
                logger.error(`   ${key}: ${errors.join(', ')}`);
            }
        }

        process.exit(1);
    }

    return result.data;
}

export const env = validateEnv();
