import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All AI assistant routes require authentication
router.use(authenticate);

router.post('/chat', aiController.chat);

export default router;
