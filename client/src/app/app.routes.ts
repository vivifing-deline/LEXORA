import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent),
        data: { permission: 'client.view' }
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./features/clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent),
        data: { permission: 'client.view' }
      },
      {
        path: 'cases',
        loadComponent: () => import('./features/cases/cases.component').then(m => m.CasesComponent),
        data: { permission: 'case.view' }
      },
      {
        path: 'cases/:id',
        loadComponent: () => import('./features/cases/case-detail/case-detail.component').then(m => m.CaseDetailComponent),
        data: { permission: 'case.view' }
      },
      {
        path: 'hearings',
        loadComponent: () => import('./features/hearings/hearings.component').then(m => m.HearingsComponent),
        data: { permission: 'hearing.view' }
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
        data: { permission: 'document.view' }
      },
      {
        path: 'research',
        loadComponent: () => import('./features/research/research.component').then(m => m.ResearchComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent),
        data: { permission: 'task.view' }
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance.component').then(m => m.FinanceComponent),
        data: { permission: 'billing.view' }
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        data: { permission: 'report.view' }
      },
      {
        path: 'team',
        loadComponent: () => import('./features/team/team.component').then(m => m.TeamComponent),
        data: { permission: 'user.manage' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        data: { permission: 'settings.manage' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
