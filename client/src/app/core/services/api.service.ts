import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

export interface ApiRequestOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorMessage?: string;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Resolves a relative or full endpoint to the complete target URL.
   */
  public getAbsoluteUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  }

  /**
   * Converts a key-value object into strongly typed HttpParams, ignoring undefined or empty values.
   */
  public buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }

  /**
   * Centralized HTTP GET
   */
  public get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: ApiRequestOptions
  ): Observable<T> {
    const url = this.getAbsoluteUrl(endpoint);
    const httpParams = this.buildParams(params);

    return this.http.get<T>(url, { params: httpParams, headers: options?.headers }).pipe(
      tap((res: any) => this.handleSuccessToast(res, options)),
      catchError((err: HttpErrorResponse) => this.handleError(err, options))
    );
  }

  /**
   * Centralized HTTP POST
   */
  public post<T>(
    endpoint: string,
    body?: any,
    options?: ApiRequestOptions
  ): Observable<T> {
    const url = this.getAbsoluteUrl(endpoint);

    return this.http.post<T>(url, body, { headers: options?.headers }).pipe(
      tap((res: any) => this.handleSuccessToast(res, options)),
      catchError((err: HttpErrorResponse) => this.handleError(err, options))
    );
  }

  /**
   * Centralized HTTP PUT
   */
  public put<T>(
    endpoint: string,
    body?: any,
    options?: ApiRequestOptions
  ): Observable<T> {
    const url = this.getAbsoluteUrl(endpoint);

    return this.http.put<T>(url, body, { headers: options?.headers }).pipe(
      tap((res: any) => this.handleSuccessToast(res, options)),
      catchError((err: HttpErrorResponse) => this.handleError(err, options))
    );
  }

  /**
   * Centralized HTTP PATCH
   */
  public patch<T>(
    endpoint: string,
    body?: any,
    options?: ApiRequestOptions
  ): Observable<T> {
    const url = this.getAbsoluteUrl(endpoint);

    return this.http.patch<T>(url, body, { headers: options?.headers }).pipe(
      tap((res: any) => this.handleSuccessToast(res, options)),
      catchError((err: HttpErrorResponse) => this.handleError(err, options))
    );
  }

  /**
   * Centralized HTTP DELETE
   */
  public delete<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Observable<T> {
    const url = this.getAbsoluteUrl(endpoint);

    return this.http.delete<T>(url, { headers: options?.headers }).pipe(
      tap((res: any) => this.handleSuccessToast(res, options)),
      catchError((err: HttpErrorResponse) => this.handleError(err, options))
    );
  }

  private handleSuccessToast(res: any, options?: ApiRequestOptions): void {
    if (options?.successMessage) {
      this.toastService.success(options.successMessage);
    } else if (options?.showSuccessToast && res?.message) {
      this.toastService.success(res.message);
    }
  }

  private getFriendlyErrorMessage(error: HttpErrorResponse, customMessage?: string): string {
    if (customMessage) {
      return customMessage;
    }

    // Network / Offline / Unreachable
    if (!error.status || error.status === 0) {
      return 'Unable to connect to the server. Please check your network connection or verify that the service is online.';
    }

    // 401 Unauthorized
    if (error.status === 401) {
      return 'Your session has expired. Please sign in again to continue.';
    }

    // 403 Forbidden
    if (error.status === 403) {
      return 'You do not have administrative permission to perform this action.';
    }

    // 404 Not Found
    if (error.status === 404) {
      const raw = error.error?.message;
      if (typeof raw === 'string' && !raw.includes('Route not found') && !raw.includes('/api/v1') && !raw.includes('GET ') && !raw.includes('POST ') && !raw.includes('PUT ') && !raw.includes('DELETE ') && raw.length < 80) {
        return raw;
      }
      return 'The requested record or resource was not found.';
    }

    // 409 Conflict
    if (error.status === 409) {
      const raw = error.error?.message;
      if (typeof raw === 'string' && !raw.includes('constraint') && !raw.includes('prisma') && !raw.includes('db') && raw.length < 100) {
        return raw;
      }
      return 'A record with these unique details or reference number already exists.';
    }

    // Server-side errors (500, 502, 503, 504)
    if (error.status >= 500) {
      return 'The server encountered an issue processing your request. Please try again shortly or contact your system administrator.';
    }

    // Client validation errors (400, 422)
    const raw = error.error?.message || error.error?.error;
    if (typeof raw === 'string' && raw.length > 0) {
      const isTechnical = /prisma|sql|foreign key|constraint|column|syntax error|undefined|null pointer|object object|route not found|internal server|stack/i.test(raw);
      if (!isTechnical && raw.length < 150) {
        return raw;
      }
    }

    return 'Unable to process your request. Please check the entered information and try again.';
  }

  private handleError(error: HttpErrorResponse, options?: ApiRequestOptions): Observable<never> {
    const userMessage = this.getFriendlyErrorMessage(error, options?.errorMessage);

    if (options?.showErrorToast !== false) {
      this.toastService.error(userMessage);
    }

    return throwError(() => error);
  }
}

