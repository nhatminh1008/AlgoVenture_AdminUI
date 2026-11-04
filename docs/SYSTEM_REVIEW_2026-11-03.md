# System review — 03/11/2026

Reviewed backend, AI service/data preparation, Admin/Instructor portal, and Game.
All confirmed failures in the checks below were resolved and retested.
This was a local functional review; AI predictive quality remains deferred.

## Fixes

- Game now exposes six separate Stack/Queue operations, while backend/Instructor
  still had only the old combined IDs. Added all six to both catalogs. Product
  seeding adds missing algorithm rows at startup without overwriting existing
  content/settings. Kept legacy `stack`/`queue` for previous assignments.
- Classroom previously disabled legacy combined lessons because they no longer
  appear in `ALL_LESSONS`. Added explicit resolution for those two valid IDs;
  unknown lesson IDs remain disabled.
- Added missing English translations for 113 Stack/Queue source locations.
- Updated the navigation test to derive the lesson count from `ALL_LESSONS`.
  Gameplay progress tests now wait for completion synchronization rather than
  assuming that displaying a victory dialog means the server already responded.
- Added catalog consistency coverage, assignment completion coverage for six
  operations, real-backend reload tests, and Classroom navigation coverage for
  current and legacy Stack/Queue lessons.

## Validation

| Area | Result |
| --- | --- |
| Game unit tests | 516 passed across 72 files |
| Backend integration/wire tests | 28 passed |
| AI service incl. actual ONNX | 8 passed |
| Research/data pipeline | 10 passed |
| Admin unit tests | 10 passed |
| Browser scenarios | 74 distinct scenarios verified across runs |
| Game / Admin / backend builds | Passed |

Initial browser batch: 62 passed, 2 failed, 1 skipped. A focused follow-up passed
the two corrected tests, the previously skipped live-auth test, one repeated Peek
scenario, and the new six-operation live test. Eight additional Classroom
operation/legacy navigation cases passed. No full browser suite claim is made:
the selected scenarios cover auth, navigation, account isolation, Classroom/quiz,
Admin/Instructor pages at mobile/desktop widths, all current English lesson screens,
Stack/Queue gameplay/responsiveness, offline/replayed logs, and actual ONNX practice.

Real PostgreSQL checks confirmed six operation completions survived reload;
backend tests also confirmed retries do not duplicate records and assignment
completion/leaderboard totals remain correct. Actual ONNX recommendation → practice
→ attributed log → new recommendation was successful.

## Remaining limitations

- Admin lint succeeds with existing React fast-refresh/effect warnings.
- Game build succeeds with a large-bundle warning.
- AI remains experimental for Bubble; predictive calibration/learning effectiveness
  is not established by functional tests. More logs do not retrain the fixed model.

Services left running on loopback: Game 5173, portal 5174, backend 8081, AI 8000.
The AI health endpoint reports `experimental_ready`. Browser tests used installed
Edge; test users use `qa.*` emails and are excluded from research exports.
