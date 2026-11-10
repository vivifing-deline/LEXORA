import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Shared Subscription & Memory Leakage Management Service.
 * Provide at component level to automatically track and destroy subscriptions
 * when components are unmounted.
 */
@Injectable()
export class SubscriptionManagerService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly compositeSub = new Subscription();

  /**
   * RxJS pipeable operator that automatically unsubscribes on destroy.
   * Usage: this.api.get(...).pipe(this.subManager.untilDestroyed()).subscribe(...)
   */
  untilDestroyed<T>(): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>) => source.pipe(takeUntil(this.destroy$));
  }

  /**
   * Tracks one or more subscriptions to be canceled on destroy.
   * Usage: this.subManager.add(this.route.queryParams.subscribe(...))
   */
  add(...subs: (Subscription | undefined | null)[]): void {
    for (const sub of subs) {
      if (sub) {
        this.compositeSub.add(sub);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.compositeSub.unsubscribe();
  }
}
