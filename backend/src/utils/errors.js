/** Small error type that the Express error handler turns into a JSON response. */
class ApiError extends Error {
  constructor(message, status = 400, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const badRequest = (message, details) => new ApiError(message, 400, details);
const unauthorized = (message = 'Authentication required.') => new ApiError(message, 401);
const forbidden = (message = 'You do not have access to this resource.') => new ApiError(message, 403);
const notFound = (message = 'Resource not found.') => new ApiError(message, 404);
const conflict = (message = 'Resource already exists.') => new ApiError(message, 409);

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, conflict };
