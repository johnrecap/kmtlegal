export const analyticsEventNameValues = [
  "booking.step_viewed",
  "booking.submit_attempted",
  "booking.submit_failed",
  "consultation.submitted",
  "consultation.converted_to_case",
  "document.upload_succeeded",
  "document.upload_failed",
  "case.status_updated",
  "observability.error_captured"
] as const;

export const clientAnalyticsEventNameValues = [
  "booking.step_viewed",
  "booking.submit_attempted",
  "booking.submit_failed"
] as const;

export const bookingStepValues = ["contact", "details", "review"] as const;

export type AnalyticsEventName = (typeof analyticsEventNameValues)[number];
export type ClientAnalyticsEventName = (typeof clientAnalyticsEventNameValues)[number];
export type BookingStep = (typeof bookingStepValues)[number];
