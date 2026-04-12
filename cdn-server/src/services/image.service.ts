import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import { UPLOAD_PATH } from '../config';

export const optimizeImage = async (filename: string): Promise<string> => {
    const originalPath = path.join(UPLOAD_PATH, filename);
    const outputFilename = path.parse(filename).name + '.webp';
    const outputPath = path.join(UPLOAD_PATH, outputFilename);

    // Keep existing directory structure if any
    await fs.ensureDir(path.dirname(outputPath));

    // Sharp optimization
    await sharp(originalPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

    // Cleanup: Remove original temporary file immediately after processing
    try {
        if (originalPath !== outputPath) {
            await fs.remove(originalPath);
        }
    } catch (err) {
        console.error(`Failed to cleanup temporary file: ${originalPath}`, err);
    }

    return outputFilename;
};
