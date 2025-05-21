
export const SUBMISSION_TYPES = [
  { value: "project_to_implement", label: "I have a project I want to implement" },
  { value: "project_idea", label: "I have a project idea" },
] as const;

// Define new contribution types to show in the dropdown
export const DISPLAYED_CONTRIBUTION_TYPES = [
  "Governance", "Practical Tooling", "Visionary Tech", "ZuLink Bounty"
] as const;

// Keep the original enum for backwards compatibility
export const CONTRIBUTION_TYPES = [
  "Tooling", "Framework", "dacc", "Software", "Social", "Other",
  ...DISPLAYED_CONTRIBUTION_TYPES
] as const;

export const FLAG_TYPES = ["Green", "Grey", "Yellow", "Swiss"] as const;

export type SubmissionTypeValue = typeof SUBMISSION_TYPES[number]["value"];
export type ContributionTypeValue = typeof CONTRIBUTION_TYPES[number];
export type FlagTypeValue = typeof FLAG_TYPES[number];
