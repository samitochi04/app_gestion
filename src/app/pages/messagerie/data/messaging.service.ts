import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { TokenService } from '../../../core/services/token.service';
import { PageResponse } from '../../../core/models/api-response.model';
import {
  Conversation, Correspondent, CreateDirectRequest, CreateGroupRequest,
  CreateSupportRequest, Message, SendMessageRequest, StreamTicket,
} from './messaging.model';

/** Normalizes an endpoint that may return either a bare array or a PageResponse. */
function toArray<T>(v: T[] | PageResponse<T>): T[] {
  return Array.isArray(v) ? v : (v?.content ?? []);
}

/** `/api/messaging/*` — see MODULES.md § erp-messaging. */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly api = inject(ApiService);
  private readonly tokens = inject(TokenService);

  // ---- Conversations ----
  conversations(): Observable<Conversation[]> {
    return this.api.get<Conversation[] | PageResponse<Conversation>>('/api/messaging/conversations').pipe(map(toArray));
  }

  conversation(id: number): Observable<Conversation> {
    return this.api.get<Conversation>(`/api/messaging/conversations/${id}`);
  }

  messages(id: number): Observable<Message[]> {
    return this.api.get<Message[] | PageResponse<Message>>(`/api/messaging/conversations/${id}/messages`).pipe(map(toArray));
  }

  markRead(id: number): Observable<unknown> {
    return this.api.post(`/api/messaging/conversations/${id}/read`);
  }

  createDirect(body: CreateDirectRequest): Observable<Conversation> {
    return this.api.post<Conversation>('/api/messaging/conversations/direct', body);
  }

  createGroup(body: CreateGroupRequest): Observable<Conversation> {
    return this.api.post<Conversation>('/api/messaging/conversations/groups', body);
  }

  createSupport(body: CreateSupportRequest): Observable<Conversation> {
    return this.api.post<Conversation>('/api/messaging/conversations/support', body);
  }

  archive(id: number): Observable<unknown> {
    return this.api.post(`/api/messaging/conversations/${id}/archive`);
  }

  reopen(id: number): Observable<unknown> {
    return this.api.post(`/api/messaging/conversations/${id}/reopen`);
  }

  // ---- Messages ----
  send(conversationId: number, body: SendMessageRequest): Observable<Message> {
    return this.api.post<Message>(`/api/messaging/conversations/${conversationId}/messages`, body);
  }

  editMessage(messageId: number, body: SendMessageRequest): Observable<Message> {
    return this.api.put<Message>(`/api/messaging/messages/${messageId}`, body);
  }

  deleteMessage(messageId: number): Observable<unknown> {
    return this.api.delete(`/api/messaging/messages/${messageId}`);
  }

  /** Directory limited to name + email; distinct from GET /api/users. */
  correspondents(): Observable<Correspondent[]> {
    return this.api.get<Correspondent[] | PageResponse<Correspondent>>('/api/messaging/correspondents').pipe(map(toArray));
  }

  // ---- Real-time (SSE) ----
  /** A single-use, 30-second ticket that authenticates the SSE stream. */
  streamTicket(): Observable<StreamTicket> {
    return this.api.post<StreamTicket>('/api/messaging/stream/ticket');
  }

  /**
   * Opens the SSE stream. The browser EventSource can't set an Authorization
   * header, so the stream is authenticated by a single-use ticket in the URL
   * (MODULES.md). Returns the EventSource so the caller can close it.
   */
  openStream(ticket: string): EventSource {
    const url = `${environment.apiBaseUrl}/api/messaging/stream?ticket=${encodeURIComponent(ticket)}`;
    return new EventSource(url);
  }

  hasToken(): boolean { return this.tokens.hasToken; }
}
