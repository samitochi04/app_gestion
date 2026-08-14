/**
 * Internal messaging (erp-messaging). Threads come in three types — DIRECT,
 * GROUP, SUPPORT — and messages are loaded per conversation, never embedded in
 * the conversation aggregate. Unread counts are derived from lastReadAt. See
 * MODULES.md § erp-messaging.
 *
 * NOTE: these DTO shapes follow the documented behaviour; field names should be
 * confirmed against the live backend if anything reads empty.
 */

export type ConversationType = 'DIRECT' | 'GROUP' | 'SUPPORT';

export interface Correspondent {
  id: string;
  name: string;
  email: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  subject?: string;
  /** For a DIRECT thread, the other participant's display name. */
  displayName?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  status?: string;                // ACTIVE · ARCHIVED
  participants?: { userId: string; name?: string; role?: string; leftAt?: string }[];
  createdAt?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  senderName?: string;
  body: string;
  editedAt?: string;
  deleted?: boolean;
  createdAt: string;
}

export interface CreateDirectRequest { participantId: string; }
export interface CreateGroupRequest { subject: string; participantIds: string[]; }
export interface CreateSupportRequest { subject: string; }
export interface SendMessageRequest { body: string; }

export interface StreamTicket { ticket: string; expiresAt: string; }
