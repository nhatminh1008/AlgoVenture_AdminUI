import { Navigate, useLocation, useParams } from "react-router-dom";
import { progressResultsPath } from "../workspace/useInstructorNavigation";

export default function ProgressResultPage({ kind }) {
  const { classId, workId } = useParams();
  const { search, state } = useLocation();
  const params = new URLSearchParams(search);
  if (kind === "quizzes" && params.get("group") === "questions") {
    const query = new URLSearchParams({ tab: "questions", from: "quizzes" });
    if (params.has("questionPage")) query.set("questionPage", params.get("questionPage"));
    return <Navigate to={`/instructor/classes/${encodeURIComponent(classId)}/quizzes/${encodeURIComponent(workId)}?${query}`}
      state={state} replace />;
  }
  return <Navigate to={progressResultsPath(classId, kind, workId, search)} state={state} replace />;
}
