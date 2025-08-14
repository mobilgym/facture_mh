export class DatabaseError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}