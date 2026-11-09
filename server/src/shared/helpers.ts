export class Helper {
  /**
   * Safely parse integer with fallback
   */
  public static parseIntSafe(value: any, fallback: number = 0): number {
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Format reference string with padding (e.g. LEX-2026-0042)
   */
  public static formatReferenceNumber(prefix: string, sequence: number, padLength: number = 4): string {
    const year = new Date().getFullYear();
    const seqStr = String(sequence).padStart(padLength, '0');
    return `${prefix}-${year}-${seqStr}`;
  }

  /**
   * Safe JSON parse with fallback
   */
  public static parseJsonSafe<T>(jsonStr: string | null | undefined, fallback: T): T {
    if (!jsonStr) return fallback;
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return fallback;
    }
  }
}

