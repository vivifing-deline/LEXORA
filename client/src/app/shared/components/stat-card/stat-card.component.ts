import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="stat-card" [class.clickable]="clickable">
      <div class="stat-top">
        <span class="stat-label">{{ label }}</span>
        @if (icon) {
          <div class="stat-icon-badge" [style.background]="iconBg || 'var(--primary-light)'">
            <app-icon [name]="icon" [size]="18" [color]="iconColor || 'var(--primary)'"></app-icon>
          </div>
        }
      </div>

      <div class="stat-main">
        <div class="stat-value">{{ value }}</div>
        @if (trend) {
          <div class="stat-trend" [ngClass]="trend.isPositive ? 'trend-up' : 'trend-down'">
            <app-icon [name]="trend.isPositive ? 'trending-up' : 'trending-down'" [size]="14"></app-icon>
            <span>{{ trend.text }}</span>
          </div>
        }
      </div>

      @if (subtext) {
        <div class="stat-subtext">{{ subtext }}</div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .stat-card.clickable:hover {
      cursor: pointer;
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .stat-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .stat-icon-badge {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-main {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 12px;
      font-weight: 600;
    }
    .trend-up { color: var(--success); }
    .trend-down { color: var(--danger); }
    .stat-subtext {
      font-size: 12px;
      color: var(--text-muted);
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon?: string;
  @Input() iconBg?: string;
  @Input() iconColor?: string;
  @Input() trend?: { text: string; isPositive: boolean };
  @Input() subtext?: string;
  @Input() clickable: boolean = false;
}

