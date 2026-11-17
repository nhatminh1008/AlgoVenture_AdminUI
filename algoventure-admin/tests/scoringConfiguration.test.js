import test from "node:test";
import assert from "node:assert/strict";
import { validateInsertionScoring } from "../src/features/admin/lessons/scoringConfiguration.js";

test("only supported scoring settings validate coefficients and strictly increasing thresholds", () => {
  const scoring = { pointsPerStep: 100, penaltyPerError: 25 };
  assert.equal(validateInsertionScoring(scoring, [100, 300, 450]), null);
  assert.equal(validateInsertionScoring(null, []), null);
  assert.equal(validateInsertionScoring({ ...scoring, pointsPerStep: 0 }, [100, 300, 450]), "coefficients");
  assert.equal(validateInsertionScoring({ ...scoring, penaltyPerError: 10001 }, [100, 300, 450]), "coefficients");
  assert.equal(validateInsertionScoring(scoring, [100, 100, 450]), "thresholds");
  assert.equal(validateInsertionScoring(scoring, [100, 300, 1280001]), "thresholds");
});
