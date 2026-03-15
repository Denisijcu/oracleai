import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GraphqlService } from '../../services/graphql.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex" style="background: var(--ivory)">

      <!-- Left panel - branding -->
      <div class="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
           style="background: var(--charcoal)">

        <!-- Geometric background -->
        <div class="absolute inset-0 opacity-5" style="
          background-image: repeating-linear-gradient(
            45deg, #c9a84c 0px, #c9a84c 1px, transparent 0, transparent 50%
          );
          background-size: 40px 40px;">
        </div>

        <!-- Top -->
        <div class="relative">
          <div class="flex items-center gap-3 mb-16">
            <div class="w-8 h-8 border-2 flex items-center justify-center" style="border-color: var(--gold)">
              <div class="w-3 h-3" style="background: var(--gold)"></div>
            </div>
            <span style="font-family:'DM Mono',monospace; font-size:11px; color:var(--gold); letter-spacing:3px">
              ORACLEAI
            </span>
          </div>

          <h1 style="font-family:'Playfair Display',serif; font-size:52px; font-weight:700; color:var(--ivory); line-height:1.1; margin-bottom:20px">
            Enterprise<br>
            <span style="color:var(--gold)">Intelligence</span><br>
            Platform
          </h1>

          <p style="color: #6a6a80; font-size:15px; line-height:1.7; max-width:340px">
            AI-powered decision engine for Fortune 500 enterprises.
            Trusted by 240+ organizations worldwide.
          </p>
        </div>

        <!-- Stats -->
        <div class="relative grid grid-cols-3 gap-6">
          <div *ngFor="let s of stats">
            <div style="font-family:'Playfair Display',serif; font-size:28px; color:var(--gold); font-weight:700">
              {{s.value}}
            </div>
            <div style="font-family:'DM Mono',monospace; font-size:9px; color:#4a4a5e; letter-spacing:2px; margin-top:4px">
              {{s.label}}
            </div>
          </div>
        </div>

        <!-- Version badge -->
        <div class="absolute bottom-8 right-8" style="font-family:'DM Mono',monospace; font-size:9px; color:#333340; letter-spacing:2px">
          v2.4.1 · ENTERPRISE
        </div>
      </div>

      <!-- Right panel - form -->
      <div class="flex-1 flex items-center justify-center p-8">
        <div class="w-full max-w-sm animate-in">

          <!-- Mobile logo -->
          <div class="lg:hidden mb-10 text-center">
            <div style="font-family:'Playfair Display',serif; font-size:28px; color:var(--charcoal)">OracleAI</div>
          </div>

          <!-- Heading -->
          <div class="mb-10">
            <h2 style="font-family:'Playfair Display',serif; font-size:32px; color:var(--charcoal); margin-bottom:8px">
              Sign in
            </h2>
            <p style="color:var(--mist); font-size:14px">
              Access your enterprise decision platform
            </p>
          </div>

          <!-- Form -->
          <div class="space-y-5">
            <div>
              <label class="oracle-label">Username</label>
              <input class="oracle-input" type="text"
                     placeholder="analyst1" [(ngModel)]="username"
                     (keyup.enter)="login()" />
            </div>
            <div>
              <label class="oracle-label">Password</label>
              <input class="oracle-input" type="password"
                     placeholder="••••••••••••" [(ngModel)]="password"
                     (keyup.enter)="login()" />
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="error" class="mt-4 p-3 text-sm"
               style="background:rgba(192,57,43,0.06); border:1px solid rgba(192,57,43,0.2); color:var(--red-err); font-size:13px">
            {{ error }}
          </div>

          <button class="oracle-btn oracle-btn-primary w-full mt-8"
                  (click)="login()" [disabled]="loading">
            {{ loading ? 'Authenticating...' : 'Sign in to OracleAI' }}
          </button>

          <!-- Demo hint -->
          <div class="mt-8 p-4" style="background:var(--cream); border:1px solid var(--border)">
            <p class="oracle-label mb-2">DEMO CREDENTIALS</p>
            <p style="font-family:'DM Mono',monospace; font-size:11px; color:var(--slate)">
              analyst1 / analyst2026!
            </p>
          </div>

          <!-- Footer -->
          <p class="mt-8 text-center" style="font-family:'DM Mono',monospace; font-size:9px; color:var(--mist); letter-spacing:2px">
            ORACLEAI ENTERPRISE · CONFIDENTIAL
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  username = ''; password = ''; loading = false; error = '';

  stats = [
    { value: '240+', label: 'ENTERPRISES' },
    { value: '99.9%', label: 'UPTIME SLA' },
    { value: '$2.4B', label: 'DECISIONS/YR' },
  ];

  constructor(private gql: GraphqlService, private router: Router) {}

  login() {
    if (!this.username || !this.password) { this.error = 'Credentials required'; return; }
    this.loading = true; this.error = '';
    this.gql.login(this.username, this.password).subscribe({
      next: (res: any) => {
        const data = res.data?.login;
        if (!data) { this.error = 'Invalid credentials'; this.loading = false; return; }
        localStorage.setItem('oracle_token', data.token);
        localStorage.setItem('oracle_user', JSON.stringify(data.user));
        this.router.navigate(['/dashboard']);
      },
      error: () => { this.error = 'Authentication failed'; this.loading = false; }
    });
  }
}
