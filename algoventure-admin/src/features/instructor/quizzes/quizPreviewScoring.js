import { validateQuiz } from "./quizValidation.js";

export function gradeQuiz(quiz, answers) {
  const error = validateQuiz(
    { ...quiz, status: "Published" },
    { id: quiz.classId },
  );
  if (error) throw new Error(error);
  const results = quiz.questions.map((question) => ({
    questionId: question.id,
    correct: answers[question.id] === question.correctOptionId,
    points:
      answers[question.id] === question.correctOptionId ? question.points : 0,
    maxPoints: question.points,
  }));
  return {
    results,
    score: results.reduce((sum, result) => sum + result.points, 0),
    maxScore: results.reduce((sum, result) => sum + result.maxPoints, 0),
    correctCount: results.filter((result) => result.correct).length,
  };
}
