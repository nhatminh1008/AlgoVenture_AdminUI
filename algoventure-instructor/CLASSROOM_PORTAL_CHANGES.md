# Classroom Portal Changes

Date: 2026-10-31 (Asia/Saigon).
Branch: feature/instructor-classroom. No commit was created. All application changes are inside algoventure-instructor; 24 authored Admin files were hash-compared and are unchanged. The pre-existing audit report at the Git root was left untouched.

## 1. Files created, modified and deleted

Paths in this inventory are relative to the Instructor root, D:/FPT University/Semester 9/SEP490/WEB_INS_ADMIN_ALGO/AlgoVenture_AdminUI/algoventure-instructor. Deleted filenames are listed for delivery traceability only, not active application dependencies.

| Change | File | Purpose |
|---|---|---|
| Modified | .gitignore | Ignore local visual/print verification artifacts. |
| Created | CLASSROOM_PORTAL_CHANGES.md | This implementation and backend handoff report. |
| Modified | README.md | Usage, repository boundary, policy and safe migration documentation. |
| Modified | src/App.jsx | Instructor-only routes and the unified assignment/learner routes. |
| Created | src/components/AssignmentList.jsx | Unified assignment cards, edit/delete restrictions and search. |
| Created | src/components/AssignmentPreview.jsx | Equal grading, unanswered submissions and post-submit explanations. |
| Modified | src/components/ClassFilter.jsx | Class/assignment URL scope and assignment-title search. |
| Deleted | src/components/ClassMaterials.jsx | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Deleted | src/components/ClassQuizzes.jsx | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Modified | src/components/Layout.jsx | Four-item sidebar, placeholder session and global notices. |
| Deleted | src/components/QuizPreview.jsx | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Created | src/components/ReportViews.jsx | Shared trend, error, learner-grade and print views. |
| Created | src/components/RequireRole.jsx | 403 scaffold restricting Layout to INSTRUCTOR. |
| Modified | src/components/ui.jsx | Reusable page/status/stat/loading/error/empty components. |
| Deleted | src/data/classroom.js | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Modified | src/data/ClassroomContext.jsx | Async repository-driven provider and cross-tab refresh. |
| Deleted | src/data/curriculum.js | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Created | src/data/dates.js | Vietnam datetime conversion and formatting independent of host timezone. |
| Created | src/data/errors.js | Typed repository error codes. |
| Created | src/data/exports.js | CSV/workbook row builders, escaping and download. |
| Created | src/data/localRepository.js | Scoped v2 read-modify-write persistence, validation and backup. |
| Deleted | src/data/materials.js | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Created | src/data/metrics.js | Shared grading, status, best attempts and analytics calculations. |
| Created | src/data/migration.js | One-time v1 MCQ/class/enrollment conversion with invalid-draft flags. |
| Created | src/data/policy.js | Central editable PORTAL_POLICY assumptions. |
| Created | src/data/portalContext.js | Stable context identity and shared hook across hot reloads. |
| Deleted | src/data/quizzes.js | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Created | src/data/repository.js | JSDoc async interface, default adapter and exact game projections. |
| Created | src/data/seed.js | Deterministic curriculum questions and relative-deadline attempt fixtures. |
| Created | src/data/session.js | Clearly marked placeholder instructor session. |
| Created | src/data/validators.js | Class/question/assignment validation, invite codes and edit rules. |
| Modified | src/index.css | Dedicated A4 landscape print stylesheet. |
| Modified | src/pages/Analytics.jsx | Attempt-derived completion, score distribution, errors and trends. |
| Created | src/pages/AssignmentDetail.jsx | Unified assignment detail and instructor preview. |
| Created | src/pages/AssignmentEditor.jsx | Four-option authoring, explicit migration repair and metadata-only edits. |
| Deleted | src/pages/ChallengeSets.jsx | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Modified | src/pages/ClassDetail.jsx | Invite card, two keyboard-accessible tabs and cascade confirmation. |
| Modified | src/pages/Classes.jsx | Classroom overview and search. |
| Modified | src/pages/ClassForm.jsx | Class title and optional unrestricted metadata. |
| Modified | src/pages/ExportResults.jsx | Gradebook/question reports as CSV and print/PDF. |
| Created | src/pages/LearnerDetail.jsx | Individual best results, trends and wrong/blank questions. |
| Modified | src/pages/Progress.jsx | Published learner-by-assignment matrix and summary cards. |
| Deleted | src/pages/QuizDetail.jsx | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Deleted | src/pages/QuizEditor.jsx | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Deleted | tests/classroom.test.js | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Created | tests/helpers.js | Injectable fixed clock, memory storage and repository fixtures. |
| Created | tests/policy.test.js | Pure policy, DTO, date, analytics and export tests. |
| Deleted | tests/quizzes.test.js | Removed obsolete workflow or tests, replaced by the unified assignment implementation. |
| Created | tests/repository.test.js | Migration, corruption, ownership, concurrency and deletion tests. |

