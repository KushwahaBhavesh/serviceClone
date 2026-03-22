import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../utils/async-handler';
import * as uc from '../controllers/upload.controller';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), asyncHandler(uc.uploadFile as any));

export default router;
