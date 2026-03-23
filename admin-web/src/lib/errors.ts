// Custom error classes for Next.js API Routes

export class HttpError extends Error {
    statusCode: number;
    errors?: string[];

    constructor(statusCode: number, message: string, errors?: string[]) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'HttpError';
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string) { super(400, message); }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string) { super(401, message); }
}

export class ForbiddenError extends HttpError {
    constructor(message: string) { super(403, message); }
}

export class ConflictError extends HttpError {
    constructor(message: string) { super(409, message); }
}
