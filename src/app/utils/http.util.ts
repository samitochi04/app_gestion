import { HttpParams } from '@angular/common/http';
import { map, OperatorFunction } from 'rxjs';
import { ApiResponse } from '../models/user.model';

type ApiErrorDetails = {
  code?: string;
  message?: string;
};

export function unwrapData<T>(): OperatorFunction<ApiResponse<T>, T> {
  return map((response) => response.data);
}

export function buildParams(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }

  return params;
}

export function extractApiErrorDetails(error: unknown): ApiErrorDetails | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'error' in error.error &&
    typeof error.error.error === 'object' &&
    error.error.error !== null
  ) {
    const nestedError = error.error.error as Record<string, unknown>;

    return {
      code: typeof nestedError['code'] === 'string' ? nestedError['code'] : undefined,
      message: typeof nestedError['message'] === 'string' ? nestedError['message'] : undefined
    };
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null
  ) {
    const rootError = error.error as Record<string, unknown>;

    return {
      code: typeof rootError['code'] === 'string' ? rootError['code'] : undefined,
      message: typeof rootError['message'] === 'string' ? rootError['message'] : undefined
    };
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const details = extractApiErrorDetails(error);

  if (details?.code && details.message) {
    return `${details.code}: ${details.message}`;
  }

  if (details?.message) {
    return details.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'string' &&
    error.error.trim().length > 0
  ) {
    return error.error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'message' in error.error &&
    typeof error.error.message === 'string'
  ) {
    return error.error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'error' in error.error &&
    typeof error.error.error === 'object' &&
    error.error.error !== null &&
    'message' in error.error.error &&
    typeof error.error.error.message === 'string'
  ) {
    return error.error.error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 403
  ) {
    return 'Acces refuse. Votre compte ne dispose pas des permissions necessaires pour ce module.';
  }

  return fallback;
}