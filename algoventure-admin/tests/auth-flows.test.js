import assert from "node:assert/strict";
import test from "node:test";
import { passwordErrors, registrationProof, resetPasswordErrors } from "../src/auth/authValidation.js";

test("registration only accepts the Backend's link format", () => {
  const registrationId = "665c4da0-2055-4e6b-a056-c7f19a0a3c48";
  const token = "A".repeat(43);
  assert.deepEqual(registrationProof(`#registrationId=${registrationId}&token=${token}`), { registrationId, token });
  assert.equal(registrationProof(`#registrationId=${registrationId}&token=123456`), null);
  assert.equal(registrationProof(`#registrationId=invalid&token=${token}`), null);
  assert.equal(registrationProof(`#reset-token=${token}`), null);
});

test("new password validation uses the Backend's minimum and UTF-8 byte limit", () => {
  assert.equal(passwordErrors("Abcdefgh1!", "Abcdefgh1!"), null);
  const atLimit = "A1!a" + "é".repeat(34);
  assert.equal(passwordErrors(atLimit, atLimit), null);
  assert.ok(passwordErrors("é".repeat(37), "é".repeat(37)).fields.password);
  assert.ok(passwordErrors(" ".repeat(10), " ".repeat(10)).fields.password);
  assert.ok(passwordErrors("too short", "mismatch").fields.password);
  assert.ok(passwordErrors("LongPassword1!", "mismatch").fields.confirmation);
  for (const password of ["secret1234!", "SECRET1234!", "Secretwords!", "Secret1234"]) {
    assert.match(passwordErrors(password, password).fields.password, /chữ hoa.*chữ thường.*chữ số.*ký tự đặc biệt/);
  }
});


test("reset accepts six characters only with an uppercase letter and a special character", () => {
  assert.equal(resetPasswordErrors("Ábc12!", "Ábc12!"), null);
  for (const password of ["Ab1!d", "abc12!", "Abc123 ", "A😀!a", "Á!" + "é".repeat(35)]) {
    assert.ok(resetPasswordErrors(password, password).fields.newPassword);
  }
  assert.ok(resetPasswordErrors("Abc12!", "Abc123").fields.confirmation);
});
