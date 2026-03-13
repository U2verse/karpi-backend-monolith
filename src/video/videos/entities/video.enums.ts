export enum VideoStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',

   // 🔥 Lifecycle states (ADD THESE)
  REPLACED = 'replaced',     // no longer linked to lesson
  ARCHIVED = 'archived',     // safe for cleanup
}

export enum VideoVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}
