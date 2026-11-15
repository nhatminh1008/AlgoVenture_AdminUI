import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import RecordTable from "../../../shared/components/RecordTable";
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
  const columns = [
    {
      key: "time", title: text("Thời điểm"), layout: "primary",
      render: (row) => <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("vi-VN")}</time>,
    },
    {
      key: "actor", title: text("Người thực hiện"),
      render: (row) => <>
        {row.actor || row.actorEmail || row.actorId || text("Hệ thống")}
        {row.actor && row.actorEmail && <small className="block text-slate-500">{row.actorEmail}</small>}
      </>,
    },
    { key: "action", title: text("Thao tác"), render: (row) => text(actionLabel(row.action)) },
    {
      key: "target", title: text("Tài khoản đích"),
      render: (row) => <>
        {row.targetAccountName || row.targetAccountEmail || row.targetAccountId || "—"}
        {row.targetAccountName && row.targetAccountEmail && <small className="block text-slate-500">{row.targetAccountEmail}</small>}
      </>,
    },
    {
      key: "changes", title: text("Trường đã đổi"),
      render: (row) => row.changedFields?.map((field) => fieldLabels[field] || field).join(", ") || "—",
    },
  ];
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
            <div className="admin-table-toolbar flex flex-wrap items-center justify-between gap-3 p-6">
              <h2 id="activity-heading" className="font-bold">{text("Hoạt động quản trị gần đây")}</h2>
              <button className="btn-secondary" disabled={state.loading} onClick={state.refresh}>{text("Làm mới")}</button>
            </div>
            <RecordTable label={text("Hoạt động quản trị gần đây")} columns={columns} rows={pagination.items}
              emptyMessage={text("Chưa có hoạt động.")} />
            <Pagination pagination={pagination} />
          </section>
        </>
      )}
    </div>
  );
}
