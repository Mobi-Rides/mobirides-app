export class MissingSecretError extends Error {
  secretName: string;

  constructor(secretName: string) {
    super(`Missing required secret: ${secretName}`);
    this.name = "MissingSecretError";
    this.secretName = secretName;
  }
}

export function getRequiredSecret(secretName: string): string {
  const value = Deno.env.get(secretName)?.trim();

  if (!value) {
    throw new MissingSecretError(secretName);
  }

  return value;
}

export function isMissingSecretError(error: unknown): error is MissingSecretError {
  return error instanceof MissingSecretError;
}
