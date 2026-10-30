export type HttpStatusError = Error & { statusCode: number };

export function httpError(statusCode: number, message: string): HttpStatusError {
  return Object.assign(new Error(message), { statusCode });
}
