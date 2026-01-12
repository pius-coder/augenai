// src/core/ports/repositories/IUserSettingsRepository.ts
// Repository port for UserSettings persistence

import { UserSettings } from '../../domain/entities/UserSettings';

export interface IUserSettingsRepository {
  get(): Promise<UserSettings | null>;
  getOrCreateDefault(): Promise<UserSettings>;

  save(settings: UserSettings): Promise<void>;
}