No package/dependency or lockfile change was made. Local QA outputs under .qa are ignored; they are not production assets. The old IndexedDB database is never opened or deleted by the new code.

## 2. How to use it and demo flows

Run npm run dev in the Instructor root. Verification instance: http://127.0.0.1:5180/classes. No external service is required.

The sidebar is Lớp học / Tiến độ / Phân tích / Xuất kết quả. Class details contain Bài tập and Học viên; the invite card is above the tabs. Left/Right and Home/End navigate the tabs. Class and assignment URLs use the requested assignments terminology.

On a fresh origin without either persistence key:

| Classroom | Code | Enrollments |
|---|---|---|
| DSA 2026 — Sorting Foundations | DSA2026 | 3 |
| DSA 2026 — Data Structures | SORT101 | 3 |
| DSA 2026 — Graph Exploration | TREE2026 | 2 |

Each class has two published assignments plus one draft, each with five technically authored Vietnamese DSA questions. Seed content covers the five sorting algorithms, Linear/Binary Search, Stack/Queue, Linked List, BST, BFS/DFS/Dijkstra and graph representations. There are 13 seeded attempts across the classes.

The initial open assignment is due three hours after first seed load; the other published assignment expired yesterday; draft deadline is a week later. Deadlines persist rather than shifting on refresh. The seeded records expose not-started, submitted once, improvement after retaking, perfect and low scores, overdue without submission and frequently missed questions. All displayed statistics are calculated from these attempt records, not live backend learner data.

Flow:

1. Create a class, optionally set topic/level, and copy its generated invite code. Clipboard API is preferred; selection/native-copy fallback explains manual copy if needed.
2. New classes have zero learners. The portal does not enroll anyone; use a seeded class to inspect existing learner data. Learners join using the game/backend.
3. Create Bài tập under a class. Add/remove/reorder questions. Exactly four choices are editable, one is correct, and explanation is mandatory to publish.
4. Save incomplete work as draft, or publish with a future Vietnam date and time. A set belongs to one class. Drafts remain absent from progress/analytics.
5. Preview allows blank answers, grades them as wrong and reveals correct answers/explanations only after submission. Preview does not write an Attempt.
6. Progress uses ?classId= and optional &assignmentId=, with learner search/status filtering and assignment-title search in the chooser. It shows status, best percentage, correct/total, attempt count, last submission and per-assignment completion.
7. Analytics shows completion and mean best score, five-bucket score distribution, most-missed questions, submission-day trend and links to individual learner analysis.
8. Export a selected gradebook or question-error report as CSV. Lưu thành PDF invokes window.print; choose the browser's PDF destination. Print styling removes navigation/controls and repeats table headers.
9. Delete a class only after confirming enrollment/assignment/attempt counts; its dependent records are deleted together.

Use the same scheme/hostname/port as an earlier portal to see its local v1 data. Browser origins have separate storage; a new testing origin shows fresh seeds. Do not clear real user storage to force a demo.

## 3. PORTAL_POLICY assumptions

Change src/data/policy.js, then rerun tests. Current explicit values:

