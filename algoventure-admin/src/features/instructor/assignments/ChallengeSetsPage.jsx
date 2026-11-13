import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useClassrooms } from "../workspace/ClassroomContext";
import ChallengeList from "./ChallengeList";
import ChallengeEditor from "./ChallengeEditor";

export default function ChallengeSetsPage() {
  const { classes, assignments, saveAssignment } = useClassrooms();
  const [params] = useSearchParams();
  const location = useLocation();
  const editingId = params.get("assignmentId");
  const creating = location.pathname.endsWith("/new");
  if (!creating && !editingId) return <ChallengeList />;
  const existing = assignments.find(item => item.id === editingId);
  const classId = existing?.classId ?? params.get("classId") ?? "";
  if (editingId && (!existing || (params.has("classId") && params.get("classId") !== existing.classId)))
    return <div className="panel p-8"><h1 className="text-xl font-bold">Không tìm thấy bộ thử thách</h1><Link className="btn-secondary mt-4" to="/instructor/challenges">Về bộ thử thách</Link></div>;
  return <ChallengeEditor key={editingId ?? "new"} classes={classes} saveAssignment={saveAssignment} initialClassId={classId} existing={existing} />;
}
