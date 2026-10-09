export function publicSiteOrigin() {
  return new URL(process.env.APP_ORIGIN || "https://kmtlegal.org").origin;
}
