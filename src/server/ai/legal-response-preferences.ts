import { normalizedLegalText } from "./legal-context";

/** Presentation requests only; these never change evidence or authorization rules. */
export function legalResponsePreferences(message: string) {
  const text = normalizedLegalText(message);
  const factsOnly = /(?:summari[sz]e|list|repeat).{0,25}only.{0,15}facts|(?:لخص|اذكر|قول).{0,15}(?:فقط الوقائع|الوقائع فقط)/.test(text);
  const noAnalysis = factsOnly || /(?:without|no) legal analysis|(?:بدون|من غير) (?:راي|تحليل) قانوني/.test(text);
  return {
    factsOnly, noAnalysis,
    noQuestions: factsOnly || /(?:without|no).{0,40}question|(?:بدون|من غير).{0,20}سؤال/.test(text),
    oneSentence: /one sentence|جمل[هة] واحد[هة]/.test(text),
    short: /\b(?:short|brief|concise)\b|باختصار|مختصر/.test(text)
  };
}

export function responsePreferenceViolation(answer: string, preferences: ReturnType<typeof legalResponsePreferences>, conciseDraft = false) {
  if (conciseDraft && (answer.trim().split(/\s+/u).length > 100 || /[?؟]|\bnext steps?\b|الخطو[هة] التالي[هة]/i.test(answer))) {
    return "Return ONLY the requested preliminary clause, at most 100 words. Remove notes, next steps, questions, repeated draft headings and terms beyond the requested subject. Use placeholders instead of choosing unagreed terms.";
  }
  if (preferences.noQuestions && /[?؟]/.test(answer)) return "Remove the follow-up question; the customer requested only the answer.";
  // Ignore decimal points and citation markers when counting sentence boundaries.
  if (preferences.oneSentence && answer.replace(/\[S\d+\]/g, "").split(/[.!?؟](?:\s+|$)/).filter(s => s.trim()).length > 1) {
    return "Answer in exactly one sentence, without an introduction, extra advice or a follow-up question.";
  }
  return null;
}

/** A short requested clause must not silently introduce unrelated contractual terms. */
export function shortDraftScopeViolation(answer: string, question: string) {
  const extraTerms = [
    /\btax(?:es)?\b|ضريب|ضرائب/i,
    /\blate (?:payment|fee)|\bpenalt|\bconsequences?\b|غرام|تاخير/i,
    /\b(?:intellectual property|ownership|copyright|suspend)\b|ملكي[هة] فكري[هة]|تعليق العمل/i
  ];
  return extraTerms.some(pattern => pattern.test(normalizedLegalText(answer)) && !pattern.test(normalizedLegalText(question)))
    ? "Remove unrequested tax, late-payment, penalty, suspension or ownership provisions. Write only the requested clause using placeholders for its missing terms. Do not add optional clauses."
    : null;
}
