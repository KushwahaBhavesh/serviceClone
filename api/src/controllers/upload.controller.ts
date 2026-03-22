import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../middleware/error-handler';
import logger from '../utils/logger';

export function uploadFile(req: Request, res: Response) {
    const file = (req as any).file;
    if (!file) throw new BadRequestError('No file uploaded');

    const fileUrl = `/uploads/${file.filename}`;
    sendSuccess(res, { fileUrl, filename: file.filename, size: file.size }, 'File uploaded successfully');
}
