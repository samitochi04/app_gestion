/**
 * Global response envelope used by EVERY backend endpoint (test-backend.md).
 * Business errors are wrapped inside a 200 OK, so always assert on `success`.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorDetails | null;
  timestamp: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
}

/** Spring `Page<T>` shape returned by list endpoints. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

/** Standard pagination query params for list endpoints. */
export interface PageQuery {
  page?: number;   // 0-indexed
  size?: number;   // default 20
  [key: string]: string | number | boolean | undefined;
}

/** Empty page factory — handy for loading/empty states. */
export function emptyPage<T>(size = 20): PageResponse<T> {
  return { content: [], totalElements: 0, totalPages: 0, page: 0, size, first: true, last: true };
}
