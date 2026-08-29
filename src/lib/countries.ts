// Launch market first (docs/PRODUCT_STRATEGY.md §17 of the brief: "start
// with Cameroon, then expand"), plus the markets named as the near-term
// expansion path. "Other" keeps the form usable for anyone else rather
// than blocking signup — it does not imply full guidance coverage yet.
export const LAUNCH_COUNTRIES = [
  "Cameroon",
  "Nigeria",
  "Ghana",
  "Kenya",
  "Uganda",
  "Rwanda",
  "South Africa",
  "Other",
] as const;
