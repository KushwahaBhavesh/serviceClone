import crypto from 'crypto';

/**
 * A simple Bloom Filter implementation for probabilistic membership testing.
 */
export class BloomFilter {
    private bits: Uint8Array;
    private size: number;
    private numHashes: number;

    /**
     * @param size Number of bits in the filter (e.g., 1000 * 100)
     * @param numHashes Number of hash functions to use (e.g., 5-7)
     */
    constructor(size: number = 100000, numHashes: number = 7) {
        this.size = size;
        this.numHashes = numHashes;
        this.bits = new Uint8Array(Math.ceil(size / 8));
    }

    /**
     * Adds an item to the filter.
     */
    add(item: string): void {
        const hashes = this.getHashes(item);
        hashes.forEach(hash => {
            const byteIndex = Math.floor(hash / 8);
            const bitIndex = hash % 8;
            this.bits[byteIndex] |= (1 << bitIndex);
        });
    }

    /**
     * Checks if an item might be in the filter.
     * Returns false if the item is definitely NOT in the filter.
     * Returns true if the item is MAYBE in the filter.
     */
    mightContain(item: string): boolean {
        const hashes = this.getHashes(item);
        for (const hash of hashes) {
            const byteIndex = Math.floor(hash / 8);
            const bitIndex = hash % 8;
            if (!(this.bits[byteIndex] & (1 << bitIndex))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Generates multiple hash values for an item using HMAC-SHA256 with different keys.
     */
    private getHashes(item: string): number[] {
        const hashes: number[] = [];
        for (let i = 0; i < this.numHashes; i++) {
            const hash = crypto
                .createHmac('sha256', `salt-${i}`)
                .update(item)
                .digest();
            
            // Use the first 4 bytes of the hash as a 32-bit integer
            const hashValue = hash.readUInt32BE(0) % this.size;
            hashes.push(hashValue);
        }
        return hashes;
    }
}
