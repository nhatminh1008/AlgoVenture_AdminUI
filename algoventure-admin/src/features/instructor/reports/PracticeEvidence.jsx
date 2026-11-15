import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { useEffect, useState } from "react";
import { getClassroomPractice } from "./practiceService";

export default function PracticeEvidence({ classId }) {
  const text = useText();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    getClassroomPractice(classId)
      .then(value => { if (!cancelled) setData(value); })
      .catch(reason => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [classId, reload]);
  const pagination = usePagination(data?.students ?? [], classId);
  const columns = [
    { key: "student", title: text("Sinh viên"), layout: "primary", render: (student) => student.name },
    { key: "minigame", title: text("Lượt minigame"), render: (student) => student.minigameAttempts },
    { key: "supplement", title: text("Lượt bổ trợ"), render: (student) => student.supplementaryAttempts },
    {
      key: "bubble", title: text("Bubble Sort · Đúng lần đầu / cơ hội thao tác"), layout: "wide",
      render: (student) => student.observations
        ? `${student.correctFirstResponses} / ${student.observations}`
        : text("Chưa có thao tác"),
    },
  ];
  return <section className="panel mt-6 overflow-hidden" aria-labelledby="practice-evidence-title">
    <div className="instructor-compact-panel border-b border-slate-100 p-5">
      <h2 id="practice-evidence-title" className="text-lg font-bold">{text("Minigame và luyện bổ trợ")}</h2>
      <p className="mt-2 text-sm text-slate-600">{text("Số lượt chơi được ghi nhận theo các bài giao của lớp này. Kết quả thao tác Bubble Sort do máy chủ kiểm chứng.", "Play counts are based on this class’s assignments. The server verifies Bubble Sort results.")}</p>
    </div>
    {error ? <p role="alert" className="p-5">{error} <button className="btn-secondary" onClick={() => { setError(""); setData(null); setReload(v => v + 1); }}>{text("Thử lại")}</button></p>
      : !data ? <p role="status" className="p-5">{text("Đang tải lịch sử luyện tập…")}</p>
      : <RecordTable label={text("Minigame và luyện bổ trợ")} columns={columns}
          rows={pagination.items.map((student) => ({ ...student, id: student.userId }))}
          emptyMessage={text("Lớp chưa có sinh viên.")} />}
    <Pagination pagination={pagination} />
  </section>;
}
