export enum PmsName {
  GUESTY = 'GUESTY',
  MEWS = 'MEWS',
}

/**
 * Normalize PMS master name strings (e.g. "guesty", "Guesty") to PmsName.
 */
export function toPmsName(value: string | null | undefined): PmsName {
  const normalized = (value || '').trim().toUpperCase();

  if (normalized === PmsName.GUESTY) {
    return PmsName.GUESTY;
  }

  if (normalized === PmsName.MEWS) {
    return PmsName.MEWS;
  }

  throw new Error(`Unsupported PMS name: ${value}`);
}
