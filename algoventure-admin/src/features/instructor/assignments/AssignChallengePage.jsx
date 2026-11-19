import { useActionToast } from "../../../shared/components/useActionToast";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { useAuth } from "../../../auth/useAuth";
import { useText } from "../../../preferences/preferencesContext";
import Pagination from "../../../shared/components/Pagination";
import RecordTable from "../../../shared/components/RecordTable";
import { useApiDataWithErrorToast } from "../../../shared/hooks/useApiDataWithErrorToast";
import { usePagination } from "../../../shared/hooks/usePagination";
import { PageHeader } from "../workspace/PageHeader";
import InstructorBackLink from "../workspace/InstructorBackLink";
import { useInstructorNavigation } from "../workspace/useInstructorNavigation";
import { useClassrooms } from "../workspace/useClassrooms";
import InstructorLink from "../workspace/InstructorLink";
import { useInstructorParams } from "../workspace/useInstructorParams";
import { getDeliveredRecipientIds } from "../workspace/instructorWorkspaceService";
import { pendingDelivery } from "./deliveryIntent";

export default function AssignChallengePage() {
  const { classId } = useParams();
  return <ChallengeDelivery key={classId} classroomId={classId} />;
}

function ChallengeDelivery({ classroomId }) {
  const text = useText();
  const toast = useActionToast();
  const { user } = useAuth();
  const { classes, students, assignmentTemplates, lessonName, deliverAssignment } = useClassrooms();
  const classroom = classes.find((item) => item.id === classroomId);
  const roster = students.filter((student) => student.classId === classroomId);
  const { open, finish } = useInstructorNavigation();
  const controls = useInstructorParams("page");
  const stepTemplate = controls.params.get("template");
  const [selectedTemplate, setSelectedTemplate] = useState(stepTemplate ?? "");
  const assignmentTemplateId = stepTemplate ?? selectedTemplate;
  const [recipientUserIds, setRecipientUserIds] = useState(null);
  const [due, setDue] = useState("");
  const query = controls.params.get("q") ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const stepStart = useRef(null);
  const selected = assignmentTemplates.find((item) => item.id === assignmentTemplateId);
  const search = query.trim().toLocaleLowerCase("vi");
  const matchingTemplates = assignmentTemplates.filter((item) => item.title.toLocaleLowerCase("vi").includes(search));
  const pagination = usePagination(matchingTemplates, search, controls);
  const showRecipients = Boolean(stepTemplate && selected);
  const loadRecipients = useCallback(async () => {
    if (!showRecipients) return null;
    return { templateId: stepTemplate, userIds: await getDeliveredRecipientIds(classroomId, stepTemplate) };
  }, [classroomId, showRecipients, stepTemplate]);
  const recipients = useApiDataWithErrorToast(loadRecipients, null);
  const recipientsReady = !recipients.loading && !recipients.error && recipients.data?.templateId === stepTemplate;
  const deliveredIds = new Set(recipientsReady ? recipients.data.userIds : []);
  const eligibleIds = recipientsReady ? roster.map((student) => student.userId).filter((id) => !deliveredIds.has(id)) : [];
  const selectedUserIds = eligibleIds.filter((id) => !recipientUserIds || recipientUserIds.has(id));
  const selectedIds = new Set(selectedUserIds);
  const allSelected = eligibleIds.length > 0 && selectedUserIds.length === eligibleIds.length;

  useEffect(() => {
    stepStart.current?.focus({ preventScroll: true });
  }, [stepTemplate]);

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
    setRecipientUserIds(null);
    const params = new URLSearchParams(controls.params);
    params.set("template", assignmentTemplateId);
    open(`/instructor/classes/${classroomId}/assign?${params}`);
  }

  function toggleRecipient(userId) {
    setRecipientUserIds((previous) => {
      const next = new Set(previous ?? eligibleIds);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function deliver(event) {
    event.preventDefault();
    if (!user?.id || !selected || !classroom || classroom.archivedAt || !due || !selectedUserIds.length || submitting.current) return;
    const values = { assignmentTemplateId, due, recipientUserIds: [...selectedUserIds].sort() };
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const intent = pendingDelivery(window.sessionStorage, user.id, classroomId, values);
      const assignment = await deliverAssignment(classroomId, { ...values, deliveryRequestId: intent.id });
      intent.acknowledge();
      const message = text("Đã giao bộ thử thách cho", "Challenge set assigned to") + " "
        + assignment.recipientCount + " " + text("sinh viên", "students") + ".";
      finish({ message, levels: 2 });
    } catch (failure) {
      toast(failure.message, true);
      if (failure.status === 409) await recipients.refresh();
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
            {recipients.loading && <p role="status">{text("Đang tải danh sách người đã nhận…", "Loading delivery recipients…")}</p>}
            {recipients.error && !recipients.loading && (
              <div role="alert" className="space-y-2">
                <p>{text(recipients.error)}</p>
                <button type="button" className="btn-secondary" onClick={recipients.refresh}>{text("Thử lại")}</button>
              </div>
            )}
            {recipientsReady && (roster.length ? (
              <div className="space-y-3">
                <label className="instructor-pick flex items-center gap-3 font-semibold">
                  <input type="checkbox" checked={allSelected} disabled={!eligibleIds.length} onChange={(event) => {
                    setRecipientUserIds(new Set(event.target.checked ? eligibleIds : []));
                  }} />
                  {text("Chọn tất cả sinh viên chưa nhận", "Select all students who have not received this set")}
                  <span className="text-sm font-normal text-portal-muted">{selectedUserIds.length}/{eligibleIds.length}</span>
                </label>
                {!eligibleIds.length && (
                  <p className="text-sm text-portal-muted">
                    {text("Tất cả sinh viên trong lớp đã nhận bộ này.", "All students in this class have received this set.")}
                  </p>
                )}
                <ul className="instructor-roster max-h-96 overflow-auto rounded-lg border">
                  {roster.map((student) => (
                    <li key={student.id}>
                      <label className="instructor-pick flex cursor-pointer items-center gap-3 p-3">
                        <input type="checkbox" checked={selectedIds.has(student.userId)} disabled={deliveredIds.has(student.userId)}
                          onChange={() => toggleRecipient(student.userId)} />
                        <span className="instructor-recipient inline-flex min-w-0 flex-wrap gap-x-3 wrap-anywhere">
                          <span>{student.name}</span>
                          <span className="text-sm text-portal-muted">{student.email}</span>
                          {deliveredIds.has(student.userId) && (
                            <span className="text-sm text-portal-muted">{text("Đã nhận bộ này", "Already received this set")}</span>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : <p className="text-sm text-portal-muted">{text("Chưa có sinh viên tham gia")}</p>)}
            <label className="block max-w-xs">
              <span className="field-label">{text("Hạn hoàn thành")}</span>
              <input type="date" className="field" value={due} required onChange={(event) => setDue(event.target.value)} />
            </label>
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