| Policy | Value |
|---|---|
| optionsPerQuestion | 4 |
| maxQuestions | 50 |
| explanationRequired | true |
| timezone | Asia/Ho_Chi_Minh |
| defaultDueTime | 23:59 |
| scoreBuckets | 5 |
| inviteCodeLength | 8 |
| inviteAlphabet | A–Z and 2–9 excluding I/O; six-to-eight-character legacy seed codes are accepted |
| allowAttemptAtDeadline | true: exactly dueAt is still allowed; strictly after is overdue |
| lockQuestionsAfterFirstAttempt | true: includes question IDs/order, prompts, choices, answer indices and explanations |
| allowPublishedDeletionWithoutAttempts | true |
| questionErrorDenominator | submitted_learners |

Game policy remains equal scoring: correctCount/total and round(100*correctCount/total), unlimited retakes until the deadline, best attempt counts, null/missing answers are wrong. Best-score ties choose the most recent attempt deterministically. The portal never submits learner attempts, so actual attempt acceptance must be enforced by the game/backend; canSubmit is the shared pure deadline helper.

Drafts allow incomplete content. A published assignment with zero attempts can be fully edited, unpublished or deleted. After an attempt, only title/description/deadline can change and deletion is blocked. A newly published assignment or changed published deadline must be in the future; an unchanged expired deadline does not prevent a title/description correction.

Date/time inputs are interpreted in Asia/Ho_Chi_Minh regardless of device timezone, and persist as ISO UTC. New editor deadlines default to tomorrow at 23:59. Existing second/millisecond precision is preserved during metadata-only saves.

Completion denominator is the currently enrolled roster. Most-missed percentages exclude learners with no attempt and use each submitted learner's best attempt, counting wrong or blank. Distribution counts one best result per learner–assignment pair. Trend includes every submission/retake grouped by Vietnam calendar date, not a fabricated mastery estimate.

## 4. Migration and persistence safety

The new adapter writes algoventure.instructor.classrooms.v2. It does not write or remove algoventure.instructor.classrooms.v1.

When v2 does not exist:

- With no v1, create the relative-date seed once.
- With v1, convert classes (name to title, owner display name and generated code), students to enrollments, and old MCQ records to assignments. Old game-practice records are not imported.
- Preserve the order and text of legacy answer options. Map correct option IDs to the correctIndex in that preserved order.
- A non-four-option question is kept with migrationInvalid in a draft, plus visible repair guidance. Nothing is automatically padded or trimmed. Instructors explicitly remove an extra option or add a missing one before publishing.
- Other incomplete legacy questions become drafts too. Old grading/resource metadata is omitted when constructing v2 records.
- Date-only deadlines become 23:59 Vietnam time and UTC ISO. Valid already-published historical assignments can remain expired/published rather than being discarded.
- Missing enrollment joinedAt uses the migration clock as an estimated timestamp; this cannot reconstruct a historical enrollment date.

For v2, validation is per record. Only invalid records and dependent orphan records are dropped, with notices. One bad record does not restore the entire fixture dataset.

An unreadable JSON/envelope is copied verbatim to algoventure.instructor.classrooms.v2.corrupt-<timestamp> before seeding. Backup failure stops replacement; writes report STORAGE errors and never falsely succeed. Existing v1 and old browser databases remain untouched.

Each mutation reads the latest persisted payload and validates ownership inside the operation, without awaiting between read and commit. Provider state is not the write source. Storage events refresh other tabs. This is not a cross-process transactional database; a production adapter needs server transactions and version checks.

## 5. Verification results and unverified areas

- npm test: 28/28 passed.
- npm run lint: passed.
- npm run build: passed; production chunks were generated without the earlier oversized-entry warning.
- git diff --check: passed; Git only emits normal LF/CRLF conversion notices.
- package.json/package-lock.json: unchanged; no new runtime or development dependency.
- Admin: 24 authored files hash-compared, zero changes.

Browser checks on local development and production builds:

- Create a class and get an eight-character valid code; clipboard copy and keyboard class tabs.
- Create/publish a four-option assignment with explanation; unanswered instructor preview produces 0%, without storing a learner submission.
- Seeded progress shows all three statuses, 80%/100%/low scores, retakes and correct last submission times.
- Published questions with attempts are disabled while metadata remains editable.
- Editing an overdue assignment's title works without accidentally changing/truncating its deadline.
- Assignment scope changes the URL and matrix columns; drafts are excluded.
- Distribution bars, trend chart, most-missed table and individual learner route render with attempt data.
- Gradebook CSV retains BOM and actual computed results; question-error CSV downloads.
- PDF action calls print; print media hides the sidebar and controls; a local QA PDF was generated.
- Six main mobile routes at 390px had no page-level horizontal overflow; native result tables scroll within their panels.
- Deleting a class confirms the exact dependent counts.
- Browser migration retained five legacy options until explicit repair to four; original v1 raw text was unchanged.

