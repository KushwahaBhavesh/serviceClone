import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    registerSchema,
    loginSchema,
    sendOtpSchema,
    verifyOtpSchema,
    socialLoginSchema,
    refreshTokenSchema,
    completeOnboardingSchema,
} from '../validators/auth.validators';
import * as authService from '../services/auth.service';

const router = Router();

// Async wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ─── PUBLIC ROUTES ───

// POST /api/v1/auth/register
router.post(
    '/register',
    validate(registerSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    }),
);

// POST /api/v1/auth/login
router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.login(req.body);
        res.json(result);
    }),
);

// POST /api/v1/auth/otp/send
router.post(
    '/otp/send',
    validate(sendOtpSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.sendOtp(req.body);
        res.json(result);
    }),
);

// POST /api/v1/auth/otp/verify
router.post(
    '/otp/verify',
    validate(verifyOtpSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.verifyOtp(req.body);
        res.json(result);
    }),
);

// POST /api/v1/auth/social/google
router.post(
    '/social/google',
    validate(socialLoginSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.googleLogin(req.body);
        res.json(result);
    }),
);

// POST /api/v1/auth/refresh
router.post(
    '/refresh',
    validate(refreshTokenSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.refreshTokens(req.body.refreshToken);
        res.json(result);
    }),
);

// ─── PROTECTED ROUTES ───

// DELETE /api/v1/auth/logout
router.delete(
    '/logout',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const result = await authService.logout(id);
        res.json(result);
    }),
);

// GET /api/v1/auth/me
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const result = await authService.getMe(id);
        res.json(result);
    }),
);

// PUT /api/v1/auth/onboarding
router.put(
    '/onboarding',
    authenticate,
    validate(completeOnboardingSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = (req as AuthenticatedRequest).user;
        const result = await authService.completeOnboarding(id, req.body);
        res.json(result);
    }),
);

export default router;
