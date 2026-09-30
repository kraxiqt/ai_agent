import type { ApiErrorPayload } from './types';

export type ApiErrorCode = 'HTTP_ERROR' | 'NETWORK_ERROR' | 'ABORTED' | 'TIMEOUT' | 'UNKNOWN';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { status?: number; code?: ApiErrorCode | string; details?: unknown } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? 'UNKNOWN';
    this.details = options.details;
  }
}

//остановить запрос
export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof ApiError && error.code === 'ABORTED')
  );
}

//Превращает неуспешный Response в ApiError.
export async function parseErrorResponse(res: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | undefined;
  try {
    payload = (await res.json()) as ApiErrorPayload;
  } catch {
    //тело в statusText
  }
  const message = payload?.message ?? payload?.detail ?? res.statusText ?? 'Ошибка запроса';
  return new ApiError(message || `Ошибка ${res.status}`, {
    status: res.status,
    code: payload?.code ?? 'HTTP_ERROR',
    details: payload?.errors ?? payload,
  });
}

//приводит любую ошибку fetch к ApiError
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new ApiError('Сервер не ответил вовремя', { code: 'TIMEOUT' });
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError('Запрос отменён', { code: 'ABORTED' });
  }
  if (error instanceof TypeError) {
    return new ApiError('Нет соединения с сервером', { code: 'NETWORK_ERROR' });
  }
  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError('Неизвестная ошибка');
}

//текст ошибки для пользователя
export function getErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
