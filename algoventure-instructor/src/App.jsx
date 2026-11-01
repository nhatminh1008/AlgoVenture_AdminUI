import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClassroomProvider } from "./data/ClassroomContext";
import RequireRole from "./components/RequireRole";
import Layout from "./components/Layout";
import Classes from "./pages/Classes";
import ClassForm from "./pages/ClassForm";
import ClassDetail from "./pages/ClassDetail";
import AssignmentEditor from "./pages/AssignmentEditor";
import AssignmentDetail from "./pages/AssignmentDetail";
import Progress from "./pages/Progress";
const Analytics = lazy(() => import("./pages/Analytics"));
const LearnerDetail = lazy(() => import("./pages/LearnerDetail"));
const ExportResults = lazy(() => import("./pages/ExportResults"));
const deferred = (Component) => (
  <Suspense fallback={<p role="status">Đang tải báo cáo…</p>}>
    <Component />
  </Suspense>
);
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireRole>
              <ClassroomProvider>
                <Layout />
              </ClassroomProvider>
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="/classes" replace />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/new" element={<ClassForm key="new" />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="classes/:classId/edit" element={<ClassForm />} />
          <Route
            path="classes/:classId/assignments/new"
            element={<AssignmentEditor />}
          />
          <Route
            path="classes/:classId/assignments/:assignmentId"
            element={<AssignmentDetail />}
          />
          <Route
            path="classes/:classId/assignments/:assignmentId/edit"
            element={<AssignmentEditor />}
          />
          <Route
            path="classes/:classId/learners/:learnerId"
            element={deferred(LearnerDetail)}
          />
          <Route path="progress" element={<Progress />} />
          <Route path="analytics" element={deferred(Analytics)} />
          <Route path="export" element={deferred(ExportResults)} />
          <Route path="*" element={<Navigate to="/classes" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
