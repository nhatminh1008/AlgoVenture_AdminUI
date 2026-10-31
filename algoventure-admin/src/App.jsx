import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireRole, HomeRedirect } from "./auth/AuthContext";
import Login from "./auth/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ContentLevels from "./pages/ContentLevels";
import LevelConfig from "./pages/LevelConfig";
import SystemAnalytics from "./pages/SystemAnalytics";
import FeatureToggles from "./pages/FeatureToggles";
import Settings from "./pages/Settings";
import AdminClasses from "./pages/AdminClasses";

const InstructorRoutes = lazy(() => import("./instructor/InstructorRoutes"));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense
          fallback={
            <p role="status" className="p-8">
              Đang tải giao diện…
            </p>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="content" element={<ContentLevels />} />
                <Route path="levels" element={<LevelConfig />} />
                <Route path="analytics" element={<SystemAnalytics />} />
                <Route path="features" element={<FeatureToggles />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route element={<RequireRole role="instructor" />}>
              <Route path="/instructor/*" element={<InstructorRoutes />} />
            </Route>
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
