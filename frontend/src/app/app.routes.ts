import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DecisionsComponent } from './pages/decisions/decisions.component';

export const routes: Routes = [
  { path: '',          redirectTo: '/login', pathMatch: 'full' },
  { path: 'login',     component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'decisions', component: DecisionsComponent },
  { path: '**',        redirectTo: '/login' },
];
