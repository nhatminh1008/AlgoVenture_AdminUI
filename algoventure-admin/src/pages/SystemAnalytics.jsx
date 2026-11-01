import { useApiData, ApiFeedback, AdminHeader } from "../components/ApiState";
import { saveBlob } from "../api/client";
export default function SystemAnalytics() {
  const state = useApiData("/admin/analytics", null);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminHeader title="System Analytics">
        <button
          disabled={!state.data}
          className="btn-secondary"
          onClick={() =>
            saveBlob(
              new Blob([JSON.stringify(state.data, null, 2)], {
                type: "application/json",
              }),
              "system-analytics.json",
            )
          }
        >
          Tải báo cáo JSON
        </button>
      </AdminHeader>
      <ApiFeedback state={state} />
      {state.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {state.data.roles.map((role) => (
              <div className="panel p-6" key={role.name}>
                <p className="text-sm text-slate-500">{role.name}</p>
                <p className="mt-3 text-3xl font-bold">{role.value}</p>
              </div>
            ))}
          </div>
          <section className="panel overflow-hidden">
            <h2 className="p-6 font-bold">Hoạt động quản trị gần đây</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời điểm</th>
                    <th>Người thực hiện</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.logs.map((row, i) => (
                    <tr key={i}>
                      <td>{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
                      <td>{row.actor}</td>
                      <td>{row.action}</td>
                    </tr>
                  ))}
                  {!state.data.logs.length && (
                    <tr>
                      <td colSpan={3}>Chưa có hoạt động.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
