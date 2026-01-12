// src/core/ports/services/storage/IFileDownloadService.ts
// Higher-level download port (typically wraps IStorageService)

import type { StorageGetResult } from './IStorageService';

export interface IFileDownloadService {
  download(key: string): Promise<StorageGetResult>;
}
