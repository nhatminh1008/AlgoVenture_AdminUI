import { useEffect, useState } from "react";
import { api } from "../../api/client";

export default function PracticeEvidence({ classId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    api(`/instructor/classes/${classId}/practice`)
      .then(value => { if (!cancelled) setData(value); })
      .catch(reason => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [classId, reload]);
  return <section className="panel mt-6 overflow-hidden" aria-labelledby="practice-evidence-title">
    <div className="border-b border-slate-100 p-5">
      <h2 id="practice-evidence-title" className="text-lg font-bold">Minigame và luyện bổ trợ</h2>
      <p className="mt-2 text-sm text-slate-600">Số lượt chơi được ghi nhận theo các bài giao của lớp này. Cột cuối hiển thị kết quả thao tác Bubble Sort do máy chủ kiểm chứng.</p>
    </div>
    {error ? <p role="alert" className="p-5">{error} <button className="btn-secondary" onClick={() => { setError(""); setData(null); setReload(v => v + 1); }}>Thử lại</button></p>
      : !data ? <p role="status" className="p-5">Đang tải lịch sử luyện tập…</p>
      : <div className="overflow-x-auto"><table className="data-table">
        <thead><tr><th>Sinh viên</th><th>Lượt minigame</th><th>Lượt bổ trợ</th><th>Bubble Sort · Đúng lần đầu / cơ hội thao tác</th></tr></thead>
        <tbody>{data.students.map(student => <tr key={student.userId}><td>{student.name}</td><td>{student.minigameAttempts}</td><td>{student.supplementaryAttempts}</td><td>{student.observations ? `${student.correctFirstResponses} / ${student.observations}` : "Chưa có thao tác"}</td></tr>)}
          {!data.students.length && <tr><td colSpan={4}>Lớp chưa có sinh viên.</td></tr>}</tbody>
      </table></div>}
  </section>;
}
