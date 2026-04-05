export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} not found with identifier: ${identifier}`, 404);
  }
}

export class UserException extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AccessDeniedException extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 403);
  }
}

export class DataIntegrityViolationException extends AppError {
  constructor(message: string = "Data integrity violation") {
    super(message, 409);
  }
}
