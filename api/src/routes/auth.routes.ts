import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    registerSchema,
    loginSchema,
    sendOtpSchema,
    verifyOtpSchema,
    socialLoginSchema,
    refreshTokenSchema,
    completeOnboardingSchema,
    updateLocationSchema,
    updateProfileSchema,
} from '../validators/auth.validators';
import { asyncHandler } from '../utils/async-handler';
import * as authController from '../controllers/auth.controller';

const router = Router();

// ─── PUBLIC ROUTES ───
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/otp/send', validate(sendOtpSchema), asyncHandler(authController.sendOtp));
router.post('/otp/verify', validate(verifyOtpSchema), asyncHandler(authController.verifyOtp));
router.post('/social/google', validate(socialLoginSchema), asyncHandler(authController.googleLogin));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshTokens));
router.post('/check-phone', asyncHandler(authController.checkPhone));

// ─── PROTECTED ROUTES ───
router.delete('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/onboarding', authenticate, validate(completeOnboardingSchema), asyncHandler(authController.completeOnboarding));
router.put('/location', authenticate, validate(updateLocationSchema), asyncHandler(authController.updateLocation));
router.put('/profile', authenticate, validate(updateProfileSchema), asyncHandler(authController.updateProfile));

export default router;
