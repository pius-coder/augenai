// src/core/ports/services/storage/IFileUploadService.ts
// Higher-level upload port (typically wraps IStorageService)

import type { StorageObjectInfo, StoragePutOptions } from './IStorageService';

export interface FileUploadParams {
  key: string;
  data: Buffer;
  options?: StoragePutOptions;
}

export interface IFileUploadService {
  upload(params: FileUploadParams): Promise<StorageObjectInfo>;
}
