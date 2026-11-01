import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, FileText, Download } from "lucide-react";
import { PageHeader } from "../components/ui";
import { useClassrooms } from "../data/ClassroomContext";
import { useMaterialList } from "../components/ClassMaterials";
import { downloadMaterial } from "../data/materials";
import QuizPreview from "../components/QuizPreview";

export default function QuizDetail() {
  const { classId, quizId } = useParams();
  const { classes, quizzes } = useClassrooms();
  const classroom = classes.find((item) => item.id === classId);
  const quiz = quizzes.find(
    (item) => item.id === quizId && item.classId === classId,
  );
  if (!classroom || !quiz)
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">
          Không tìm thấy bộ câu hỏi trong lớp này
        </h1>
        <Link className="btn-secondary mt-4" to="/instructor/classes">
          Về lớp của tôi
        </Link>
      </div>
    );
  return <Detail key={quiz.id} classroom={classroom} quiz={quiz} />;
}
function Detail({ classroom, quiz }) {
  const { instructor } = useClassrooms();
  const location = useLocation();
  const {
    materials,
    loading,
    error: materialError,
  } = useMaterialList(classroom.id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function download(id) {
    setBusy(true);
    setError("");
    try {
      await downloadMaterial(id, classroom.id, instructor.id);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={`/instructor/classes/${classroom.id}?tab=quizzes`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500"
      >
        <ArrowLeft size={16} />
        Trắc nghiệm của lớp
      </Link>
      <PageHeader
        breadcrumb={`${classroom.name} / Trắc nghiệm`}
        title={quiz.title}
      >
        {quiz.status === "Draft" && (
          <Link
            className="btn-primary"
            to={`/instructor/classes/${classroom.id}/quizzes/${quiz.id}/edit`}
          >
            <Pencil size={16} />
            Chỉnh sửa bản nháp
          </Link>
        )}
      </PageHeader>
      {location.state?.message && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {location.state.message}
        </p>
      )}
      <section className="panel mb-6 space-y-3 p-6">
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="font-semibold text-emerald-700">
            {quiz.status === "Draft" ? "Bản nháp" : "Đã công bố"}
          </span>
          <span>{quiz.questions.length} câu hỏi</span>
          <span>
            {quiz.questions.reduce((sum, question) => sum + question.points, 0)}{" "}
            điểm
          </span>
          {quiz.due && <span>Hạn: {quiz.due}</span>}
        </div>
        {quiz.description && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {quiz.description}
          </p>
        )}
        {quiz.materialIds.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} />
              Tài liệu tham khảo
            </h2>
            {loading ? (
              <p className="text-xs text-slate-400">Đang tải tài liệu…</p>
            ) : materialError ? (
              <p role="alert" className="text-sm text-red-600">
                {materialError}
              </p>
            ) : (
              quiz.materialIds.map((id) => {
                const material = materials.find((item) => item.id === id);
                return (
                  <div
                    key={id}
                    className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                  >
                    <span className="min-w-0 break-words text-sm">
                      {material?.title ?? "Tài liệu không còn khả dụng"}
                    </span>
                    {material && (
                      <button
                        className="shrink-0 text-emerald-700 disabled:opacity-50"
                        disabled={busy}
                        aria-label={`Tải ${material.title}`}
                        onClick={() => download(id)}
                      >
                        <Download size={17} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
      <QuizPreview quiz={quiz} />
    </div>
  );
}
