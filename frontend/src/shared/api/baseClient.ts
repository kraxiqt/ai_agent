import { env } from '@/shared/config/env';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '@/shared/config/constants';
import { parseErrorResponse, toApiError } from './errorHandler';
import type { QueryParams, RequestConfig, RequestInterceptor, UnauthorizedHandler } from './types';

const interceptors: RequestInterceptor[] = [];
let unauthorizedHandler: UnauthorizedHandler | null = null;

//Возвращает функцию отписки.
export function addRequestInterceptor(interceptor: RequestInterceptor): () => void {
  interceptors.push(interceptor);
  return () => {
    const index = interceptors.indexOf(interceptor);
    if (index !== -1) interceptors.splice(index, 1);
  };
}

//Регистрирует обработчик 401-ответов
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function buildUrl(path: string, params?: QueryParams): string {
  const base = /^https?:\/\//.test(path) ? path : `${env.API_URL}/${path.replace(/^\//, '')}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.append(key, String(value));
  }
  const query = search.toString();
  if (!query) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${query}`;
}

async function performRequest<T>(path: string, config: RequestConfig, isRetry: boolean): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    headers,
    signal,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    skipAuthRefresh = false,
    ...rest
  } = config;

  const url = buildUrl(path, params);
  const controller = new AbortController();

  const onExternalAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener('abort', onExternalAbort, { once: true });

  const timer =
    timeoutMs > 0
      ? setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs)
      : undefined;

  const isRawBody = body instanceof FormData || typeof body === 'string';

  let init: RequestInit = {
    credentials: 'include',
    ...rest,
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !isRawBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body:
      body === undefined ? undefined : isRawBody ? (body as BodyInit) : JSON.stringify(body),
    signal: controller.signal,
  };

  try {
    for (const interceptor of interceptors) init = await interceptor(init, url, config);

    const res = await fetch(url, init);

    if (!res.ok) {
      if (res.status === 401 && !isRetry && !skipAuthRefresh && unauthorizedHandler) {
        const newToken = await unauthorizedHandler();
        if (newToken) return performRequest<T>(path, config, true);
      }
      throw await parseErrorResponse(res);
    }
    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get('content-type') ?? '';
    return (contentType.includes('application/json') ? await res.json() : await res.text()) as T;
  } catch (error) {
    throw toApiError(error);
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

export function request<T = unknown>(path: string, config: RequestConfig = {}): Promise<T> {
  return performRequest<T>(path, config, false);
}

type BodylessConfig = Omit<RequestConfig, 'method' | 'body'>;
type BodyConfig = Omit<RequestConfig, 'method' | 'body'>;

export const apiClient = {
  get: <T>(path: string, config?: BodylessConfig) => request<T>(path, { ...config, method: 'GET' }),
  post: <T>(path: string, body?: unknown, config?: BodyConfig) =>
    request<T>(path, { ...config, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, config?: BodyConfig) =>
    request<T>(path, { ...config, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, config?: BodyConfig) =>
    request<T>(path, { ...config, method: 'PATCH', body }),
  delete: <T>(path: string, config?: BodylessConfig) =>
    request<T>(path, { ...config, method: 'DELETE' }),
};
