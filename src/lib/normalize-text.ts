const COMBINING_MARKS = /[\u0300-\u036f\u0483-\u0489\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed]/g;
const ZERO_WIDTH = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/[\u0649\u0626]/g, "\u064a")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0640/g, "")
    .replace(ZERO_WIDTH, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
