const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#10233f"/>
  <path d="M18 18h28v6H35v22h-6V24H18z" fill="#d6a84f"/>
  <path d="M18 46h28v4H18z" fill="#f7f2e8"/>
</svg>`;

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml; charset=utf-8"
    }
  });
}