No final-production JavaScript errors were observed. An intermediate development hot-reload context mismatch was fixed by separating the stable context instance; production checks were repeated afterward.

Unverified: actual learner-game end-to-end exchange, remote API/auth, server-side deadline enforcement, native OS print-dialog destination choice and cross-device persistence. No external API was called.

XLSX: intentionally not implemented under the permitted fallback. No small library's current high-severity advisory status was established during this local-only implementation, so no library was added. New dependency name/version/license: N/A. CSV and print/PDF ship; buildWorkbookRows already produces separate gradebook/question-error arrays for a future reviewed XLSX adapter.

## 6. Backend requirements derived from the repository

These are PROPOSED endpoints, not implemented or called by this portal. Replace only classroomRepository in src/data/repository.js with an async HTTP implementation. Pages consume the interface via ClassroomProvider and do not access browser persistence.

### DTOs

- Session: {userId,name,role}; authenticated role must come from the server, not the current placeholder.
- ClassroomOwner: {id,title,instructorId,instructorName,inviteCode,description?,topicId?,level?,createdAt?}.
- Enrollment: {id,classroomId,learnerId,learnerName,learnerEmail,joinedAt}.
- ChoiceQuestion: {id,prompt,options:string[4],correctIndex:0..3,explanation}.
- AssignmentOwner: {id,classroomId,title,description?,dueAt:ISO,questions:ChoiceQuestion[],status:draft|published,createdAt?,updatedAt?}.
- AttemptPortal: {id,assignmentId,learnerId,submittedAt,answers:[{questionId,selectedIndex:number|null}],correctCount,total,scorePercent}.
- LearnerClassroom: exactly {id,title,instructorName,joinedAt}, using that learner's enrollment timestamp.
- LearnerAssignment: exactly {id,classroomId,title,description?,dueAt,questions}; never return drafts or owner metadata.
- LearnerAttempt: exactly {id,assignmentId,submittedAt,answers,correctCount,total,scorePercent}; server derives learner identity.

Common failure envelope: {code,message,details?}. Proposed HTTP mapping: 401 for no authenticated session, 403 FORBIDDEN for wrong role/ownership, 404 NOT_FOUND for missing records, 422 VALIDATION, 409 LOCKED for prohibited historical edits/deletes. STORAGE is local-only; remote adapters should normalize availability failures. Production must repeat validation and ownership in the backend.

### Instructor repository methods

| Method | Proposed REST endpoint | Request | Response | Role/ownership and errors |
|---|---|---|---|---|
| listClassrooms() | GET /api/instructor/classrooms | No body | ClassroomOwner[] | INSTRUCTOR; filter by authenticated user; 401/403 |
| getClassroom(id) | GET /api/instructor/classrooms/{id} | Path id | ClassroomOwner | Owner required; 403/404 |
| createClassroom(input) | POST /api/instructor/classrooms | {title,description?,topicId?,level?} | 201 ClassroomOwner | Owner/name from session; server generates globally unique code; 422 duplicate/invalid title |
| updateClassroom(id,input) | PATCH /api/instructor/classrooms/{id} | {title,description?,topicId?,level?} | ClassroomOwner | Owner; cannot replace owner/code; 403/404/422 |
| deleteClassroom(id) | DELETE /api/instructor/classrooms/{id} | No body | 204 | Owner; transactionally cascade enrollments, assignments, attempts; 403/404 |
| listEnrollments(classroomId) | GET /api/instructor/classrooms/{id}/enrollments | Class path | Enrollment[] | Owner; 403/404; no Instructor enrollment-creation endpoint |
| listAssignments(classroomId) | GET /api/instructor/classrooms/{id}/assignments | Class path | AssignmentOwner[] including drafts | Owner; 403/404 |
| getAssignment(id) | GET /api/instructor/assignments/{id} | Assignment path | AssignmentOwner | Resolve parent owner; 403/404 |
| saveAssignment(input,id?) | POST /api/instructor/classrooms/{id}/assignments for create; PUT /api/instructor/assignments/{id} for update | {classroomId,title,description?,dueAt,status,questions} | 201/200 AssignmentOwner | Owner; immutable parent class; preserve stable question IDs; future deadline on publish/change; historical-content lock; 403/404/409/422 |
| deleteAssignment(id) | DELETE /api/instructor/assignments/{id} | Assignment path | 204 | Owner; draft or zero attempts only; 403/404/409 |
| listAttempts({classroomId,assignmentId?}) | GET /api/instructor/classrooms/{id}/attempts?assignmentId=... | Optional assignment filter | AttemptPortal[] | Owner; filtered assignment must belong to that class; published only; 403/404 |

