# Game → backend → ONNX dev integration, 03/11/2026

Connected on loopback: Game 5173, portal 5174, backend 8081, AI service 8000.
AI health: `experimental_ready`; quality evaluation remains deferred.

Artifact: `bubble-experimental-36a31fc69a53`, generated from the experimental
Bubble checkpoint (2 training steps). Export mechanics passed 10 shape cases,
current-response invariance, and TC 0.70 selection parity. Maximum probability
error vs original PyTorch: 5.960464477539063e-8.

Verified:

- 8 AI service tests, including 3 real-ONNX tests with explicit experimental opt-in.
- 10 research/data preparation tests.
- 25 backend integration tests passed; 2 additional gateway wire tests passed
  after switching their local test server to a blocking TCP socket for this Windows host.
- 5 browser practice tests, including experimental labels at 390px and 1440px.
- 1 browser test with actual PostgreSQL/backend/AI, no API mocks.
- Focused experimental-notice translation test passed; Game production build passed.
- Final backend jar packaged successfully.

Live browser flow: create isolated `qa.ai.live.*` account → get insufficient_history
→ complete manual short practice → recommendation from actual ONNX → complete
the recommended practice → read back completed attempt and recommendation ID
→ request a new recommendation with the added history.

Observed wire results:

| Request | History used | Selected exercise | Predicted first-response correctness |
| --- | ---: | --- | ---: |
| First ready request | 4 | bubble-short-v1 | 0.6122437119483948 |
| After recommended practice | 8 | bubble-mixed-v1 | 0.6072293519973755 |

These are development smoke results, not measured predictive accuracy. A new
recommendation ID is required; the policy may choose the same item again.
The fixed checkpoint is not retrained when a learner uploads more logs.

The initial global dialogue translation scan reported 113 untranslated locations
in Queue/Stack source files. The subsequent system review fixed these translations;
the full Game unit suite now passes 516 tests. The production build retains its
large-bundle size warning. See `docs/SYSTEM_REVIEW_2026-11-03.md` at the AdminUI root
for the broader review and the Stack/Queue catalog integration fixes.

Chrome was unavailable on this machine; browser tests ran using installed Edge
(`PLAYWRIGHT_CHANNEL=msedge`). Test accounts/logs are excluded from research
exports by the existing QA email prefix rule.
