import { useText } from "../preferences/preferencesContext";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Link, useLocation, useParams } from "react-router-dom";
import InstructorLayout from "../layouts/InstructorLayout";
import ChallengeSetsPage from "../features/instructor/assignments/ChallengeSetsPage";
import AssignChallengePage from "../features/instructor/assignments/AssignChallengePage";
import StudentProgressPage from "../features/instructor/reports/StudentProgressPage";
import ProgressResultPage from "../features/instructor/reports/ProgressResultPage";
import StudentProgressDetailPage, { StudentAssignmentPage } from "../features/instructor/reports/StudentProgressDetailPage";
import StudentQuizHistoryPage from "../features/instructor/reports/StudentQuizHistoryPage";
import { studentAssignmentPath } from "../features/instructor/reports/progressService";
import { instructorActivePath, instructorDestination } from "../features/instructor/workspace/useInstructorNavigation";
import ResultsExportPage from "../features/instructor/reports/ResultsExportPage";
import InstructorClassroomsPage from "../features/instructor/classrooms/InstructorClassroomsPage";
import ClassroomFormPage from "../features/instructor/classrooms/ClassroomFormPage";
import ClassroomDetailPage from "../features/instructor/classrooms/ClassroomDetailPage";
import InstructorQuizzesPage from "../features/instructor/quizzes/InstructorQuizzesPage";
import QuizEditorPage from "../features/instructor/quizzes/QuizEditorPage";
import QuizDetailPage from "../features/instructor/quizzes/QuizDetailPage";

const ClassroomAnalyticsPage = lazy(() => import("../features/instructor/reports/ClassroomAnalyticsPage"));

function InstructorRoutes() {
  const text = useText();
  return (
    <Routes>
      <Route element={<InstructorLayout />}>
        <Route
          index
          element={<Navigate to="/instructor/classes" replace />}
        />
        <Route path="classes" element={<InstructorClassroomsPage />} />
        <Route path="classes/new" element={<ClassroomFormPage key="new" />} />
        <Route path="classes/:classId" element={<ClassroomDetailPage />} />
        <Route path="classes/:classId/students/:enrollmentId" element={<StudentProgressDetailPage />} />
        <Route path="classes/:classId/students/:enrollmentId/assignments/:assignmentId" element={<StudentAssignmentPage />} />
        <Route path="classes/:classId/students/:enrollmentId/assignments/:assignmentId/lessons/:lessonId/*"
          element={<LegacyPracticeRedirect />} />
        <Route path="classes/:classId/students/:enrollmentId/quizzes/:quizId" element={<StudentQuizHistoryPage />} />
        <Route path="classes/:classId/edit" element={<ClassroomFormPage />} />
        <Route path="classes/:classId/assign" element={<AssignChallengePage />} />
        <Route path="classes/:classId/quizzes/new" element={<QuizEditorPage />} />
        <Route
          path="classes/:classId/quizzes/:quizId"
          element={<QuizDetailPage />}
        />
        <Route
          path="classes/:classId/quizzes/:quizId/edit"
          element={<QuizEditorPage />}
        />
        <Route path="challenges" element={<ChallengeSetsPage />} />
        <Route path="challenges/new" element={<ChallengeSetsPage />} />
        <Route path="quizzes" element={<InstructorQuizzesPage />} />
        <Route path="progress" element={<StudentProgressPage />} />
        <Route path="progress/classes/:classId/assignments/:workId" element={<ProgressResultPage kind="assignments" />} />
        <Route path="progress/classes/:classId/quizzes/:workId" element={<ProgressResultPage kind="quizzes" />} />
        <Route
          path="analytics"
          element={
            <Suspense
              fallback={<p role="status">{text("Đang tải phân tích lớp học…")}</p>}
            >
              <ClassroomAnalyticsPage />
            </Suspense>
          }
        />
        <Route path="export" element={<ResultsExportPage />} />
        <Route
          path="*"
          element={<div className="panel p-8">
            <h1 className="text-xl font-bold">{text("Trang không tồn tại", "Page not found")}</h1>
            <Link className="btn-secondary mt-4" to="/instructor/classes">{text("Về lớp của tôi")}</Link>
          </div>}
        />
      </Route>
    </Routes>
  );
}

function LegacyPracticeRedirect() {
  const { classId, enrollmentId, assignmentId } = useParams();
  const { pathname, search } = useLocation();
  const assignment = studentAssignmentPath(classId, enrollmentId, assignmentId);
  return <Navigate to={instructorDestination(assignment, instructorActivePath(pathname, search))} replace />;
}

export default InstructorRoutes;
