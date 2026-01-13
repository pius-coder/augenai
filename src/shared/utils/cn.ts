// src/shared/utils/cn.ts
// Utility function for merging class names (similar to clsx)

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}