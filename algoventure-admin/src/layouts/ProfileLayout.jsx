import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AdminLayout from "./AdminLayout";
import InstructorLayout from "./InstructorLayout";

export default function ProfileLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role === "admin") return <AdminLayout />;
  if (user.role === "instructor") return <InstructorLayout />;
  return <Outlet />;
}
