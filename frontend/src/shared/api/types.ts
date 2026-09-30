export type QueryParamValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryParamValue>;

export interface RequestConfig extends Omit<RequestInit, 'body' | 'method' | 'headers'> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  headers?: Record<string, string>;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
}

export type RequestInterceptor = (
  init: RequestInit,
  url: string,
  config: RequestConfig,
) => RequestInit | Promise<RequestInit>;

export type UnauthorizedHandler = () => Promise<string | null>;

export interface ApiErrorPayload {
  message?: string;
  detail?: string;
  code?: string;
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
