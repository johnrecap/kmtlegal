import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  // Owner decision (launch fixes TASK 02): article detail is not publicly readable.
  // Closed at the route boundary before any content service or database read.
  return jsonError(404, "NOT_FOUND", "Article was not found.", undefined, undefined, { locale });
}
