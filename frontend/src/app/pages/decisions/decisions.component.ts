import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GraphqlService } from '../../services/graphql.service';

@Component({
  selector: 'app-decisions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen" style="background:var(--cream)">

      <!-- Nav -->
      <nav style="background:white; border-bottom:1px solid var(--border)">
        <div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 border-2 flex items-center justify-center" style="border-color:var(--gold)">
                <div class="w-2 h-2" style="background:var(--gold)"></div>
              </div>
              <span style="font-family:'Playfair Display',serif; font-size:18px; color:var(--charcoal); font-weight:600">OracleAI</span>
            </div>
            <div class="flex items-center gap-6 text-sm">
              <a routerLink="/dashboard" style="color:var(--mist)">Overview</a>
              <a routerLink="/decisions" style="color:var(--charcoal); font-weight:500; border-bottom:2px solid var(--gold); padding-bottom:2px">Decisions</a>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-5xl mx-auto px-8 py-10">

        <div class="mb-8 animate-in">
          <p style="font-family:'DM Mono',monospace; font-size:10px; color:var(--gold); letter-spacing:3px; margin-bottom:8px">AI DECISION ENGINE</p>
          <h1 style="font-family:'Playfair Display',serif; font-size:34px; color:var(--charcoal)">Submit Decision</h1>
          <p style="color:var(--mist); font-size:14px; margin-top:6px">
            OracleAI will analyze your input using enterprise LLM inference and return a structured recommendation.
          </p>
        </div>

        <!-- Form -->
        <div class="oracle-card p-8 mb-6 animate-in" style="animation-delay:80ms">
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label class="oracle-label">Decision Title</label>
              <input class="oracle-input" [(ngModel)]="title"
                     placeholder="e.g. Q4 Budget Approval" />
            </div>
            <div>
              <label class="oracle-label">Priority Level</label>
              <select class="oracle-input" [(ngModel)]="priority" style="cursor:pointer">
                <option value="low">Low</option>
                <option value="normal" selected>Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div class="mb-6">
            <label class="oracle-label">Input Data / Analysis Request</label>
            <textarea class="oracle-input" rows="6" [(ngModel)]="inputData"
              placeholder="Describe the decision context, data points, and what you need OracleAI to analyze..."
              style="resize:vertical; line-height:1.6"></textarea>
            <!-- HTB HINT: tool call note visible in UI -->
            <p style="font-family:'DM Mono',monospace; font-size:9px; color:var(--mist); margin-top:6px; letter-spacing:1px">
              ORACLE ENGINE v2.4 · TOOLS ACTIVE: exec_command, read_file, query_db
            </p>
          </div>
          <div class="flex gap-4">
            <button class="oracle-btn oracle-btn-primary px-8 py-3"
                    (click)="submit()" [disabled]="loading || !title || !inputData"
                    style="font-size:12px; letter-spacing:2px">
              {{ loading ? 'PROCESSING...' : 'SUBMIT TO ORACLE →' }}
            </button>
            <button class="oracle-btn px-6 py-3" (click)="clear()"
                    style="background:var(--cream); color:var(--slate); border:1px solid var(--border); font-size:12px; letter-spacing:1px">
              CLEAR
            </button>
          </div>
        </div>

        <!-- Result -->
        <div *ngIf="result" class="oracle-card p-8 animate-in">
          <div class="flex items-center gap-3 mb-6">
            <div class="status-dot online"></div>
            <h2 style="font-family:'Playfair Display',serif; font-size:20px; color:var(--charcoal)">
              Oracle Response
            </h2>
            <span class="ml-auto px-3 py-1"
                  style="font-family:'DM Mono',monospace; font-size:10px; background:rgba(39,174,96,0.08); color:var(--green-ok); border:1px solid rgba(39,174,96,0.2); letter-spacing:1px">
              CONFIDENCE: {{(result.decision.confidence * 100).toFixed(0)}}%
            </span>
          </div>

          <div class="mb-5">
            <p class="oracle-label mb-2">AI RECOMMENDATION</p>
            <div class="p-4" style="background:var(--ivory); border:1px solid var(--border); border-radius:1px; font-size:14px; line-height:1.7; color:var(--ink)">
              {{result.decision.aiResponse || '—'}}
            </div>
          </div>

          <!-- Raw output & exec log (HTB: exposed) -->
          <div *ngIf="result.executionLog" class="mb-4">
            <p class="oracle-label mb-2">EXECUTION LOG</p>
            <pre style="font-family:'DM Mono',monospace; font-size:11px; color:var(--slate);
              background:var(--charcoal); color:#00ff88; padding:16px; border-radius:1px;
              white-space:pre-wrap; max-height:200px; overflow-y:auto; line-height:1.6">{{result.executionLog}}</pre>
          </div>

          <div *ngIf="result.internalToolCalls && result.internalToolCalls !== '[]'" class="mb-4">
            <p class="oracle-label mb-2">TOOL CALLS</p>
            <pre style="font-family:'DM Mono',monospace; font-size:11px;
              background:var(--charcoal); color:var(--gold); padding:16px; border-radius:1px;
              white-space:pre-wrap; max-height:150px; overflow-y:auto">{{result.internalToolCalls}}</pre>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class DecisionsComponent {
  title = '';
  inputData = '';
  priority = 'normal';
  loading = false;
  result: any = null;

  constructor(private gql: GraphqlService) {}

  submit() {
    if (!this.title || !this.inputData) return;
    this.loading = true; this.result = null;
    this.gql.executeDecision(this.title, this.inputData, this.priority).subscribe({
      next: (r: any) => { this.result = r.data?.executeDecision; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  clear() { this.title = ''; this.inputData = ''; this.result = null; }
}
