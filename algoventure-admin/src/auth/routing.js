export function roleHome(role) {
  return role === "admin" ? "/admin" : "/instructor/classes";
}
export function loginDestination(role, location) {
  const prefix = role === "admin" ? "/admin" : "/instructor";
  const path = location?.pathname;
  return typeof path === "string" &&
    (path === prefix || path.startsWith(`${prefix}/`))
    ? `${path}${location.search || ""}${location.hash || ""}`
    : roleHome(role);
}
