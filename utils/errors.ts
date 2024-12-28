export class APIError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

export function handleError(error: unknown) {
  if (error instanceof APIError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({ error: 'An unexpected error occurred' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
