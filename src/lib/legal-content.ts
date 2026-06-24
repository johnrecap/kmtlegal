export const articleStatusValues = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export const caseStudyStatusValues = ["DRAFT", "LEGAL_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
export const socialDraftStatusValues = ["DRAFT", "LEGAL_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"] as const;
export const socialPlatformValues = ["linkedin", "x-twitter", "facebook", "instagram", "website", "newsletter"] as const;

export const articleStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  REVIEW: "قيد المراجعة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف"
};

export const caseStudyStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  LEGAL_REVIEW: "مراجعة قانونية",
  APPROVED: "معتمد",
  PUBLISHED: "منشور",
  REJECTED: "مرفوض",
  ARCHIVED: "مؤرشف"
};

export const socialDraftStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  LEGAL_REVIEW: "مراجعة قانونية",
  APPROVED: "معتمد",
  SCHEDULED: "مجدول",
  PUBLISHED: "منشور داخليًا",
  REJECTED: "مرفوض",
  ARCHIVED: "مؤرشف"
};

export const socialPlatformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  "x-twitter": "X/Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  website: "الموقع",
  newsletter: "النشرة البريدية"
};
