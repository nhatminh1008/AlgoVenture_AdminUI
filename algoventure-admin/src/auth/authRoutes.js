export function roleHome(role) {
  return role === "admin" ? "/admin" : role === "learner" ? "/profile" : "/instructor/classes";
}
export function loginDestination(role, location) {
  if (location?.pathname === "/profile") return "/profile";
  const prefix = role === "admin" ? "/admin" : "/instructor";
  const path = location?.pathname;
  return typeof path === "string" &&
    (path === prefix || path.startsWith(`${prefix}/`))
    ? `${path}${location.search || ""}${location.hash || ""}`
    : roleHome(role);
}
