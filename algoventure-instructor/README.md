# AlgoVenture Instructor Portal

Instructor frontend for the AlgoVenture registration's UC9: prepare challenge sets, assign practice, monitor classes, review analytics, and export results.

## Run locally

```sh
npm install
npm run dev
```

```sh
npm test
npm run lint
npm run build
```

## Classroom workflow

- `/classes`: classes belonging to the current demo instructor, with search, topic and level filters.
- `/classes/new`: create a class with a name, one DSA topic, Basic/Advanced level, and learning objectives.
- `/classes/:classId`: class information, assignments, members and available lesson content.
- `/classes/:classId/edit`: update class metadata. A topic cannot change after a challenge set has been created for the class.
- `/challenges?classId=...`: create a draft or publish a challenge set; only lessons from the selected class topic are available. Published content is read-only.
- `/progress`, `/analytics`, `/export`: accept the same `classId` query parameter. New classes have empty membership and no fabricated performance data.

Topics follow the registration: Sorting, Searching, Data Structures, Graphs/Pathfinding. The catalog in `src/data/curriculum.js` uses the 25 lesson IDs currently present in the learner game's `learningTrack.ts`. Basic/Advanced is the class's instructional level requested for this portal, separate from game difficulty and KT mastery. It does not automatically change the game's configuration or filter out lessons.

## Current data boundary

This repository has no classroom backend integration or real instructor authentication. The existing sample instructor is retained as `instructor-demo`. Filtering by this ID is frontend organization, not server authorization.

`ClassroomContext.jsx` provides shared classroom, membership and assignment state. `classroom.js` contains validation, demo fixtures and persistence helpers. Changes persist in browser localStorage under `algoventure.instructor.classrooms.v1`. Storage failures are surfaced and a failed write does not report a successful save. Clearing browser storage removes local changes. Sample data loads on first use; new classes start with zero members and no assignments.

Publishing an assignment currently updates the local preview only; it does not send work to the game. Joining classes, live attempts, completion tracking and Knowledge Tracing analytics require backend and game integration. Existing example scores are explicitly labeled illustrative, never treated as mastery or completion. CSV/JSON exports include these labels and only the selected classes' sample records.

For integration, replace the provider's persistence functions with authenticated classroom and assignment APIs, load the instructor from the authenticated session, and validate ownership on the server. Keep stable lesson IDs and separate class level, assignment settings, game results and KT estimates. Preserve published assignment content versions when receiving real attempts.

## Class materials and multiple choice quizzes

Class detail now includes **Tài liệu** and **Trắc nghiệm** tabs. Instructors can upload PDF, DOCX, PPTX and TXT files up to 10 MB each, add a display title and description, download the original file, or delete unreferenced files. The actual file Blob and its metadata persist together in IndexedDB (`algoventure.instructor.materials`); files are not uploaded to a server or parsed to generate questions.

Quiz routes: `/classes/:classId/quizzes/new`, `/classes/:classId/quizzes/:quizId`, and `/classes/:classId/quizzes/:quizId/edit`. A quiz belongs to one class, can reference that class's materials, and contains up to 50 questions. Each question has 2–6 options, one correct answer, an optional explanation and 1–20 points. Questions can be reordered and options added or removed. Removing the correct option requires selecting a replacement before publication.

Drafts allow unfinished questions. Publishing validates every question, freezes the saved content and only assigns within the local preview. The instructor can preview a complete quiz, answer it and see weighted scores and explanations. Preview attempts never enter student results. Actual student delivery, submission storage and server grading remain backend/game integration work. Attached material existence is checked on save; documents referenced by quizzes cannot be deleted. Files have to be removed from draft references first; published references remain preserved.

Quiz records share the classroom localStorage payload. Existing saved classes migrate with an empty quiz list. Classroom and quiz changes propagate to other open tabs using storage events. File lists can refresh after returning from the materials tab or with **Làm mới danh sách tài liệu**. Do not treat local data or answer keys in this instructor preview as a secure student assessment API.

## Verification

The Node tests cover catalog identity, class validation, duplicate names, assignment/topic consistency, storage recovery and CSV escaping. Browser checks additionally cover creating and editing classes, reload persistence, topic/level filtering, draft/publish flows, empty class reports, downloads, unavailable storage, and desktop/mobile layouts.
