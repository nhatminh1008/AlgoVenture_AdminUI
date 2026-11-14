import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import { saveBlob } from "../../../api/apiClient";
import { actionLabel, roleLabels } from "../recordLabels.js";
import { getAdminAnalytics } from "./adminAnalyticsService";
const fieldLabels = {
  name: "Họ tên", email: "Email", role: "Vai trò", status: "Trạng thái",
  dateOfBirth: "Ngày sinh", phone: "Số điện thoại", address: "Địa chỉ",
};

export default function SystemAnalyticsPage() {
  const text = useText();
  const state = useApiData(getAdminAnalytics, null);
  const { hash } = useLocation();
  const activity = useRef(null);
  const hasData = !!state.data;
  useEffect(() => {
    if (hasData && hash === "#admin-activity") activity.current?.scrollIntoView();
  }, [hasData, hash]);
  const pagination = usePagination(state.data?.logs ?? [], undefined);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader title="System Analytics">
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
          {text("Tải báo cáo JSON")}
        </button>
      </AdminPageHeader>
      <ApiFeedback state={state} />
      {state.data && (
        <>
          <dl className="admin-summary">
            {state.data.roles.map((role) => (
              <div key={role.name}>
                <dt>{text(roleLabels[role.name] || role.name)}</dt><dd>{role.value}</dd>
              </div>
            ))}
          </dl>
          <section ref={activity} id="admin-activity" className="panel overflow-hidden" aria-labelledby="activity-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6">
              <h2 id="activity-heading" className="font-bold">{text("Hoạt động quản trị gần đây")}</h2>
              <button className="btn-secondary" disabled={state.loading} onClick={state.refresh}>{text("Làm mới")}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{text("Thời điểm")}</th>
                    <th>{text("Người thực hiện")}</th>
                    <th>{text("Thao tác")}</th>
                    <th>{text("Tài khoản đích")}</th>
                    <th>{text("Trường đã đổi")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((row, i) => (
                    <tr key={row.id ?? i}>
                      <td><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("vi-VN")}</time></td>
                      <td>
                        {row.actor || row.actorEmail || row.actorId || "Hệ thống"}
                        {row.actor && row.actorEmail && <small className="block text-slate-500">{row.actorEmail}</small>}
                      </td>
                      <td>{text(actionLabel(row.action))}</td>
                      <td>
                        {row.targetAccountName || row.targetAccountEmail || row.targetAccountId || "—"}
                        {row.targetAccountName && row.targetAccountEmail && <small className="block text-slate-500">{row.targetAccountEmail}</small>}
                      </td>
                      <td>{row.changedFields?.map((field) => fieldLabels[field] || field).join(", ") || "—"}</td>
                    </tr>
                  ))}
                  {!state.data.logs.length && (
                    <tr>
                      <td colSpan={5}>{text("Chưa có hoạt động.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination pagination={pagination} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
