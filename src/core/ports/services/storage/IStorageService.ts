// src/core/ports/services/storage/IStorageService.ts
// Storage port (local disk, S3/R2, etc.)

export type StorageData = Buffer | Uint8Array | ArrayBuffer;

export interface StoragePutOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface StorageObjectInfo {
  key: string;
  size?: number;
  contentType?: string;
  url?: string;
  etag?: string;
}

export interface StorageGetResult {
  data: Buffer;
  contentType?: string;
  size?: number;
}

export interface IStorageService {
  putObject(key: string, data: StorageData, options?: StoragePutOptions): Promise<StorageObjectInfo>;
  getObject(key: string): Promise<StorageGetResult>;
  deleteObject(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  getPublicUrl?(key: string): string | Promise<string>;
}
