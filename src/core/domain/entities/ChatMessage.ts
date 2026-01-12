// src/core/domain/entities/ChatMessage.ts
// Chat message entity - represents a single message in a chat session
// Can be from user or AI assistant

import { ValidationError } from '@/shared/utils/errors/AppError';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface MessageAction {
  label: string;
  action: string;
  params?: Record<string, unknown>;
}

export interface ChatMessageData {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  actions?: MessageAction[];
  tokenCount?: number;
  createdAt: Date;
}

export class ChatMessage {
  private constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly role: MessageRole,
    private _content: string,
    public actions: MessageAction[] | undefined,
    public tokenCount: number | undefined,
    public readonly createdAt: Date
  ) {}

  static create(sessionId: string, role: MessageRole, content: string): ChatMessage {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content cannot be empty');
    }

    if (content.length > 10000) {
      throw new ValidationError('Message content cannot exceed 10000 characters');
    }

    const now = new Date();
    const id = `chat_message_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return new ChatMessage(
      id,
      sessionId,
      role,
      content.trim(),
      undefined,
      undefined,
      now
    );
  }

  static fromPersistence(data: ChatMessageData): ChatMessage {
    return new ChatMessage(
      data.id,
      data.sessionId,
      data.role,
      data.content,
      data.actions,
      data.tokenCount,
      data.createdAt
    );
  }

  get content(): string {
    return this._content;
  }

  public setContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content cannot be empty');
    }

    if (content.length > 10000) {
      throw new ValidationError('Message content cannot exceed 10000 characters');
    }

    this._content = content.trim();
  }

  public appendContent(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new ValidationError('Cannot append empty text');
    }

    if (this._content.length + text.length > 10000) {
      throw new ValidationError('Message content would exceed maximum size');
    }

    this._content += text;
  }

  public setActions(actions: MessageAction[]): void {
    if (!actions || actions.length === 0) {
      this.actions = undefined;
      return;
    }

    if (actions.length > 10) {
      throw new ValidationError('Cannot have more than 10 actions per message');
    }

    for (const action of actions) {
      if (!action.label || action.label.trim().length === 0) {
        throw new ValidationError('Action label cannot be empty');
      }

      if (!action.action || action.action.trim().length === 0) {
        throw new ValidationError('Action type cannot be empty');
      }

      if (action.label.length > 50) {
        throw new ValidationError('Action label cannot exceed 50 characters');
      }
    }

    this.actions = actions;
  }

  public addAction(action: MessageAction): void {
    if (this.actions && this.actions.length >= 10) {
      throw new ValidationError('Cannot have more than 10 actions per message');
    }

    if (!action.label || action.label.trim().length === 0) {
      throw new ValidationError('Action label cannot be empty');
    }

    if (!action.action || action.action.trim().length === 0) {
      throw new ValidationError('Action type cannot be empty');
    }

    if (action.label.length > 50) {
      throw new ValidationError('Action label cannot exceed 50 characters');
    }

    if (!this.actions) {
      this.actions = [];
    }

    this.actions.push(action);
  }

  public clearActions(): void {
    this.actions = undefined;
  }

  public setTokenCount(count: number): void {
    if (count < 0) {
      throw new ValidationError('Token count cannot be negative');
    }

    this.tokenCount = count;
  }

  public getCharCount(): number {
    return this._content.length;
  }

  public getWordCount(): number {
    return this._content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  public isFromUser(): boolean {
    return this.role === MessageRole.USER;
  }

  public isFromAssistant(): boolean {
    return this.role === MessageRole.ASSISTANT;
  }

  public hasActions(): boolean {
    return this.actions !== undefined && this.actions.length > 0;
  }

  public toPersistence(): ChatMessageData {
    return {
      id: this.id,
      sessionId: this.sessionId,
      role: this.role,
      content: this._content,
      actions: this.actions,
      tokenCount: this.tokenCount,
      createdAt: this.createdAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      charCount: this.getCharCount(),
      wordCount: this.getWordCount(),
      isFromUser: this.isFromUser(),
      isFromAssistant: this.isFromAssistant(),
      hasActions: this.hasActions(),
    };
  }
}
