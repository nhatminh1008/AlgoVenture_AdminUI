import { useText } from "./preferences/preferencesContext";
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireRole, HomeRedirect } from "./auth/RequireRole";
import LoginPage from "./auth/LoginPage";
import { RegisterPage, VerifyEmailPage } from "./auth/RegistrationPages";
import ProfilePage from "./features/profile/ProfilePage";
import ProfileLayout from "./layouts/ProfileLayout";
import { adminRoutes } from "./routes/AdminRoutes";

const InstructorRoutes = lazy(() => import("./routes/InstructorRoutes"));

function App() {
  const text = useText();
  return (
    <AuthProvider>
      <Router>
        <Suspense
          fallback={
            <p role="status" className="p-8">
              {text("Đang tải giao diện…")}
            </p>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/profile" element={<ProfileLayout />}>
              <Route index element={<ProfilePage />} />
            </Route>
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
