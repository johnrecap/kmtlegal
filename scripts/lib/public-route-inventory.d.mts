export type ArabicRoute = { pattern: string; view?: string };
export function deriveArabicPublicRoutes(source: string): Promise<ArabicRoute[]>;
export function missingArabicRoutes(before: ArabicRoute[], after: ArabicRoute[]): string[];
