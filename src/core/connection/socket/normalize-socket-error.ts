const UNKNOWN_SOCKET_ERROR = "Unknown socket error";

export function normalizeSocketError(error: unknown): string {
  if (typeof error === "string" && error.length > 0) return error;

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message;
  }

  return UNKNOWN_SOCKET_ERROR;
}
