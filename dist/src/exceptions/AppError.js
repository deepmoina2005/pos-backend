export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ResourceNotFoundError extends AppError {
    constructor(resource, identifier) {
        super(`${resource} not found with identifier: ${identifier}`, 404);
    }
}
export class UserException extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
export class AccessDeniedException extends AppError {
    constructor(message = "Unauthorized access") {
        super(message, 403);
    }
}
export class DataIntegrityViolationException extends AppError {
    constructor(message = "Data integrity violation") {
        super(message, 409);
    }
}
