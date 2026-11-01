// Shared assumptions: change here, then run policy/repository tests.
export const PORTAL_POLICY = Object.freeze({
  optionsPerQuestion: 4,
  maxQuestions: 50,
  explanationRequired: true,
  timezone: "Asia/Ho_Chi_Minh",
  defaultDueTime: "23:59",
  scoreBuckets: 5,
  inviteCodeLength: 8,
  inviteAlphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // No 0/O/1/I; legacy seed codes are exempt.
  allowAttemptAtDeadline: true, // overdue only when now > dueAt
  lockQuestionsAfterFirstAttempt: true, // includes explanations and ordering
  allowPublishedDeletionWithoutAttempts: true,
  questionErrorDenominator: "submitted_learners", // no-attempt learners are excluded
});
