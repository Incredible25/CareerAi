import type {
  ExperienceRequirement,
  OpportunityCategory,
  OpportunityStatus,
  RemoteStatus,
  ReportReason,
  ReportStatus,
  SourceType,
  TrustLevel,
  VerificationStatus,
} from "@prisma/client";

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  JOB: "Job",
  INTERNSHIP: "Internship",
  SCHOLARSHIP: "Scholarship",
  FELLOWSHIP: "Fellowship",
  GRANT: "Grant",
  COMPETITION: "Competition",
  VOLUNTEER: "Volunteer",
  REMOTE_WORK: "Remote work",
  FREELANCE: "Freelance",
  TRAINING_PROGRAM: "Training program",
  MENTORSHIP: "Mentorship",
};

export const REMOTE_STATUS_LABELS: Record<RemoteStatus, string> = {
  REMOTE: "Remote",
  ON_SITE: "On-site",
  HYBRID: "Hybrid",
  UNSPECIFIED: "Not specified",
};

export const EXPERIENCE_LABELS: Record<ExperienceRequirement, string> = {
  NONE: "No experience required",
  ENTRY_LEVEL: "Entry-level",
  SOME_EXPERIENCE: "Some experience",
  EXPERIENCED: "Experienced",
  UNSPECIFIED: "Not specified",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  UNVERIFIED: "Unverified",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  REPORTED: "Reported",
};

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  ARCHIVED: "Archived",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  OFFICIAL_ORGANIZATION: "Official organization",
  GOVERNMENT: "Government",
  UNIVERSITY: "University",
  INTERNATIONAL_ORGANIZATION: "International organization",
  PARTNER_ORGANIZATION: "Partner organization",
  APPROVED_PLATFORM: "Approved platform",
  OTHER: "Other",
};

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  UNRATED: "Unrated",
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SUSPICIOUS_OPPORTUNITY: "Suspicious opportunity",
  BROKEN_LINK: "Broken application link",
  INCORRECT_INFORMATION: "Incorrect information",
  EXPIRED: "Expired but still shown",
  MISLEADING_REQUIREMENTS: "Misleading requirements",
  SUSPICIOUS_ORGANIZATION: "Suspicious organization",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Open",
  REVIEWED: "Reviewed",
  DISMISSED: "Dismissed",
};

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  SECONDARY: "Secondary school",
  UNIVERSITY: "University",
  GRADUATE: "Graduate / postgraduate",
  OTHER: "Other",
};
