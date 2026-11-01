import { PORTAL_SESSION } from "../data/session.js";

export default function RequireRole({
  children,
  roles = ["INSTRUCTOR"],
  session = PORTAL_SESSION,
}) {
  if (!roles.includes(session?.role))
    return (
      <main className="p-8">
        <section className="panel mx-auto max-w-lg p-8">
          <h1 className="text-2xl font-bold">403 — Không có quyền truy cập</h1>
          <p role="alert" className="mt-4 text-sm text-slate-500">
            Không gian này dành cho tài khoản giảng viên.
          </p>
        </section>
      </main>
    );
  return children;
}
