export function legalCaseReference(id: string, now = new Date()) {
  return `KMT-${now.getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
}
