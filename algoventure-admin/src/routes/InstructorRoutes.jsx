import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import InstructorLayout from "../layouts/InstructorLayout";
import ChallengeSetsPage from "../features/instructor/assignments/ChallengeSetsPage";
import StudentProgressPage from "../features/instructor/reports/StudentProgressPage";
import ResultsExportPage from "../features/instructor/reports/ResultsExportPage";
import InstructorClassroomsPage from "../features/instructor/classrooms/InstructorClassroomsPage";
import ClassroomFormPage from "../features/instructor/classrooms/ClassroomFormPage";
import ClassroomDetailPage from "../features/instructor/classrooms/ClassroomDetailPage";
import QuizEditorPage from "../features/instructor/quizzes/QuizEditorPage";
import QuizDetailPage from "../features/instructor/quizzes/QuizDetailPage";
import { ClassroomProvider } from "../features/instructor/workspace/ClassroomContext";

const ClassroomAnalyticsPage = lazy(() => import("../features/instructor/reports/ClassroomAnalyticsPage"));

function InstructorRoutes() {
  return (
    <ClassroomProvider>
      <Routes>
        <Route element={<InstructorLayout />}>
          <Route
            index
            element={<Navigate to="/instructor/classes" replace />}
          />
          <Route path="classes" element={<InstructorClassroomsPage />} />
          <Route path="classes/new" element={<ClassroomFormPage key="new" />} />
          <Route path="classes/:classId" element={<ClassroomDetailPage />} />
          <Route path="classes/:classId/edit" element={<ClassroomFormPage />} />
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
          <Route path="progress" element={<StudentProgressPage />} />
          <Route
            path="analytics"
            element={
              <Suspense
                fallback={<p role="status">Đang tải phân tích lớp học…</p>}
              >
                <ClassroomAnalyticsPage />
              </Suspense>
            }
          />
          <Route path="export" element={<ResultsExportPage />} />
          <Route
            path="*"
            element={<Navigate to="/instructor/classes" replace />}
          />
        </Route>
      </Routes>
    </ClassroomProvider>
  );
}

export default InstructorRoutes;
