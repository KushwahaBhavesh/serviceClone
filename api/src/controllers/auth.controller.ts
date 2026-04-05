import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import * as authService from '../services/auth.service';
import { bloomService } from '../services/bloom.service';

export async function checkPhone(req: Request, res: Response) {
    const { phone } = req.body;
    const exists = bloomService.checkPhone(phone);
    sendSuccess(res, { exists }, 'Phone check completed');
}

export async function register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    sendCreated(res, result, 'Registration successful');
}

export async function login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
}

export async function sendOtp(req: Request, res: Response) {
    const result = await authService.sendOtp(req.body);
    sendSuccess(res, result);
}

export async function verifyOtp(req: Request, res: Response) {
    const result = await authService.verifyOtp(req.body);
    sendSuccess(res, result, 'OTP verified');
}

export async function googleLogin(req: Request, res: Response) {
    const result = await authService.googleLogin(req.body);
    sendSuccess(res, result, 'Google login successful');
}

export async function refreshTokens(req: Request, res: Response) {
    const result = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, result, 'Tokens refreshed');
}

export async function logout(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await authService.logout(id);
    sendSuccess(res, result, 'Logged out successfully');
}

export async function getMe(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await authService.getMe(id);
    sendSuccess(res, result);
}

export async function completeOnboarding(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await authService.completeOnboarding(id, req.body);
    sendSuccess(res, result, 'Onboarding completed');
}

export async function updateLocation(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await authService.updateLocation(id, req.body);
    sendSuccess(res, result, 'Location updated');
}

export async function updateProfile(req: Request, res: Response) {
    const { id } = (req as AuthenticatedRequest).user;
    const result = await authService.updateProfile(id, req.body);
    sendSuccess(res, result, 'Profile updated');
}
