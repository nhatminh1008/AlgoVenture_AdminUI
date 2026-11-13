import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireRole, HomeRedirect } from "./auth/RequireRole";
import LoginPage from "./auth/LoginPage";
import { adminRoutes } from "./routes/AdminRoutes";

const InstructorRoutes = lazy(() => import("./routes/InstructorRoutes"));

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
            <Route path="/login" element={<LoginPage />} />
            {adminRoutes}
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
