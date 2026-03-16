import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), (req: Request, res: Response) => {
    try {
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            fileUrl,
            filename: file.filename,
            size: file.size
        });
    } catch (error) {
        logger.error('Upload error: %O', error);
        res.status(500).json({ message: 'Internal server error during upload' });
    }
});

export default router;
