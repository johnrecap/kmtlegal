export class HandoffVerificationError extends Error {}

export type HandoffVerificationResult = {
  phase: "empty" | "seeded";
  database: string;
  userTables: number;
  privateUploads: number;
  migrations?: number;
  roles?: number;
  permissions?: number;
  customerAndOperationalRows?: number;
};

export function verifyUploadsDirectory(directory: string, phase: "empty" | "seeded"): Promise<void>;
export function verifyHandoffDatabase(
  client: unknown,
  options: { phase: "empty" | "seeded"; expectedName: string; uploadsDir: string }
): Promise<HandoffVerificationResult>;
