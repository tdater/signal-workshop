// Shared by the feedback form (build time) and the server (runtime), so limits can't drift.
export const LIMITS = {
  title: 120,
  messageMin: 10,
  message: 4000,
  name: 60,
  email: 254,
  short: 120,
  detail: 2000,
  reply: 2000,
  maxLinks: 5,
  pageSize: 10,
} as const;

export const FEEDBACK_TYPES = [
  { id: 'comment', label: 'Comment' },
  { id: 'suggestion', label: 'Suggestion' },
  { id: 'idea', label: 'Idea' },
  { id: 'question', label: 'Question' },
  { id: 'bug', label: 'Bug report' },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]['id'];
export const FEEDBACK_TYPE_IDS: readonly string[] = FEEDBACK_TYPES.map((t) => t.id);

export const RATE = {
  submitPer10Min: 5,
  submitPerDay: 20,
  loginPer15Min: 5,
} as const;

export const RETENTION_DAYS = {
  // Content of rejected or spam items is erased after this many days. "Remove" erases at once.
  rejected: 30,
  // Optional reply emails are erased this long after submission, whatever the status.
  email: 90,
} as const;
