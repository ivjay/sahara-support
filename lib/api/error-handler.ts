/**
 * API Error Handler Utility
 * Provides consistent error handling and responses across all API routes
 */

import { NextResponse } from 'next/server';

/**
 * Custom API Error class with HTTP status code
 */
export class ApiError extends Error {
    public statusCode: number;
    public details?: any;
    public code?: string;

    constructor(
        statusCode: number,
        message: string,
        details?: any,
        code?: string
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
        this.code = code;

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

/**
 * Common API error types
 */
export const ErrorTypes = {
    BAD_REQUEST: (message: string, details?: any) =>
        new ApiError(400, message, details, 'BAD_REQUEST'),

    UNAUTHORIZED: (message: string = 'Unauthorized') =>
        new ApiError(401, message, undefined, 'UNAUTHORIZED'),

    FORBIDDEN: (message: string = 'Forbidden') =>
        new ApiError(403, message, undefined, 'FORBIDDEN'),

    NOT_FOUND: (message: string, details?: any) =>
        new ApiError(404, message, details, 'NOT_FOUND'),

    CONFLICT: (message: string, details?: any) =>
        new ApiError(409, message, details, 'CONFLICT'),

    UNPROCESSABLE: (message: string, details?: any) =>
        new ApiError(422, message, details, 'UNPROCESSABLE_ENTITY'),

    INTERNAL_SERVER: (message: string = 'Internal server error', details?: any) =>
        new ApiError(500, message, details, 'INTERNAL_SERVER_ERROR'),

    SERVICE_UNAVAILABLE: (message: string, details?: any) =>
        new ApiError(503, message, details, 'SERVICE_UNAVAILABLE'),
};

/**
 * Error response body interface
 */
export interface ErrorResponse {
    error: string;
    code?: string;
    details?: any;
    timestamp: string;
    path?: string;
}

/**
 * Convert any error to NextResponse with proper format
 * @param error - Error object (ApiError, Error, or unknown)
 * @param path - Optional API path for logging
 * @returns NextResponse with formatted error
 */
export function handleApiError(
    error: unknown,
    path?: string
): NextResponse<ErrorResponse> {
    // Log error for debugging
    console.error('[API Error]', {
        path,
        error,
        stack: error instanceof Error ? error.stack : undefined
    });

    // Handle ApiError instances
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
                details: error.details,
                timestamp: new Date().toISOString(),
                path
            },
            { status: error.statusCode }
        );
    }

    // Handle generic Error instances
    if (error instanceof Error) {
        return NextResponse.json(
            {
                error: error.message,
                timestamp: new Date().toISOString(),
                path
            },
            { status: 500 }
        );
    }

    // Handle unknown errors
    return NextResponse.json(
        {
            error: 'An unexpected error occurred',
            details: String(error),
            timestamp: new Date().toISOString(),
            path
        },
        { status: 500 }
    );
}

/**
 * Wrap async API route handler with error handling
 * @param handler - Async handler function
 * @returns Wrapped handler with automatic error handling
 */
export function withErrorHandler<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
) {
    return async (...args: T): Promise<NextResponse> => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleApiError(error);
        }
    };
}

/**
 * Validate required fields in request body
 * Throws ApiError if validation fails
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @throws {ApiError} BAD_REQUEST if fields are missing
 */
export function validateRequiredFields(
    body: any,
    requiredFields: string[]
): void {
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
        throw ErrorTypes.BAD_REQUEST(
            'Missing required fields',
            { missingFields }
        );
    }
}

/**
 * Validate request parameters
 * Throws ApiError if validation fails
 * @param params - Parameters to validate
 * @param validations - Object mapping param names to validator functions
 * @throws {ApiError} BAD_REQUEST if validation fails
 */
export function validateParams(
    params: Record<string, any>,
    validations: Record<string, (value: any) => boolean | string>
): void {
    const errors: Record<string, string> = {};

    for (const [key, validator] of Object.entries(validations)) {
        const value = params[key];
        const result = validator(value);

        if (typeof result === 'string') {
            errors[key] = result;
        } else if (result === false) {
            errors[key] = `Invalid value for ${key}`;
        }
    }

    if (Object.keys(errors).length > 0) {
        throw ErrorTypes.BAD_REQUEST('Validation failed', { errors });
    }
}

/**
 * Common validators
 */
export const Validators = {
    isString: (value: any): boolean | string =>
        typeof value === 'string' || 'Must be a string',

    isNumber: (value: any): boolean | string =>
        typeof value === 'number' && !isNaN(value) || 'Must be a valid number',

    isBoolean: (value: any): boolean | string =>
        typeof value === 'boolean' || 'Must be a boolean',

    isArray: (value: any): boolean | string =>
        Array.isArray(value) || 'Must be an array',

    isEmail: (value: any): boolean | string =>
        typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Must be a valid email',

    isUUID: (value: any): boolean | string =>
        typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) || 'Must be a valid UUID',

    isDate: (value: any): boolean | string =>
        typeof value === 'string' && !isNaN(Date.parse(value)) || 'Must be a valid date',

    minLength: (min: number) => (value: any): boolean | string =>
        (typeof value === 'string' && value.length >= min) || `Must be at least ${min} characters`,

    maxLength: (max: number) => (value: any): boolean | string =>
        (typeof value === 'string' && value.length <= max) || `Must be at most ${max} characters`,

    min: (min: number) => (value: any): boolean | string =>
        (typeof value === 'number' && value >= min) || `Must be at least ${min}`,

    max: (max: number) => (value: any): boolean | string =>
        (typeof value === 'number' && value <= max) || `Must be at most ${max}`,

    oneOf: (allowed: any[]) => (value: any): boolean | string =>
        allowed.includes(value) || `Must be one of: ${allowed.join(', ')}`,

    matches: (pattern: RegExp) => (value: any): boolean | string =>
        (typeof value === 'string' && pattern.test(value)) || `Must match pattern: ${pattern}`,
};

/**
 * Handle Supabase errors consistently
 * @param error - Supabase error object
 * @param context - Context for logging (e.g., "Failed to fetch user")
 * @throws {ApiError} Appropriate error based on Supabase error
 */
export function handleSupabaseError(error: any, context: string): never {
    console.error(`[Supabase Error] ${context}:`, error);

    // Map common Supabase error codes to HTTP status codes
    const errorCode = error.code;
    const errorMessage = error.message || 'Database operation failed';

    switch (errorCode) {
        case '23505': // Unique violation
            throw ErrorTypes.CONFLICT('Resource already exists', { detail: error.detail });

        case '23503': // Foreign key violation
            throw ErrorTypes.BAD_REQUEST('Invalid reference', { detail: error.detail });

        case '23502': // Not null violation
            throw ErrorTypes.BAD_REQUEST('Required field missing', { detail: error.detail });

        case 'PGRST116': // Not found (PostgREST)
            throw ErrorTypes.NOT_FOUND('Resource not found');

        case 'PGRST301': // Invalid request (PostgREST)
            throw ErrorTypes.BAD_REQUEST(errorMessage);

        default:
            throw ErrorTypes.INTERNAL_SERVER(context, { code: errorCode, message: errorMessage });
    }
}

/**
 * Create success response with consistent format
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with formatted success
 */
export function createSuccessResponse<T>(
    data: T,
    message?: string,
    status: number = 200
): NextResponse {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        },
        { status }
    );
}

/**
 * Async operation wrapper with retry logic
 * @param operation - Async operation to retry
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param delayMs - Delay between retries in ms (default: 1000)
 * @returns Operation result
 * @throws Error after max retries exceeded
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries) {
                console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
            }
        }
    }

    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError?.message}`);
}
