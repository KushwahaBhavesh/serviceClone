import prisma from '../lib/prisma';
import { BloomFilter } from '../utils/bloom-filter';
import logger from '../utils/logger';

/**
 * BloomFilterService (Singleton)
 * Manages the Bloom Filter for phone number existence checks.
 */
class BloomFilterService {
    private static instance: BloomFilterService;
    private filter: BloomFilter;
    private isInitialized: boolean = false;

    private constructor() {
        // Size: 500,000 bits (~62.5 KB), 7 Hashes
        // Good for ~50,000 items with < 1% false positive rate
        this.filter = new BloomFilter(500000, 7);
    }

    public static getInstance(): BloomFilterService {
        if (!BloomFilterService.instance) {
            BloomFilterService.instance = new BloomFilterService();
        }
        return BloomFilterService.instance;
    }

    /**
     * Initializes the Bloom Filter by loading all phone numbers from the database.
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            logger.info('Initializing Bloom Filter from database...');
            const users = await prisma.user.findMany({
                where: { phone: { not: null } },
                select: { phone: true },
            });

            users.forEach(user => {
                if (user.phone) {
                    this.filter.add(user.phone);
                }
            });

            this.isInitialized = true;
            logger.info(`Bloom Filter initialized with ${users.length} phone numbers.`);
        } catch (error) {
            logger.error('Failed to initialize Bloom Filter:', error);
            // We don't throw; the app can still function without the filter (falling back to DB)
        }
    }

    /**
     * Adds a phone number to the filter.
     */
    public addPhone(phone: string): void {
        this.filter.add(phone);
        logger.debug(`Added phone to Bloom Filter: ${phone}`);
    }

    /**
     * Probabilistically checks if a phone number exists.
     * Returns false if definitely not in the system.
     * Returns true if it might be in the system.
     */
    public checkPhone(phone: string): boolean {
        // Normalize phone number if needed (e.g., removing + or spaces)
        const cleanPhone = phone.trim();
        return this.filter.mightContain(cleanPhone);
    }
}

export const bloomService = BloomFilterService.getInstance();
export default bloomService;
