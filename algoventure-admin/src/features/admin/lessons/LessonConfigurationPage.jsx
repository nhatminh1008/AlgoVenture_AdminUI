import { useText } from "../../../preferences/preferencesContext";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { listLessons } from "./lessonService";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import RecordBadge from "../RecordBadge";
import LessonConfigurationForm from "./LessonConfigurationForm";
import "./LessonConfiguration.css";

export function LegacyLessonConfiguration() {
  const [params] = useSearchParams();
  const id = params.get("lessonId");
  if (!id) return <Navigate replace to="/admin/content" state={{ lessonNotFound: true }} />;
  return <Navigate replace to={`/admin/content/${encodeURIComponent(id)}/configuration`} />;
}

export default function LessonConfigurationPage() {
  const text = useText();
  const state = useApiDataWithErrorToast(listLessons, []);
  const { lessonId } = useParams();
  const { search, state: navigationState } = useLocation();
  const navigate = useNavigate();
  const selected = state.data.find((lesson) => lesson.id === lessonId);
  const library = { pathname: "/admin/content", search };
  if (!selected && !state.loading && !state.error) {
    return <Navigate replace to={library} state={{ lessonNotFound: true }} />;
  }
  return (
    <div className="lesson-config">
      <header className="lesson-config-heading">
        <Link className="lesson-config-back" to={library} onClick={(event) => {
          if (!navigationState?.fromLibrary || event.button !== 0 ||
              event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          navigate(-1);
        }}>
          <ArrowLeft size={16} aria-hidden="true" />
          {text("Về thư viện", "Back to library")}
        </Link>
        <div className="lesson-config-hero panel">
          <span className="lesson-config-icon lesson-config-hero-icon" aria-hidden="true"><BookOpen size={26} /></span>
          <div className="lesson-config-title">
            {selected && <p>{text("Cấu hình bài học")}</p>}
            <h1>{selected ? text(selected.name) : text("Cấu hình bài học")}</h1>
          </div>
          {selected && <RecordBadge value={selected.status} />}
        </div>
      </header>
      <ApiFeedback state={state} />
      {selected && (
        <LessonConfigurationForm
          key={selected.id}
          lesson={selected}
          onSaved={state.setData}
        />
      )}
    </div>
  );
}
