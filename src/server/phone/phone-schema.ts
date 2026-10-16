import { z } from "zod";
import { canonicalPhone } from "./phone-normalization";

// Shared by booking and explicitly consented office follow-up.
export const phoneSchema = z.string().trim().max(24).refine(value =>
  /^[+\d٠-٩۰-۹ ()-]+$/.test(value) && /^\d{8,15}$/.test(canonicalPhone(value) ?? "")
);
