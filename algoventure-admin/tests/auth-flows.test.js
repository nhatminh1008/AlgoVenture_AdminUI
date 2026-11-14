import assert from "node:assert/strict";
import test from "node:test";
import { resetPasswordErrors } from "../src/auth/authValidation.js";

test("reset accepts six characters only with an uppercase letter and a special character", () => {
  assert.equal(resetPasswordErrors("Ábc12!", "Ábc12!"), null);
  for (const password of ["Ab1!d", "abc12!", "Abc123 ", "A😀!a", "Á!" + "é".repeat(35)]) {
    assert.ok(resetPasswordErrors(password, password).fields.newPassword);
  }
  assert.ok(resetPasswordErrors("Abc12!", "Abc123").fields.confirmation);
});
