# AlgoVenture Instructor Classroom Portal

React/JavaScript + Vite + Tailwind CSS. The portal runs locally without backend services. The current user is an explicitly labeled placeholder in `src/data/session.js`; the route guard permits only `INSTRUCTOR`. Real authentication and authorization must come from the backend later.

## Run and verify

```sh
npm run dev
npm test
npm run lint
npm run build
```

Use the URL printed by Vite. The repository has no API credentials or runtime environment variables. No additional dependency was added for the Classroom changes.

## Demo

On a new browser origin with no existing data, three classes have invite codes `DSA2026`, `SORT101`, `TREE2026`. There are eight enrolled learners, two published assignments and one draft per class, each with five curriculum questions. Initial deadlines are relative to the first load: one assignment is due in three hours and one expired yesterday. They persist thereafter; refreshing does not move deadlines. Seed submissions demonstrate improvement, perfect/low scores and unanswered questions.

1. Open **Lớp học**, create a class and copy its generated invite code.
2. Open a seeded class to inspect enrolled learners; the portal never enrolls learners. Joining is a game/backend operation.
3. Create **Bài tập** with exactly four choices and a required explanation per question. Save an incomplete draft or publish with a future Vietnam deadline.
4. **Xem trước** allows unanswered submissions and shows scores/explanations only after submission; preview never saves attempts.
5. Open **Tiến độ** to see learner-by-assignment statuses, best scores, counts, completion and last submission times. Drafts are excluded.
6. **Phân tích** shows completion, score distribution, most-missed questions, submission-day trends and individual learner views.
7. **Xuất kết quả** exports gradebook or question errors as CSV, or uses **Lưu thành PDF** to print the selected report. XLSX is an explicit remaining gap; no unverified spreadsheet dependency was installed.

New classes intentionally start with no enrollments or attempts. For a demo with existing learner data use a seeded class, not a newly created class.

## Repository boundary

`src/data/repository.js` documents the async interface, JSDoc records, default adapter and exact learner DTO projections. `localRepository.js` implements scoped reads/writes. Replacing the default adapter with an HTTP repository keeps pages unchanged. `ClassroomProvider` loads through the repository, exposes async actions and refreshes cross-tab changes. Pages do not access browser persistence.

Classroom owner records add `instructorId`, `inviteCode` and optional descriptive metadata to the public view. `joinedAt` comes from an enrollment, never class creation. Assignments have `classroomId`, `dueAt`, `questions` and portal-only `status` (`draft`/`published`); learner projections exclude drafts and portal metadata. Question answer keys are available to the instructor. A production learner API must resolve the security implications of including answer keys in the supplied learner contract.

All reads/writes enforce the placeholder session role and class ownership. Errors include `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `LOCKED`, `STORAGE`. Storage operations synchronously read the current payload and commit it within each mutation, rather than saving React snapshots. This avoids stale state across awaited operations; simultaneous browser processes still need backend transactions for strong concurrency guarantees.

## Policy and migration

`src/data/policy.js` is the policy source. Four choices, up to 50 questions, required explanation, Asia/Ho_Chi_Minh, default 23:59, five histogram buckets and eight-character generated codes are configurable there. Existing seed codes remain valid six-to-eight-character alphanumerics. Generated codes exclude ambiguous characters. Best score counts; null answers count as wrong; deadline equality is allowed, strictly later is overdue. Question content and deletion lock after the first attempt; metadata and deadline remain editable. Changing a published deadline requires a future value. A draft can be incomplete.

The adapter writes only `algoventure.instructor.classrooms.v2`. If v2 is absent and v1 exists, it migrates class records, memberships and old MCQ records once, leaving v1 unchanged. Unsupported old workflow records are not carried forward. Date-only deadlines become 23:59 Vietnam time in UTC. A legacy question with a different number of choices is preserved verbatim in a flagged draft and must be explicitly repaired by the instructor; it is not automatically shortened or extended. Legacy missing enrollment timestamps use the migration clock and are a documented estimate.

Validation is per record: invalid records and dependent orphan records are dropped with a notice while valid records survive. An unreadable payload is copied to `algoventure.instructor.classrooms.v2.corrupt-<timestamp>` before replacement. Backup/write failure surfaces an error and does not report success. Removed browser databases from earlier versions are never deleted. This version does not use IndexedDB.

## Tests

`tests/policy.test.js` covers grading, status/deadline boundary, best attempts, completion, distributions, error statistics, trends, validators, invite codes, Vietnam time, DTOs and CSV/workbook row builders. `tests/repository.test.js` covers migration, data repair, storage failure/backup, ownership, post-attempt locks, UTC normalization and cascade deletion. The clock and storage are injectable. Browser verification covers the main workflow, mobile overflow, migration repair, clipboard fallback and print styling.
