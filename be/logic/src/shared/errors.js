class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

function toAppError(error, fallbackCode, fallbackMessage, details = {}) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    fallbackCode,
    error?.message || fallbackMessage,
    {
      ...details,
      cause: error?.message || String(error),
    },
  );
}

module.exports = {
  AppError,
  toAppError,
};
