export class StorageError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}