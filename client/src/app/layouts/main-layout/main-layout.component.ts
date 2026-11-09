import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfigService } from '../../core/services/config.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';
import { FormsModule } from '@angular/forms';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  permission?: string;
  badge?: string | number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IconComponent,
    ModalComponent,
    ConfirmModalComponent,
    ToastContainerComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  readonly configService = inject(ConfigService);
  readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly isCollapsed = signal<boolean>(false);
  readonly isMobileOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);
  readonly isNotificationOpen = signal<boolean>(false);
  readonly isSearchModalOpen = signal<boolean>(false);
  readonly isResetModalOpen = signal<boolean>(false);
  readonly isResetting = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  currentUrl = signal<string>('/dashboard');

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Clients', route: '/clients', icon: 'users', permission: 'client.view' },
    { label: 'Cases', route: '/cases', icon: 'briefcase', permission: 'case.view' },
    { label: 'Hearings', route: '/hearings', icon: 'gavel', permission: 'hearing.view' },
    { label: 'Calendar', route: '/calendar', icon: 'calendar' },
    { label: 'Documents', route: '/documents', icon: 'file-text', permission: 'document.view' },
    { label: 'Legal Library', route: '/research', icon: 'book-open' },
    { label: 'Tasks', route: '/tasks', icon: 'check-square', permission: 'task.view' },
    { label: 'Finance', route: '/finance', icon: 'credit-card', permission: 'billing.view' },
    { label: 'Reports', route: '/reports', icon: 'bar-chart', permission: 'report.view' },
    { label: 'Team & Security', route: '/team', icon: 'shield', permission: 'user.manage' },
    { label: 'Settings', route: '/settings', icon: 'settings', permission: 'settings.manage' }
  ];

  // Demo accounts for quick demo switcher
  readonly demoAccounts = [
    { role: 'Firm Admin', email: 'admin@lexora.demo', name: 'Barrister Zafar Iqbal', icon: 'shield' },
    { role: 'Senior Advocate', email: 'senior@lexora.demo', name: 'Aitzaz Hussain', icon: 'scale' },
    { role: 'Associate Advocate', email: 'associate@lexora.demo', name: 'Mahnoor Rehman', icon: 'briefcase' },
    { role: 'Junior Advocate', email: 'junior@lexora.demo', name: 'Hamza Tariq', icon: 'briefcase' },
    { role: 'Legal Clerk', email: 'clerk@lexora.demo', name: 'Muhammad Rashid', icon: 'file-text' },
    { role: 'Accountant', email: 'accountant@lexora.demo', name: 'Fatima Bilal', icon: 'credit-card' },
    { role: 'Client Portal', email: 'client@lexora.demo', name: 'Kamran Siddiqui', icon: 'user' }
  ];

  readonly notifications = signal([
    {
      id: '1',
      title: 'Hearing Scheduled Tomorrow',
      message: 'Suit 412/2026 listed before Justice Tariq Mehmood at 09:30 AM',
      time: '10m ago',
      unread: true,
      icon: 'gavel'
    },
    {
      id: '2',
      title: 'Evidence Task Assigned',
      message: 'Prepare Affidavit-in-Evidence for Case LEX-2026-0001',
      time: '1h ago',
      unread: true,
      icon: 'check-square'
    },
    {
      id: '3',
      title: 'Payment Received',
      message: 'Rs. 300,000 received for INV-2026-0001 (Indus Retailers)',
      time: '2h ago',
      unread: false,
      icon: 'dollar-sign'
    }
  ]);

  unreadNotificationCount = computed(() => {
    return this.notifications().filter(n => n.unread).length;
  });

  breadcrumbs = computed(() => {
    const url = this.currentUrl();
    const segments = url.split('/').filter(Boolean);
    if (segments.length === 0) return ['Dashboard'];
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '));
  });

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
        this.isMobileOpen.set(false);
      });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggleSearchModal();
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-menu-container')) {
      this.isUserMenuOpen.set(false);
    }
    if (!target.closest('.notification-container')) {
      this.isNotificationOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.isCollapsed.update(val => !val);
  }

  toggleMobileNav(): void {
    this.isMobileOpen.update(val => !val);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(val => !val);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  toggleNotification(): void {
    this.isNotificationOpen.update(val => !val);
  }

  toggleSearchModal(): void {
    this.isSearchModalOpen.update(val => !val);
  }

  markAllNotificationsRead(): void {
    this.notifications.update(items => items.map(n => ({ ...n, unread: false })));
    this.toastService.info('All notifications marked as read');
  }

  switchDemoUser(email: string): void {
    this.authService.login({ email, password: 'Demo@123' }).subscribe({
      next: (res) => {
        this.isUserMenuOpen.set(false);
        this.toastService.success(`Switched role to: ${res.data.user.roles[0]}`);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.toastService.error('Failed to switch demo user');
      }
    });
  }

  confirmResetDemo(): void {
    this.isResetting.set(true);
    this.configService.resetDemoData().subscribe({
      next: () => {
        this.isResetting.set(false);
        this.isResetModalOpen.set(false);
        this.toastService.success('Demo dataset successfully restored to original presentation state');
        window.location.reload();
      },
      error: (err) => {
        this.isResetting.set(false);
        this.toastService.error(err.error?.message || 'Failed to reset demo data');
      }
    });
  }

  executeGlobalSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.isSearchModalOpen.set(false);
    this.router.navigate(['/cases'], { queryParams: { q } });
  }

  canAccess(item: NavItem): boolean {
    if (!item.permission) return true;
    return this.authService.hasPermission(item.permission);
  }
}
