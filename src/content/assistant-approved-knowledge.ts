// Legal explanations are opt-in editorial records. Never seed unapproved legal content.
export type ApprovedLegalExplanation = {
  id: string; locale: "ar" | "en"; title: string; content: string;
  source: string; approvedBy: string; approvedAt: string;
};
export const approvedLegalExplanations: readonly ApprovedLegalExplanation[] = [];
