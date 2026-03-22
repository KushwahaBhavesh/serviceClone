import { Response } from 'express';

interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message: string;
}

export function sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
): void {
    const response: ApiResponse<T> = { success: true, data, message };
    res.status(statusCode).json(response);
}

export function sendCreated<T>(
    res: Response,
    data: T,
    message = 'Created successfully',
): void {
    sendSuccess(res, data, message, 201);
}
