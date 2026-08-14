export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public path?: string; // optional

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
    path?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.path = path;
    Error.captureStackTrace(this);
  }
}
