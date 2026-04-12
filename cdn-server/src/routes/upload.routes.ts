import { Router } from 'express';
import { upload } from '../middleware/upload';
import { authenticateInternal } from '../middleware/auth';
import { uploadFile, uploadMultiple } from '../controllers/upload.controller';

const router = Router();

// Internal access only - enforced by authenticateInternal
router.post('/single', authenticateInternal, upload.single('file'), uploadFile);
router.post('/multiple', authenticateInternal, upload.array('files', 10), uploadMultiple);

export default router;