The optional subscribe/getNotices hooks are adapter conveniences, not required REST endpoints. Client-side reporting can continue consuming listAttempts; no separate analytics API is required for the current scale. Later server aggregation should reuse the same policy definitions.

### Game-facing endpoints needed from the same backend

| Operation | Proposed endpoint | Request | Response and policy |
|---|---|---|---|
| Join by code | POST /api/learner/classrooms/join | {inviteCode} | LearnerClassroom; LEARNER only, normalize case/whitespace, validate 6–8 alphanumerics; unknown code 404, invalid 422; repeated join should preserve original joinedAt |
| List my classrooms | GET /api/learner/classrooms | No body | LearnerClassroom[] for authenticated enrollments only |
| List assignments | GET /api/learner/classrooms/{id}/assignments | Class path | LearnerAssignment[]; enrollment required, published only; 403/404 |
| Get assignment | GET /api/learner/assignments/{id} | Assignment path | LearnerAssignment; enrollment and publication check; draft behaves unavailable |
| Submit attempt | POST /api/learner/assignments/{id}/attempts | {answers:[{questionId,selectedIndex:number|null}]} | 201 LearnerAttempt; bind learner on server, grade on server, unlimited retakes while serverNow <= dueAt; reject later with 409 DEADLINE_PASSED; invalid IDs/indexes 422 |
| List my attempts | GET /api/learner/assignments/{id}/attempts | Assignment path | LearnerAttempt[] scoped to current learner; membership/publication enforced |

Never trust client-supplied learnerId, score, totals or submission timestamps. Submission retry/idempotency behavior and server transactions should be designed together before integration.

The requested learner Assignment/ChoiceQuestion contract includes correctIndex and explanation. This implementation hides their visual display until instructor-preview submission, but data already containing answer keys is not confidential. Production must decide whether learner delivery is redacted and review answers returned after submission, or whether the current local-grading contract remains acceptable. This cannot be solved by the Instructor UI alone.

## 7. Known gaps and decisions

- XLSX remains an explicit permitted gap. No dependency/advisory/license claim is fabricated.
- This is an Instructor-local repository and authorization scaffold, not a login system or shared backend. Invites only become usable across devices after game/backend integration. Admin all-classrooms management was intentionally not implemented.
- Missing legacy join timestamps use migration time; historical times cannot be recovered.
- Default deadline date is tomorrow; default time is the specified 23:59.
- Equal best-score ties choose the latest submission; error percentages use submitted learners; trend uses all attempts. These are labeled reporting assumptions.
- Topic/level are optional owner metadata; no topic locks and no metadata leakage into game DTOs.
- Published zero-attempt assignments may be returned to draft; after attempts, publication/content/history are preserved.
- New classes are not given fabricated enrollments or submissions. Seeded classes demonstrate populated reports.
- Roster completion uses all current enrollments, including learners who joined after an assignment was published. A future product decision may freeze recipient rosters.
- No automatic enrollment management, backend polling, shared-device synchronization, authentication, server submission endpoint or historical audit log is claimed.
- Simultaneous browser-process writes still need server-side transactions/version conflict handling for production.
- Browser data is per origin; using a different dev hostname/port does not transfer old local records.
- Old browser databases are deliberately left intact despite removal of their UI. No destructive browser migration is performed.

