import { Request, Response } from 'express';
import { optimizeImage } from '../services/image.service';
import { CONFIG } from '../config';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Process image (optimization & WebP conversion)
        const optimizedFilename = await optimizeImage(file.filename);

        // Return relative path as requested
        const relativePath = `${CONFIG.RELATIVE_UPLOAD_PATH}/${optimizedFilename}`;

        return res.status(200).json({
            success: true,
            data: {
                url: relativePath,
                filename: optimizedFilename,
                format: 'webp'
            },
            message: 'File uploaded and optimized successfully'
        });
    } catch (err: any) {
        console.error('Upload Controller Error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error during upload'
        });
    }
};

export const uploadMultiple = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const results = await Promise.all(
            files.map(async (file) => {
                const optimizedFilename = await optimizeImage(file.filename);
                return {
                    url: `${CONFIG.RELATIVE_UPLOAD_PATH}/${optimizedFilename}`,
                    filename: optimizedFilename,
                    format: 'webp'
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: results,
            message: `${files.length} files uploaded and optimized successfully`
        });
    } catch (err: any) {
        console.error('Multiple Upload Controller Error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Internal server error during multiple upload'
        });
    }
};
