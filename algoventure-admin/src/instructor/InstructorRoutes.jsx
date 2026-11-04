import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ChallengeSets from "./pages/ChallengeSets";
import Progress from "./pages/Progress";
import ExportResults from "./pages/ExportResults";
import Classes from "./pages/Classes";
import ClassForm from "./pages/ClassForm";
import ClassDetail from "./pages/ClassDetail";
import QuizEditor from "./pages/QuizEditor";
import QuizDetail from "./pages/QuizDetail";
import { ClassroomProvider } from "./data/ClassroomContext";

const Analytics = lazy(() => import("./pages/Analytics"));

function InstructorRoutes() {
  return (
    <ClassroomProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={<Navigate to="/instructor/classes" replace />}
          />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/new" element={<ClassForm key="new" />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="classes/:classId/edit" element={<ClassForm />} />
          <Route path="classes/:classId/quizzes/new" element={<QuizEditor />} />
          <Route
            path="classes/:classId/quizzes/:quizId"
            element={<QuizDetail />}
          />
          <Route
            path="classes/:classId/quizzes/:quizId/edit"
            element={<QuizEditor />}
          />
          <Route path="challenges" element={<ChallengeSets />} />
          <Route path="challenges/new" element={<ChallengeSets />} />
          <Route path="progress" element={<Progress />} />
          <Route
            path="analytics"
            element={
              <Suspense
                fallback={<p role="status">Đang tải phân tích lớp học…</p>}
              >
                <Analytics />
              </Suspense>
            }
          />
          <Route path="export" element={<ExportResults />} />
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
