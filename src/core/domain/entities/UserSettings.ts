// src/core/domain/entities/UserSettings.ts
// User settings entity - global user configuration
// Single record, ID is 'default'

import { ValidationError } from '@/shared/utils/errors/AppError';

export interface UserSettingsData {
  id: string;
  channelName: string;
  channelDescription: string;
  channelTone: ChannelTone;
  channelLanguage: string;
  defaultVoiceId: string;
  defaultMaxChunkSize: number;
  defaultSilenceBetween: number;
  defaultAudioFormat: AudioFormat;
  defaultAutoRetry: number;
  theme: Theme;
  sidebarOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChannelTone {
  PROFESSIONNEL = 'professionnel',
  DÉCONTRACTÉ = 'décontracté',
  ÉDUCATIF = 'éducatif',
  CUSTOM = 'custom',
}

export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  AAC = 'aac',
  FLAC = 'flac',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export class UserSettings {
  private constructor(
    public readonly id: string,
    private _channelName: string,
    private _channelDescription: string,
    private _channelTone: ChannelTone,
    private _channelLanguage: string,
    private _defaultVoiceId: string,
    private _defaultMaxChunkSize: number,
    private _defaultSilenceBetween: number,
    private _defaultAudioFormat: AudioFormat,
    private _defaultAutoRetry: number,
    private _theme: Theme,
    private _sidebarOpen: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static create(): UserSettings {
    const now = new Date();

    return new UserSettings(
      'default',
      '',
      '',
      ChannelTone.PROFESSIONNEL,
      'fr',
      '',
      2000,
      500,
      AudioFormat.MP3,
      3,
      Theme.SYSTEM,
      true,
      now,
      now
    );
  }

  static fromPersistence(data: UserSettingsData): UserSettings {
    return new UserSettings(
      data.id,
      data.channelName,
      data.channelDescription,
      data.channelTone,
      data.channelLanguage,
      data.defaultVoiceId,
      data.defaultMaxChunkSize,
      data.defaultSilenceBetween,
      data.defaultAudioFormat,
      data.defaultAutoRetry,
      data.theme,
      data.sidebarOpen,
      data.createdAt,
      data.updatedAt
    );
  }

  get channelName(): string {
    return this._channelName;
  }

  get channelDescription(): string {
    return this._channelDescription;
  }

  get channelTone(): ChannelTone {
    return this._channelTone;
  }

  get channelLanguage(): string {
    return this._channelLanguage;
  }

  get defaultVoiceId(): string {
    return this._defaultVoiceId;
  }

  get defaultMaxChunkSize(): number {
    return this._defaultMaxChunkSize;
  }

  get defaultSilenceBetween(): number {
    return this._defaultSilenceBetween;
  }

  get defaultAudioFormat(): AudioFormat {
    return this._defaultAudioFormat;
  }

  get defaultAutoRetry(): number {
    return this._defaultAutoRetry;
  }

  get theme(): Theme {
    return this._theme;
  }

  get sidebarOpen(): boolean {
    return this._sidebarOpen;
  }

  public setChannelSettings(name: string, description: string, tone: ChannelTone, language: string): void {
    if (name.length > 200) {
      throw new ValidationError('Channel name cannot exceed 200 characters');
    }

    if (description.length > 1000) {
      throw new ValidationError('Channel description cannot exceed 1000 characters');
    }

    if (language.length !== 2) {
      throw new ValidationError('Language must be a 2-letter ISO code (e.g., "fr", "en")');
    }

    this._channelName = name.trim();
    this._channelDescription = description.trim();
    this._channelTone = tone;
    this._channelLanguage = language.toLowerCase();
    this.updatedAt = new Date();
  }

  public setVoiceSettings(voiceId: string, maxChunkSize: number, silenceBetween: number): void {
    if (voiceId && voiceId.length > 100) {
      throw new ValidationError('Voice ID cannot exceed 100 characters');
    }

    if (maxChunkSize < 100 || maxChunkSize > 5000) {
      throw new ValidationError('Max chunk size must be between 100 and 5000 characters');
    }

    if (silenceBetween < 0 || silenceBetween > 5000) {
      throw new ValidationError('Silence between chunks must be between 0 and 5000ms');
    }

    this._defaultVoiceId = voiceId.trim();
    this._defaultMaxChunkSize = maxChunkSize;
    this._defaultSilenceBetween = silenceBetween;
    this.updatedAt = new Date();
  }

  public setAudioSettings(format: AudioFormat, autoRetry: number): void {
    if (autoRetry < 0 || autoRetry > 10) {
      throw new ValidationError('Auto retry must be between 0 and 10');
    }

    this._defaultAudioFormat = format;
    this._defaultAutoRetry = autoRetry;
    this.updatedAt = new Date();
  }

  public setTheme(theme: Theme): void {
    this._theme = theme;
    this.updatedAt = new Date();
  }

  public setSidebarOpen(open: boolean): void {
    this._sidebarOpen = open;
    this.updatedAt = new Date();
  }

  public getChannelDisplayName(): string {
    return this._channelName || 'Untitled Channel';
  }

  public getToneDisplayName(): string {
    const displayNames: Record<ChannelTone, string> = {
      [ChannelTone.PROFESSIONNEL]: 'Professionnel',
      [ChannelTone.DÉCONTRACTÉ]: 'Décontracté',
      [ChannelTone.ÉDUCATIF]: 'Éducatif',
      [ChannelTone.CUSTOM]: 'Personnalisé',
    };
    return displayNames[this._channelTone];
  }

  public getLanguageDisplayName(): string {
    const languageNames: Record<string, string> = {
      'fr': 'Français',
      'en': 'English',
      'es': 'Español',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
    };
    return languageNames[this._channelLanguage] || this._channelLanguage.toUpperCase();
  }

  public getThemeDisplayName(): string {
    const themeNames: Record<Theme, string> = {
      [Theme.LIGHT]: 'Light',
      [Theme.DARK]: 'Dark',
      [Theme.SYSTEM]: 'System',
    };
    return themeNames[this._theme];
  }

  public hasDefaultVoice(): boolean {
    return this._defaultVoiceId !== undefined && this._defaultVoiceId.length > 0;
  }

  public toPersistence(): UserSettingsData {
    return {
      id: this.id,
      channelName: this._channelName,
      channelDescription: this._channelDescription,
      channelTone: this._channelTone,
      channelLanguage: this._channelLanguage,
      defaultVoiceId: this._defaultVoiceId,
      defaultMaxChunkSize: this._defaultMaxChunkSize,
      defaultSilenceBetween: this._defaultSilenceBetween,
      defaultAudioFormat: this._defaultAudioFormat,
      defaultAutoRetry: this._defaultAutoRetry,
      theme: this._theme,
      sidebarOpen: this._sidebarOpen,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toJSON() {
    return {
      ...this.toPersistence(),
      channelDisplayName: this.getChannelDisplayName(),
      toneDisplayName: this.getToneDisplayName(),
      languageDisplayName: this.getLanguageDisplayName(),
      themeDisplayName: this.getThemeDisplayName(),
      hasDefaultVoice: this.hasDefaultVoice(),
    };
  }
}
