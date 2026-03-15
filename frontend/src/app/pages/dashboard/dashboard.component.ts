import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GraphqlService } from '../../services/graphql.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen" style="background: var(--cream)">

      <!-- Navbar -->
      <nav style="background:white; border-bottom:1px solid var(--border)">
        <div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 border-2 flex items-center justify-center" style="border-color:var(--gold)">
                <div class="w-2 h-2" style="background:var(--gold)"></div>
              </div>
              <span style="font-family:'Playfair Display',serif; font-size:18px; color:var(--charcoal); font-weight:600">
                OracleAI
              </span>
            </div>
            <div class="hidden md:flex items-center gap-6 text-sm">
              <a routerLink="/dashboard" style="color:var(--charcoal); font-weight:500; border-bottom:2px solid var(--gold); padding-bottom:2px">Overview</a>
              <a routerLink="/decisions" style="color:var(--mist)">Decisions</a>
              <span style="color:var(--mist); cursor:default">Analytics</span>
              <span style="color:var(--mist); cursor:default">Reports</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="status-dot online"></div>
              <span style="font-family:'DM Mono',monospace; font-size:10px; color:var(--mist); letter-spacing:1px">
                {{systemInfo?.version || 'OracleAI v2.4.1'}}
              </span>
            </div>
            <div class="w-px h-4" style="background:var(--border)"></div>
            <span style="font-size:13px; color:var(--slate)">{{username}}</span>
            <button (click)="logout()" style="font-family:'DM Mono',monospace; font-size:10px; color:var(--mist); letter-spacing:1px; background:none; border:none; cursor:pointer">
              SIGN OUT
            </button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-8 py-10">

        <!-- Page header -->
        <div class="mb-10 animate-in">
          <p style="font-family:'DM Mono',monospace; font-size:10px; color:var(--gold); letter-spacing:3px; margin-bottom:8px">
            ENTERPRISE INTELLIGENCE
          </p>
          <h1 style="font-family:'Playfair Display',serif; font-size:36px; color:var(--charcoal)">
            Decision Overview
          </h1>
        </div>

        <!-- KPI row -->
        <div class="grid grid-cols-4 gap-5 mb-10">
          <div *ngFor="let kpi of kpis; let i = index"
               class="oracle-card p-6 animate-in"
               [style.animation-delay]="i * 80 + 'ms'">
            <p class="oracle-label mb-3">{{kpi.label}}</p>
            <p style="font-family:'Playfair Display',serif; font-size:32px; color:var(--charcoal)">
              {{kpi.value}}
            </p>
            <div class="mt-3 flex items-center gap-2">
              <span style="font-size:11px; color:var(--green-ok)">{{kpi.trend}}</span>
              <span style="font-size:11px; color:var(--mist)">{{kpi.sub}}</span>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <div class="grid grid-cols-3 gap-6">

          <!-- Recent decisions -->
          <div class="col-span-2 oracle-card animate-in">
            <div class="px-6 py-4 flex items-center justify-between"
                 style="border-bottom:1px solid var(--border)">
              <h2 style="font-family:'Playfair Display',serif; font-size:18px; color:var(--charcoal)">
                Recent Decisions
              </h2>
              <a routerLink="/decisions"
                 style="font-family:'DM Mono',monospace; font-size:10px; color:var(--gold); letter-spacing:2px">
                VIEW ALL →
              </a>
            </div>
            <div class="divide-y" style="border-color:var(--border)">
              <div *ngFor="let d of decisions"
                   class="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p style="font-size:14px; color:var(--charcoal); margin-bottom:3px">{{d.title}}</p>
                  <p style="font-family:'DM Mono',monospace; font-size:10px; color:var(--mist)">
                    Confidence: {{(d.confidence * 100).toFixed(0)}}%
                  </p>
                </div>
                <span class="px-3 py-1 text-xs"
                      [style.background]="d.status==='completed' ? 'rgba(39,174,96,0.08)' : 'rgba(201,168,76,0.1)'"
                      [style.color]="d.status==='completed' ? 'var(--green-ok)' : 'var(--gold-dk)'"
                      style="border-radius:1px; font-family:'DM Mono',monospace; letter-spacing:1px">
                  {{d.status.toUpperCase()}}
                </span>
              </div>
              <div *ngIf="decisions.length === 0" class="px-6 py-8 text-center"
                   style="color:var(--mist); font-size:13px">
                No decisions found. Create your first.
              </div>
            </div>
          </div>

          <!-- System status -->
          <div class="space-y-5">
            <div class="oracle-card p-6 animate-in" style="animation-delay:200ms">
              <h3 style="font-family:'Playfair Display',serif; font-size:16px; color:var(--charcoal); margin-bottom:16px">
                System Status
              </h3>
              <div class="space-y-3">
                <div *ngFor="let s of systemStatus" class="flex items-center justify-between">
                  <span style="font-size:13px; color:var(--slate)">{{s.name}}</span>
                  <div class="flex items-center gap-2">
                    <div class="status-dot" [class]="s.status"></div>
                    <span style="font-family:'DM Mono',monospace; font-size:10px; color:var(--mist)">{{s.label}}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="oracle-card p-6 animate-in" style="animation-delay:280ms">
              <h3 style="font-family:'Playfair Display',serif; font-size:16px; color:var(--charcoal); margin-bottom:4px">
                Quick Decision
              </h3>
              <p style="font-size:12px; color:var(--mist); margin-bottom:16px">
                Submit a new AI-powered decision request
              </p>
              <a routerLink="/decisions">
                <button class="oracle-btn oracle-btn-primary w-full" style="font-size:12px">
                  NEW DECISION →
                </button>
              </a>
            </div>

            <!-- HTB hint: system info exposed -->
            <div *ngIf="systemInfo" class="oracle-card p-5 animate-in"
                 style="animation-delay:360ms; border-color:rgba(201,168,76,0.3)">
              <p class="oracle-label mb-3">SYSTEM INFO</p>
              <div class="space-y-2" style="font-family:'DM Mono',monospace; font-size:10px; color:var(--mist)">
                <div>AI Engine: {{systemInfo.aiEngineUrl}}</div>
                <div>DB: {{systemInfo.dbHost}}</div>
                <div style="color:var(--gold)">Admin: {{systemInfo.adminEndpoint}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  decisions: any[] = [];
  systemInfo: any = null;
  username = 'analyst';

  kpis = [
    { label: 'TOTAL DECISIONS', value: '1,284', trend: '+12%', sub: 'this quarter' },
    { label: 'AVG CONFIDENCE',  value: '91.4%', trend: '+2.1%', sub: 'vs last month' },
    { label: 'PENDING REVIEW',  value: '7',     trend: '',      sub: 'require action' },
    { label: 'AI MODEL',        value: 'v2.4',  trend: '',      sub: 'qwen2.5-7b' },
  ];

  systemStatus = [
    { name: 'GraphQL API',   status: 'online',  label: 'OPERATIONAL' },
    { name: 'AI Engine',     status: 'online',  label: 'OPERATIONAL' },
    { name: 'PostgreSQL',    status: 'online',  label: 'OPERATIONAL' },
    { name: 'LM Studio',     status: 'pending', label: 'CHECK CONFIG' },
  ];

  constructor(private gql: GraphqlService, private router: Router) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('oracle_user') || '{}');
    this.username = user.username || 'analyst';

    this.gql.getDecisions().subscribe({
      next: (r: any) => this.decisions = r.data?.decisions || [],
      error: () => this.decisions = this.mockDecisions(),
    });

    this.gql.getSystemInfo().subscribe({
      next: (r: any) => this.systemInfo = r.data?.systemInfo,
      error: () => {}
    });
  }

  mockDecisions() {
    return [
      { title: 'Q3 Budget Approval', confidence: 0.94, status: 'completed' },
      { title: 'Vendor Selection',   confidence: 0.87, status: 'completed' },
      { title: 'Risk Assessment',    confidence: 0.72, status: 'pending'   },
    ];
  }

  logout() { localStorage.clear(); this.router.navigate(['/login']); }
}
