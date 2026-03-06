/**
 * Base error class for all vidbreak errors.
 */
export class VidbreakError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'VidbreakError';
  }
}
