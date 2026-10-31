import { useCallback, useEffect, useRef, useState } from "react";
import { classroomRepository } from "./repository.js";
import { PORTAL_SESSION } from "./session.js";

import { ClassroomContext } from "./portalContext.js";
export { useClassrooms } from "./portalContext.js";
export function ClassroomProvider({
  children,
  repository = classroomRepository,
  now = () => new Date(),
}) {
  const [state, setState] = useState({
    classrooms: [],
    enrollments: [],
    assignments: [],
    attempts: [],
    loading: true,
    error: "",
    notices: [],
  });
  const [storageError, setStorageError] = useState("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++revision.current;
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const classrooms = await repository.listClassrooms();
      const batches = await Promise.all(
        classrooms.map(async (classroom) => ({
          enrollments: await repository.listEnrollments(classroom.id),
          assignments: await repository.listAssignments(classroom.id),
          attempts: await repository.listAttempts({
            classroomId: classroom.id,
          }),
        })),
      );
      if (request === revision.current) {
        setState({
          classrooms,
          enrollments: batches.flatMap((batch) => batch.enrollments),
          assignments: batches.flatMap((batch) => batch.assignments),
          attempts: batches.flatMap((batch) => batch.attempts),
          loading: false,
          error: "",
          notices: repository.getNotices?.() ?? [],
        });
        setStorageError("");
      }
    } catch (failure) {
      if (request === revision.current) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: failure.message,
        }));
        setStorageError(failure.message);
      }
    }
  }, [repository]);
  useEffect(() => {
    refresh();
    const unsubscribe = repository.subscribe?.(refresh);
    return () => {
      revision.current++;
      unsubscribe?.();
    };
  }, [repository, refresh]);
  async function perform(method, ...args) {
    try {
      const result = await repository[method](...args);
      await refresh();
      return result;
    } catch (failure) {
      if (failure.code === "STORAGE") setStorageError(failure.message);
      throw failure;
    }
  }
  return (
    <ClassroomContext.Provider
      value={{
        ...state,
        session: PORTAL_SESSION,
        storageError,
        refresh,
        now,
        createClassroom: (input) => perform("createClassroom", input),
        updateClassroom: (id, input) => perform("updateClassroom", id, input),
        deleteClassroom: (id) => perform("deleteClassroom", id),
        saveAssignment: (input, id) => perform("saveAssignment", input, id),
        deleteAssignment: (id) => perform("deleteAssignment", id),
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}
