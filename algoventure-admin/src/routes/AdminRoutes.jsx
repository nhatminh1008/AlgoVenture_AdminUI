import { Route } from "react-router-dom";
import { RequireRole } from "../auth/RequireRole";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboardPage from "../features/admin/dashboard/AdminDashboardPage";
import UserManagementPage from "../features/admin/users/UserManagementPage";
import LessonLibraryPage from "../features/admin/lessons/LessonLibraryPage";
import LessonConfigurationPage from "../features/admin/lessons/LessonConfigurationPage";
import SystemAnalyticsPage from "../features/admin/analytics/SystemAnalyticsPage";
import FeatureFlagsPage from "../features/admin/feature-flags/FeatureFlagsPage";
import PlatformSettingsPage from "../features/admin/settings/PlatformSettingsPage";
import AdminClassroomsPage from "../features/admin/classrooms/AdminClassroomsPage";
import AchievementRulesPage from "../features/admin/achievements/AchievementRulesPage";

export const adminRoutes = (
  <Route element={<RequireRole role="admin" />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboardPage />} />
      <Route path="users" element={<UserManagementPage />} />
      <Route path="classes" element={<AdminClassroomsPage />} />
      <Route path="content" element={<LessonLibraryPage />} />
      <Route path="levels" element={<LessonConfigurationPage />} />
      <Route path="achievements" element={<AchievementRulesPage />} />
      <Route path="analytics" element={<SystemAnalyticsPage />} />
      <Route path="features" element={<FeatureFlagsPage />} />
      <Route path="settings" element={<PlatformSettingsPage />} />
    </Route>
  </Route>
);
