export class APIError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends APIError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'AuthorizationError';
  }
}
