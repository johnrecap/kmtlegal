import type { Metadata } from "next";
import {
  getClientContent,
  normalizeClientLocale,
  type ClientContent
} from "@/content/client-content";
import { getAuthContextForPage } from "./page-guards";

export async function clientPageMetadata(
  key: keyof ClientContent["metadata"]
): Promise<Metadata> {
  const context = await getAuthContextForPage();
  const locale = normalizeClientLocale(context?.user.locale);
  return { title: getClientContent(locale).metadata[key] };
}
