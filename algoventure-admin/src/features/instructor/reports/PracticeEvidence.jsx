import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
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
  return <section className="panel mt-6 overflow-hidden" aria-labelledby="practice-evidence-title">
    <div className="border-b border-slate-100 p-5">
      <h2 id="practice-evidence-title" className="text-lg font-bold">{text("Minigame và luyện bổ trợ")}</h2>
      <p className="mt-2 text-sm text-slate-600">{text("Số lượt chơi được ghi nhận theo các bài giao của lớp này. Cột cuối hiển thị kết quả thao tác Bubble Sort do máy chủ kiểm chứng.")}</p>
    </div>
    {error ? <p role="alert" className="p-5">{error} <button className="btn-secondary" onClick={() => { setError(""); setData(null); setReload(v => v + 1); }}>{text("Thử lại")}</button></p>
      : !data ? <p role="status" className="p-5">{text("Đang tải lịch sử luyện tập…")}</p>
      : <div className="overflow-x-auto"><table className="data-table">
        <thead><tr><th>{text("Sinh viên")}</th><th>{text("Lượt minigame")}</th><th>{text("Lượt bổ trợ")}</th><th>{text("Bubble Sort · Đúng lần đầu / cơ hội thao tác")}</th></tr></thead>
        <tbody>{pagination.items.map(student => <tr key={student.userId}><td>{student.name}</td><td>{student.minigameAttempts}</td><td>{student.supplementaryAttempts}</td><td>{student.observations ? `${student.correctFirstResponses} / ${student.observations}` : text("Chưa có thao tác")}</td></tr>)}
          {!data.students.length && <tr><td colSpan={4}>{text("Lớp chưa có sinh viên.")}</td></tr>}</tbody>
      </table></div>}
    <Pagination pagination={pagination} />
  </section>;
}
