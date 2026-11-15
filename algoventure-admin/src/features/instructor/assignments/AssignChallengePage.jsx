import { useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import { usePagination } from "../../../shared/hooks/usePagination";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { useClassrooms } from "../workspace/ClassroomContext";

export default function AssignChallengePage() {
  const { classId } = useParams();
  return <ChallengeDelivery key={classId} classroomId={classId} />;
}

function ChallengeDelivery({ classroomId }) {
  const text = useText();
  const navigate = useNavigate();
  const location = useLocation();
  const { classes, students, assignmentTemplates, lessonName, deliverAssignment } = useClassrooms();
  const classroom = classes.find((item) => item.id === classroomId);
  const roster = students.filter((student) => student.classId === classroomId);
  const classPath = "/instructor/classes/" + classroomId;
  const { back, childState } = useInstructorNavigation(classPath);
  const [assignmentTemplateId, setAssignmentTemplateId] = useState("");
  const [selectingRecipients, setSelectingRecipients] = useState(false);
  const [recipientUserIds, setRecipientUserIds] = useState(null);
  const [due, setDue] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const deliveryRequest = useRef(null);
  const selected = assignmentTemplates.find((item) => item.id === assignmentTemplateId);
  const search = query.trim().toLocaleLowerCase("vi");
  const matchingTemplates = assignmentTemplates.filter((item) => item.title.toLocaleLowerCase("vi").includes(search));
  const pagination = usePagination(matchingTemplates, search);
  const selectedUserIds = roster.filter((student) => recipientUserIds?.has(student.userId)).map((student) => student.userId);
  const allSelected = roster.length > 0 && selectedUserIds.length === roster.length;
  const showRecipients = selectingRecipients && Boolean(selected);

  function next() {
    setRecipientUserIds((previous) => previous ?? new Set(roster.map((student) => student.userId)));
    setSelectingRecipients(true);
  }

  function toggleRecipient(userId) {
    setRecipientUserIds((previous) => {
      const next = new Set(previous);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    setError("");
  }

  async function deliver(event) {
    event.preventDefault();
    if (!selected || !classroom || classroom.archivedAt || !due || !selectedUserIds.length || submitting.current) return;
    const values = { assignmentTemplateId, due, recipientUserIds: [...selectedUserIds].sort() };
    const signature = JSON.stringify(values);
    if (deliveryRequest.current?.signature !== signature) {
      deliveryRequest.current = { signature, id: crypto.randomUUID() };
    }
    submitting.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      const assignment = await deliverAssignment(classroomId, { ...values, deliveryRequestId: deliveryRequest.current.id });
      const message = text("Đã giao bộ thử thách cho", "Challenge set assigned to") + " "
        + assignment.recipientCount + " " + text("sinh viên", "students") + ".";
      navigate(back.to, { replace: true, state: { ...back.state, message } });
    } catch (failure) {
      setError(failure.message);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (!classroom || classroom.archivedAt) {
    return (
      <div className="panel p-8">
        <InstructorBackLink destination={back} />
        <h1 className="text-xl font-bold">{text(classroom ? "Lớp học đã lưu trữ." : "Không tìm thấy lớp học")}</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {showRecipients ? (
        <InstructorBackLink onBack={() => { if (!isSubmitting) setSelectingRecipients(false); }}>
          {text("Quay lại chọn đề", "Back to template selection")}
        </InstructorBackLink>
      ) : <InstructorBackLink destination={back}>{classroom.name}</InstructorBackLink>}
      <PageHeader title={showRecipients ? text("Chọn sinh viên", "Select students") : text("Giao thử thách")} />
      {location.state?.message && !showRecipients && <p role="status" className="mb-5 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink">{location.state.message}</p>}
      {showRecipients ? (
        <form onSubmit={deliver}>
          <fieldset className="panel space-y-5 p-5" disabled={isSubmitting}>
            <p className="font-semibold">{selected.title} · {classroom.name}</p>
            {roster.length ? (
              <div className="space-y-3">
                <label className="flex items-center gap-3 font-semibold">
                  <input type="checkbox" checked={allSelected} onChange={(event) => {
                    setRecipientUserIds(new Set(event.target.checked ? roster.map((student) => student.userId) : []));
                    setError("");
                  }} />
                  {text("Chọn cả lớp", "Select the whole class")}
                  <span className="text-sm font-normal text-portal-muted">{selectedUserIds.length}/{roster.length}</span>
                </label>
                <ul className="max-h-96 overflow-auto divide-y divide-portal-line rounded-lg border border-portal-line">
                  {roster.map((student) => (
                    <li key={student.id}>
                      <label className="flex cursor-pointer flex-wrap items-center gap-3 p-3">
                        <input type="checkbox" checked={recipientUserIds.has(student.userId)}
                          onChange={() => toggleRecipient(student.userId)} />
                        <span>{student.name}</span>
                        <span className="text-sm text-portal-muted">{student.email}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : <p className="text-sm text-portal-muted">{text("Chưa có sinh viên tham gia")}</p>}
            <label className="block max-w-xs">
              <span className="field-label">{text("Hạn hoàn thành")}</span>
              <input type="date" className="field" value={due} required onChange={(event) => setDue(event.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button className="btn-primary" type="submit" disabled={!selectedUserIds.length}>
              <Send size={16} aria-hidden="true" />{isSubmitting ? text("Đang lưu…") : text("Giao cho lớp")}
            </button>
          </fieldset>
        </form>
      ) : (
        <section className="panel overflow-hidden" aria-label={text("Chọn bộ thử thách", "Select a challenge set")}>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h2 className="font-semibold">{text("Chọn bộ thử thách", "Select a challenge set")}</h2>
            <input className="field sm:max-w-xs" type="search" value={query}
              aria-label={text("Tìm bộ thử thách")} placeholder={text("Tìm bộ thử thách")}
              onChange={(event) => setQuery(event.target.value)} />
          </div>
          {matchingTemplates.length ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th scope="col">{text("Tên bộ thử thách")}</th><th scope="col">{text("Nội dung")}</th></tr></thead>
                <tbody>
                  {pagination.items.map((template) => (
                    <tr key={template.id}>
                      <td><label className="flex cursor-pointer items-center gap-3">
                        <input type="radio" name="assignmentTemplateId" checked={assignmentTemplateId === template.id}
                          onChange={() => setAssignmentTemplateId(template.id)} />
                        <span className="wrap-anywhere">{template.title}</span>
                      </label></td>
                      <td className="max-w-sm text-xs text-portal-muted">{template.algorithmIds.map(lessonName).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 pb-5">
              <p className="text-sm text-portal-muted">{text(search ? "Không tìm thấy bộ thử thách phù hợp" : "Chưa có bộ thử thách")}</p>
              {!assignmentTemplates.length && <Link to="/instructor/challenges" state={childState} className="btn-secondary mt-3">{text("Bộ thử thách")}</Link>}
            </div>
          )}
          <Pagination pagination={pagination} />
          <div className="flex justify-end border-t border-portal-line p-5">
            <button type="button" className="btn-primary" disabled={!selected} onClick={next}>{text("Chọn sinh viên", "Select students")}</button>
          </div>
        </section>
      )}
    </div>
  );
}
