import { useText } from "../../../preferences/preferencesContext";
import { useLocation, useSearchParams } from "react-router-dom";
import { useClassrooms } from "../workspace/useClassrooms";
import InstructorBackLink from "../workspace/InstructorBackLink";
import ChallengeList from "./ChallengeList";
import ChallengeEditor from "./ChallengeEditor";

export default function ChallengeSetsPage() {
  const text = useText();
  const { classes, assignments, assignmentTemplates, saveAssignmentTemplate } = useClassrooms();
  const [params] = useSearchParams();
  const location = useLocation();
  const editingId = params.get("assignmentId");
  const assignmentTemplateId = params.get("assignmentTemplateId");
  const creating = location.pathname.endsWith("/new");
  if (!creating && !editingId && !assignmentTemplateId) return <ChallengeList />;
  if (creating || assignmentTemplateId) {
    const template = assignmentTemplates.find((item) => item.id === assignmentTemplateId);
    if (!assignmentTemplateId || template) {
      const existing = template && { ...template, lessonIds: template.algorithmIds, lessonConfigs: template.algorithmConfigs };
      return <ChallengeEditor key={assignmentTemplateId ?? "new-template"} existing={existing}
        saveAssignmentTemplate={saveAssignmentTemplate} templateMode />;
    }
  }
  const existing = assignments.find(item => item.id === editingId);
  const classId = existing?.classId ?? params.get("classId") ?? "";
  if (!existing || (params.has("classId") && params.get("classId") !== existing.classId))
    return <div className="panel p-8"><InstructorBackLink /><h1 className="text-xl font-bold">{text("Không tìm thấy bộ thử thách")}</h1></div>;
  return <ChallengeEditor key={editingId} classes={classes} initialClassId={classId} existing={existing} />;
}
