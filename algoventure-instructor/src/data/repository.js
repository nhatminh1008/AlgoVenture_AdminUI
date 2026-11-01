import { createLocalRepository } from "./localRepository.js";
import { PORTAL_SESSION } from "./session.js";
export { ClassroomRepoError } from "./errors.js";

/** @typedef {{id:string,title:string,instructorId:string,instructorName:string,inviteCode:string,description?:string,topicId?:string,level?:string,createdAt?:string}} Classroom Portal owner view; joinedAt belongs to Enrollment, never class creation. */
/** @typedef {{id:string,classroomId:string,learnerId:string,learnerName:string,learnerEmail:string,joinedAt:string}} Enrollment */
/** @typedef {{id:string,prompt:string,options:[string,string,string,string],correctIndex:number,explanation:string}} ChoiceQuestion Complete published questions match the game. Legacy invalid drafts may carry migrationInvalid. */
/** @typedef {{id:string,classroomId:string,title:string,description?:string,dueAt:string,questions:ChoiceQuestion[],status:'draft'|'published',createdAt?:string,updatedAt?:string}} Assignment */
/** @typedef {{id:string,assignmentId:string,learnerId:string,submittedAt:string,answers:{questionId:string,selectedIndex:number|null}[],correctCount:number,total:number,scorePercent:number}} Attempt */
/**
 * Async, instructor-scoped repository. Throw ClassroomRepoError with FORBIDDEN,
 * NOT_FOUND, VALIDATION, LOCKED or STORAGE. Returns detached records.
 * listClassrooms(): Promise<Classroom[]>
 * getClassroom(id): Promise<Classroom>
 * createClassroom(input): Promise<Classroom>
 * updateClassroom(id,input): Promise<Classroom>
 * deleteClassroom(id): Promise<void> (cascade)
 * listEnrollments(classroomId): Promise<Enrollment[]>
 * listAssignments(classroomId): Promise<Assignment[]> (includes owner drafts)
 * getAssignment(id): Promise<Assignment>
 * saveAssignment(input,id?): Promise<Assignment>
 * deleteAssignment(id): Promise<void>
 * listAttempts({classroomId,assignmentId?}): Promise<Attempt[]>
 * Optional subscribe(listener): unsubscribe; getNotices(): string[].
 * An HTTP adapter replaces the exported instance; pages need no changes.
 */
export const classroomRepository = createLocalRepository({
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
  session: PORTAL_SESSION,
});

export function toLearnerClassroom(classroom, enrollment) {
  return {
    id: classroom.id,
    title: classroom.title,
    instructorName: classroom.instructorName,
    joinedAt: enrollment.joinedAt,
  };
}
export function toLearnerAssignment(assignment) {
  if (assignment.status !== "published") return null;
  return {
    id: assignment.id,
    classroomId: assignment.classroomId,
    title: assignment.title,
    description: assignment.description,
    dueAt: assignment.dueAt,
    questions: assignment.questions.map(
      ({ id, prompt, options, correctIndex, explanation }) => ({
        id,
        prompt,
        options: [...options],
        correctIndex,
        explanation,
      }),
    ),
  };
}
export function toLearnerAttempt({
  id,
  assignmentId,
  submittedAt,
  answers,
  correctCount,
  total,
  scorePercent,
}) {
  return {
    id,
    assignmentId,
    submittedAt,
    answers,
    correctCount,
    total,
    scorePercent,
  };
}
