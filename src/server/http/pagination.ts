import { z } from "zod";

export type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export function toPagination(input: { page?: number; pageSize?: number }): Pagination {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function allowlistedSortSchema<const T extends readonly [string, ...string[]]>(fields: T) {
  return z.object({
    sortBy: z.enum(fields).optional(),
    sortDirection: z.enum(["asc", "desc"]).default("desc")
  });
}
