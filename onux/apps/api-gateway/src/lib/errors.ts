/**
 * Custom error classes for the API Gateway
 * Provides structured error handling with appropriate HTTP status codes
 */

export class ApiGatewayError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(options: {
    message: string;
    statusCode: number;
    code: string;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiGatewayError {
  constructor(message = 'Bad request', details?: Record<string, unknown>) {
    super({ message, statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ApiGatewayError {
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super({ message, statusCode: 401, code: 'UNAUTHORIZED', details });
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiGatewayError {
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super({ message, statusCode: 403, code: 'FORBIDDEN', details });
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiGatewayError {
  constructor(message = 'Resource not found', details?: Record<string, unknown>) {
    super({ message, statusCode: 404, code: 'NOT_FOUND', details });
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ApiGatewayError {
  constructor(message = 'Resource conflict', details?: Record<string, unknown>) {
    super({ message, statusCode: 409, code: 'CONFLICT', details });
  }
}

/**
 * 422 Unprocessable Entity
 */
export class ValidationError extends ApiGatewayError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super({ message, statusCode: 422, code: 'VALIDATION_ERROR', details });
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends ApiGatewayError {
  constructor(message = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super({ message, statusCode: 429, code: 'RATE_LIMIT_EXCEEDED', details });
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends ApiGatewayError {
  constructor(message = 'Internal server error', details?: Record<string, unknown>) {
    super({ message, statusCode: 500, code: 'INTERNAL_ERROR', details });
  }
}

/**
 * 502 Bad Gateway
 */
export class BadGatewayError extends ApiGatewayError {
  constructor(message = 'Bad gateway', details?: Record<string, unknown>) {
    super({ message, statusCode: 502, code: 'BAD_GATEWAY', details });
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends ApiGatewayError {
  constructor(message = 'Service unavailable', details?: Record<string, unknown>) {
    super({ message, statusCode: 503, code: 'SERVICE_UNAVAILABLE', details });
  }
}
