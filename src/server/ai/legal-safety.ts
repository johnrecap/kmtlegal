import { normalizedLegalText } from "./legal-context";

export function noOutsideReferral(text: string, allowedUrls: string[] = []) {
  const value = normalizedLegalText(text);
  if (/(?:ارشح|انصحك ب|تواصل مع|اذهب الي|جرب|ابحث عن).{0,80}(?:محام|مكتب محاما[هة]|دليل المحامين)|(?:recommend|contact|try|hire|search for|find).{0,80}(?:lawyer|law firm|attorney|law directory)/i.test(value)) return false;
  const links = text.match(/https?:\/\/[^\s<>)\]]+/gi) ?? [];
  return links.every(url => allowedUrls.includes(url) || /^https:\/\/(?:www\.)?kmtlegal\.org\/(?:ar\/)?(?:book-consultation|client\/requests)(?:[?#].*)?$/.test(url));
}
export function legalAnswerSafe(text: string, allowedUrls: string[] = []) {
  const value = normalizedLegalText(text).replace(/(?:لا|لن)\s+(?:ا?ضمن|نضمن)|\b(?:cannot|can't|do not|don't) guarantee\b/g, "");
  return !/(?:اضمن لك|نتيج[هة] مضمون[هة]|هتكسب (?:اكيد|بالتاكيد)|انا محاميك|انا المحامي|\bi (?:am your lawyer|guarantee)|you will definitely win|guaranteed (?:outcome|to win))/i.test(value) && noOutsideReferral(text, allowedUrls);
}
export function unsupportedPreciseLaw(text: string) {
  return /(?:الماد[هة]\s*\(?[\d٠-٩]+|قانون\s*(?:رقم\s*)?[\d٠-٩]+|خلال\s*[\d٠-٩]+\s*(?:يوم|شهر|سن[هة])|\b(?:article|section|law no\.?|within)\s*\d+)/i.test(text);
}
