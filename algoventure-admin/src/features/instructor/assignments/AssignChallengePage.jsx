import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { useAuth } from "../../../auth/useAuth";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { usePagination } from "../../../shared/hooks/usePagination";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { useClassrooms } from "../workspace/ClassroomContext";
import InstructorLink from "../workspace/InstructorLink";
import { useInstructorParams } from "../workspace/useInstructorParams";
import { pendingDelivery } from "./deliveryIntent";

export default function AssignChallengePage() {
  const { classId } = useParams();
  return <ChallengeDelivery key={classId} classroomId={classId} />;
}

function ChallengeDelivery({ classroomId }) {
  const text = useText();
  const { user } = useAuth();
  const { classes, students, assignmentTemplates, lessonName, deliverAssignment } = useClassrooms();
  const classroom = classes.find((item) => item.id === classroomId);
  const roster = students.filter((student) => student.classId === classroomId);
  const { open, finish } = useInstructorNavigation();
  const controls = useInstructorParams("page");
  const stepTemplate = controls.params.get("template");
  const [selectedTemplate, setSelectedTemplate] = useState(stepTemplate ?? "");
  const assignmentTemplateId = stepTemplate ?? selectedTemplate;
  const [recipientUserIds, setRecipientUserIds] = useState(() => new Set(roster.map((student) => student.userId)));
  const [due, setDue] = useState("");
  const query = controls.params.get("q") ?? "";
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const stepStart = useRef(null);
  const errorNotice = useRef(null);
  const selected = assignmentTemplates.find((item) => item.id === assignmentTemplateId);
  const search = query.trim().toLocaleLowerCase("vi");
  const matchingTemplates = assignmentTemplates.filter((item) => item.title.toLocaleLowerCase("vi").includes(search));
  const pagination = usePagination(matchingTemplates, search, controls);
  const selectedUserIds = roster.filter((student) => recipientUserIds?.has(student.userId)).map((student) => student.userId);
  const allSelected = roster.length > 0 && selectedUserIds.length === roster.length;
  const showRecipients = Boolean(stepTemplate && selected);

  useEffect(() => {
    stepStart.current?.focus({ preventScroll: true });
  }, [stepTemplate]);

  useEffect(() => {
    if (error && window.matchMedia("(max-width: 600px)").matches) {
      errorNotice.current?.scrollIntoView({ block: "center" });
    }
  }, [error]);

  const columns = [
    {
      key: "name", title: text("Tên bộ thử thách"), layout: "primary",
      render: (template) => (
        <label className="instructor-pick flex cursor-pointer items-center gap-3">
          <input type="radio" name="assignmentTemplateId" checked={assignmentTemplateId === template.id}
            onChange={() => setSelectedTemplate(template.id)} />
          <span className="wrap-anywhere">{template.title}</span>
        </label>
      ),
    },
    {
      key: "lessons", title: text("Nội dung"), layout: "wide", className: "max-w-sm text-xs text-portal-muted",
      render: (template) => template.algorithmIds.map(lessonName).join(", "),
    },
  ];

  function next() {
    const params = new URLSearchParams(controls.params);
    params.set("template", assignmentTemplateId);
    open(`/instructor/classes/${classroomId}/assign?${params}`);
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
    if (!user?.id || !selected || !classroom || classroom.archivedAt || !due || !selectedUserIds.length || submitting.current) return;
    const values = { assignmentTemplateId, due, recipientUserIds: [...selectedUserIds].sort() };
    submitting.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      const intent = pendingDelivery(window.sessionStorage, user.id, classroomId, values);
      const assignment = await deliverAssignment(classroomId, { ...values, deliveryRequestId: intent.id });
      intent.acknowledge();
      const message = text("Đã giao bộ thử thách cho", "Challenge set assigned to") + " "
        + assignment.recipientCount + " " + text("sinh viên", "students") + ".";
      finish({ message, levels: 2 });
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
        <InstructorBackLink />
        <h1 className="text-xl font-bold">{text(classroom ? "Lớp học đã lưu trữ." : "Không tìm thấy lớp học")}</h1>
      </div>
    );
  }

  return (
    <div className="instructor-authoring mx-auto max-w-6xl" ref={stepStart} tabIndex={-1}>
      <InstructorBackLink>{stepTemplate ? text("Quay lại chọn đề", "Back to template selection") : classroom.name}</InstructorBackLink>
      <PageHeader title={showRecipients ? text("Chọn sinh viên", "Select students") : text("Giao thử thách")} />
      {stepTemplate && !selected ? (
        <p role="alert" className="panel p-5">{text("Không tìm thấy bộ thử thách")}</p>
      ) : showRecipients ? (
        <form onSubmit={deliver}>
          <fieldset className="instructor-compact-panel panel space-y-5 p-5" disabled={isSubmitting}>
            <p className="font-semibold">{selected.title} · {classroom.name}</p>
            {roster.length ? (
              <div className="space-y-3">
                <label className="instructor-pick flex items-center gap-3 font-semibold">
                  <input type="checkbox" checked={allSelected} onChange={(event) => {
                    setRecipientUserIds(new Set(event.target.checked ? roster.map((student) => student.userId) : []));
                    setError("");
                  }} />
                  {text("Chọn cả lớp", "Select the whole class")}
                  <span className="text-sm font-normal text-portal-muted">{selectedUserIds.length}/{roster.length}</span>
                </label>
                <ul className="instructor-roster max-h-96 overflow-auto rounded-lg border">
                  {roster.map((student) => (
                    <li key={student.id}>
                      <label className="instructor-pick flex cursor-pointer items-center gap-3 p-3">
                        <input type="checkbox" checked={recipientUserIds.has(student.userId)}
                          onChange={() => toggleRecipient(student.userId)} />
                        <span className="instructor-recipient inline-flex min-w-0 flex-wrap gap-x-3 wrap-anywhere">
                          <span>{student.name}</span>
                          <span className="text-sm text-portal-muted">{student.email}</span>
                        </span>
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
            {error && <p ref={errorNotice} role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="instructor-action-bar">
              <InstructorBackLink plain className="btn-secondary">{text("Hủy", "Cancel")}</InstructorBackLink>
              <button className="btn-primary" type="submit" disabled={!selectedUserIds.length}>
                <Send size={16} aria-hidden="true" />{isSubmitting ? text("Đang lưu…") : text("Giao cho lớp")}
              </button>
            </div>
          </fieldset>
        </form>
      ) : (
        <section className="panel overflow-hidden" aria-label={text("Chọn bộ thử thách", "Select a challenge set")}>
          <div className="instructor-compact-panel flex flex-wrap items-center justify-between gap-3 p-5">
            <h2 className="font-semibold">{text("Chọn bộ thử thách", "Select a challenge set")}</h2>
            <input className="field sm:max-w-xs" type="search" value={query}
              aria-label={text("Tìm bộ thử thách")} placeholder={text("Tìm bộ thử thách")}
              onChange={(event) => controls.set("q", event.target.value, true)} />
          </div>
          {matchingTemplates.length ? (
            <RecordTable label={text("Chọn bộ thử thách", "Select a challenge set")} columns={columns} rows={pagination.items} />
          ) : (
            <div className="px-5 pb-5">
              <p className="text-sm text-portal-muted">{text(search ? "Không tìm thấy bộ thử thách phù hợp" : "Chưa có bộ thử thách")}</p>
              {!assignmentTemplates.length && <InstructorLink to="/instructor/challenges" className="btn-secondary mt-3">{text("Bộ thử thách")}</InstructorLink>}
            </div>
          )}
          <Pagination pagination={pagination} />
          <div className="instructor-action-bar flex justify-end border-t border-slate-200 p-5">
            <InstructorBackLink plain className="btn-secondary">{text("Hủy", "Cancel")}</InstructorBackLink>
            <button type="button" className="btn-primary" disabled={!selected} onClick={next}>{text("Chọn sinh viên", "Select students")}</button>
          </div>
        </section>
      )}
    </div>
  );
}
