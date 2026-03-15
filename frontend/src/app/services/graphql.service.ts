import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private endpoint = '/graphql';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('oracle_token');
    return token
      ? new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  query(gql: string, variables: any = {}): Observable<any> {
    return this.http.post(this.endpoint, { query: gql, variables }, { headers: this.headers });
  }

  mutate(gql: string, variables: any = {}): Observable<any> {
    return this.http.post(this.endpoint, { query: gql, variables }, { headers: this.headers });
  }

  login(username: string, password: string): Observable<any> {
    return this.mutate(`
      mutation Login($u: String!, $p: String!) {
        login(username: $u, password: $p) {
          token
          user { id username role email }
          internalRole
          sessionId
        }
      }`, { u: username, p: password });
  }

  getDecisions(): Observable<any> {
    return this.query(`
      query {
        decisions {
          id title inputData aiResponse confidence status
        }
      }`);
  }

  executeDecision(title: string, inputData: string, priority: string = 'normal'): Observable<any> {
    return this.mutate(`
      mutation Exec($title: String!, $input: String!, $priority: String) {
        executeDecision(title: $title, inputData: $input, priority: $priority) {
          decision { id title aiResponse confidence status }
          rawAiOutput
          executionLog
          internalToolCalls
        }
      }`, { title, input: inputData, priority });
  }

  getSystemInfo(): Observable<any> {
    return this.query(`
      query {
        systemInfo {
          version aiEngineUrl adminEndpoint dbHost
        }
      }`);
  }
}
