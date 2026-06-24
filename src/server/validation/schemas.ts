import { z } from "zod";
import { ValidationApiError, type ApiErrorDetails } from "@/server/http/errors";

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().trim().email().max(254).toLowerCase();
export const localeSchema = z.enum(["ar", "en"]).default("ar");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const sortDirectionSchema = z.enum(["asc", "desc"]).default("desc");

export function validationDetailsFromIssues(issues: z.ZodIssue[]): ApiErrorDetails {
  return issues.map((issue) => ({
    path: issue.path.join(".") || undefined,
    message: issue.message,
    code: issue.code
  }));
}

export function parseWithSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  message = "Request validation failed."
): z.infer<TSchema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationApiError(message, validationDetailsFromIssues(result.error.issues));
  }

  return result.data;
}

export async function parseJsonRequest<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
  message = "Request body validation failed."
): Promise<z.infer<TSchema>> {
  const body = await request.json().catch(() => null);
  return parseWithSchema(schema, body, message);
}

export function parseQueryParams<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
  message = "Query validation failed."
): z.infer<TSchema> {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  return parseWithSchema(schema, params, message);
}
