import { useText } from "../../../preferences/preferencesContext";
import { useSearchParams } from "react-router-dom";
import { listLessons } from "./lessonService";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import { AdminPageHeader } from "../AdminPageHeader";
import LessonConfigurationForm from "./LessonConfigurationForm";
import LessonResultCapabilitiesTable from "./LessonResultCapabilitiesTable";

export default function LessonConfigurationPage() {
  const text = useText();
  const state = useApiDataWithErrorToast(listLessons, []);
  const [params, setParams] = useSearchParams();
  const selected =
    state.data.find((a) => a.id === params.get("lessonId")) || state.data[0];
  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title="Level Configuration" />
      <ApiFeedback state={state} />
      <label className="mb-6 block">
        <span className="field-label">{text("Chọn bài học")}</span>
        <select
          className="field"
          value={selected?.id || ""}
          onChange={(e) => setParams({ lessonId: e.target.value })}
        >
          {state.data.map((a) => (
            <option key={a.id} value={a.id}>
              {text(a.name)} ({a.topicId})
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <LessonConfigurationForm
          key={selected.id}
          lesson={selected}
          onSaved={state.setData}
        />
      )}
      <LessonResultCapabilitiesTable lessons={state.data} />
    </div>
  );
}
