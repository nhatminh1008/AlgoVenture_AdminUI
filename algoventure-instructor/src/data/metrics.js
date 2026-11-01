import { PORTAL_POLICY } from "./policy.js";
import { submissionDay, dayLabel } from "./dates.js";
import { validateQuestion } from "./validators.js";

export function gradeAttempt(assignment, answers) {
  if (
    !assignment.questions.length ||
    assignment.questions.some((question) => validateQuestion(question))
  )
    throw new Error("Bài tập chưa có câu hỏi hợp lệ.");
  const normalized = assignment.questions.map((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    const selectedIndex =
      Number.isInteger(answer?.selectedIndex) &&
      answer.selectedIndex >= 0 &&
      answer.selectedIndex < PORTAL_POLICY.optionsPerQuestion
        ? answer.selectedIndex
        : null;
    return { questionId: question.id, selectedIndex };
  });
  const correctCount = normalized.filter(
    (answer, index) =>
      answer.selectedIndex === assignment.questions[index].correctIndex,
  ).length;
  const total = assignment.questions.length;
  return {
    answers: normalized,
    correctCount,
    total,
    scorePercent: Math.round((100 * correctCount) / total),
  };
}
export function bestAttempt(attempts) {
  return (
    [...attempts].sort(
      (a, b) =>
        b.scorePercent - a.scorePercent ||
        Date.parse(b.submittedAt) - Date.parse(a.submittedAt) ||
        a.id.localeCompare(b.id),
    )[0] ?? null
  );
}
export function canSubmit(assignment, now = () => new Date()) {
  return (
    assignment.status === "published" &&
    (PORTAL_POLICY.allowAttemptAtDeadline
      ? now().getTime() <= Date.parse(assignment.dueAt)
      : now().getTime() < Date.parse(assignment.dueAt))
  );
}
export function deriveStatus(assignment, attempts, now = () => new Date()) {
  return attempts.length
    ? "submitted"
    : (
          PORTAL_POLICY.allowAttemptAtDeadline
            ? now().getTime() > Date.parse(assignment.dueAt)
            : now().getTime() >= Date.parse(assignment.dueAt)
        )
      ? "overdue"
      : "not_started";
}
export function completionRate(enrollments, attempts) {
  return enrollments.length
    ? Math.round(
        (100 *
          enrollments.filter((enrollment) =>
            attempts.some(
              (attempt) => attempt.learnerId === enrollment.learnerId,
            ),
          ).length) /
          enrollments.length,
      )
    : 0;
}
export function scoreDistribution(bestAttempts) {
  const count = PORTAL_POLICY.scoreBuckets;
  const buckets = Array.from({ length: count }, (_, i) => ({
    label: `${(i * 100) / count}–${i === count - 1 ? 100 : ((i + 1) * 100) / count - 1}`,
    count: 0,
  }));
  for (const attempt of bestAttempts)
    if (attempt)
      buckets[
        Math.min(
          count - 1,
          Math.max(0, Math.floor(attempt.scorePercent / (100 / count))),
        )
      ].count++;
  return buckets;
}
export function questionErrorStats(assignment, attempts, enrollments) {
  const best = enrollments
    .map((enrollment) =>
      bestAttempt(
        attempts.filter(
          (attempt) =>
            attempt.assignmentId === assignment.id &&
            attempt.learnerId === enrollment.learnerId,
        ),
      ),
    )
    .filter(Boolean);
  return assignment.questions.map((question) => {
    const missed = best.filter(
      (attempt) =>
        attempt.answers.find((answer) => answer.questionId === question.id)
          ?.selectedIndex !== question.correctIndex,
    );
    return {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      questionId: question.id,
      prompt: question.prompt,
      missedCount: missed.length,
      submittedLearners: best.length,
      missedPercent: (
        PORTAL_POLICY.questionErrorDenominator === "submitted_learners"
          ? best.length
          : enrollments.length
      )
        ? Math.round(
            (100 * missed.length) /
              (PORTAL_POLICY.questionErrorDenominator === "submitted_learners"
                ? best.length
                : enrollments.length),
          )
        : 0,
      learnerIds: missed.map((attempt) => attempt.learnerId),
    };
  });
}
export function scoreTrend(attempts) {
  const days = new Map();
  for (const attempt of attempts) {
    const day = submissionDay(attempt.submittedAt);
    const values = days.get(day) ?? [];
    values.push(attempt.scorePercent);
    days.set(day, values);
  }
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, scores]) => ({
      day,
      label: dayLabel(day),
      average: Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      ),
      attempts: scores.length,
    }));
}
export function gradebookRows(
  classrooms,
  enrollments,
  assignments,
  attempts,
  now = () => new Date(),
) {
  return assignments
    .filter((assignment) => assignment.status === "published")
    .flatMap((assignment) =>
      enrollments
        .filter(
          (enrollment) => enrollment.classroomId === assignment.classroomId,
        )
        .map((enrollment) => {
          const history = attempts.filter(
            (attempt) =>
              attempt.assignmentId === assignment.id &&
              attempt.learnerId === enrollment.learnerId,
          );
          const best = bestAttempt(history);
          const last = [...history].sort(
            (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
          )[0];
          return {
            classroomId: assignment.classroomId,
            classTitle:
              classrooms.find((item) => item.id === assignment.classroomId)
                ?.title ?? "",
            learnerId: enrollment.learnerId,
            learnerName: enrollment.learnerName,
            learnerEmail: enrollment.learnerEmail,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            status: deriveStatus(assignment, history, now),
            bestScorePercent: best?.scorePercent ?? null,
            correctCount: best?.correctCount ?? null,
            total: assignment.questions.length,
            attemptCount: history.length,
            lastSubmittedAt: last?.submittedAt ?? null,
          };
        }),
    );
}
export function assignmentStats(assignment, enrollments, attempts) {
  const members = enrollments.filter(
    (enrollment) => enrollment.classroomId === assignment.classroomId,
  );
  const history = attempts.filter(
    (attempt) => attempt.assignmentId === assignment.id,
  );
  const best = members
    .map((enrollment) =>
      bestAttempt(
        history.filter((attempt) => attempt.learnerId === enrollment.learnerId),
      ),
    )
    .filter(Boolean);
  return {
    id: assignment.id,
    title: assignment.title,
    completion: completionRate(members, history),
    average: best.length
      ? Math.round(
          best.reduce((sum, attempt) => sum + attempt.scorePercent, 0) /
            best.length,
        )
      : null,
    submitted: best.length,
    learners: members.length,
    best,
  };
}
