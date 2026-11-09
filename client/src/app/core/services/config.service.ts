import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints.constant';

export interface SafeConfig {
  appMode: 'demo' | 'normal';
  demoMode: boolean;
  demoResetEnabled: boolean;
  version: string;
  environment: string;
}

export interface SetupStatus {
  isSetupRequired: boolean;
  userCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly api = inject(ApiService);

  readonly config = signal<SafeConfig>({
    appMode: 'normal',
    demoMode: false,
    demoResetEnabled: false,
    version: '1.0.0',
    environment: 'production'
  });

  readonly isSetupRequired = signal<boolean>(false);

  readonly isDemoMode = computed(() => this.config().demoMode);
  readonly isDemoResetEnabled = computed(() => this.config().demoResetEnabled);
  readonly appMode = computed(() => this.config().appMode);

  constructor() {
    this.loadConfig();
  }

  loadConfig(): void {
    this.api.get<{ success: boolean; data: SafeConfig }>(API_ENDPOINTS.SYSTEM.CONFIG, undefined, { showErrorToast: false }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.config.set(res.data);
        }
      }),
      catchError(() => of(null))
    ).subscribe();

    this.api.get<{ success: boolean; data: SetupStatus }>(API_ENDPOINTS.AUTH.SETUP_STATUS, undefined, { showErrorToast: false }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.isSetupRequired.set(res.data.isSetupRequired);
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  resetDemoData(): Observable<any> {
    return this.api.post<any>(API_ENDPOINTS.SYSTEM.DEMO_RESET, {});
  }
}
