import { useSearchParams } from "react-router-dom";
import { listLessons } from "./lessonService";
import { useApiData } from "../../../shared/hooks/useApiData";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import LessonConfigurationForm from "./LessonConfigurationForm";

export default function LessonConfigurationPage() {
  const state = useApiData(listLessons, []);
  const [params, setParams] = useSearchParams();
  const selected =
    state.data.find((a) => a.id === params.get("lessonId")) || state.data[0];
  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title="Level Configuration" />
      <ApiFeedback state={state} />
      <label className="mb-6 block">
        <span className="field-label">Chọn bài học</span>
        <select
          className="field"
          value={selected?.id || ""}
          onChange={(e) => setParams({ lessonId: e.target.value })}
        >
          {state.data.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.topicId})
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <LessonConfigurationForm
          key={selected.id}
          lesson={selected}
          lessons={state.data}
          onSaved={state.setData}
        />
      )}
    </div>
  );
}
