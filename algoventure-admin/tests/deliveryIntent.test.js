import test from "node:test";
import assert from "node:assert/strict";
import { pendingDelivery } from "../src/features/instructor/assignments/deliveryIntent.js";

function browserSession() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

const delivery = { assignmentTemplateId: "template", due: "2099-12-01", recipientUserIds: ["b", "a"] };

test("pending delivery keeps its ID across retries and reload until the server acknowledges it", () => {
  const session = browserSession();
  const initial = pendingDelivery(session, "instructor", "class", delivery, () => "first-id");
  const retry = pendingDelivery(session, "instructor", "class", delivery, () => "unused");
  const afterReload = pendingDelivery(session, "instructor", "class",
    { ...delivery, recipientUserIds: ["a", "b"] }, () => "unused");
  assert.equal(retry.id, initial.id);
  assert.equal(afterReload.id, initial.id);
  afterReload.acknowledge();
  assert.equal(pendingDelivery(session, "instructor", "class", delivery, () => "new-intent").id, "new-intent");
  initial.acknowledge();
  assert.equal(pendingDelivery(session, "instructor", "class", delivery, () => "unused").id, "new-intent");
});

test("instructor, classroom, template, due date and recipient changes are independent intents", () => {
  const session = browserSession();
  let sequence = 0;
  const get = (owner, classroom, values) =>
    pendingDelivery(session, owner, classroom, values, () => String(++sequence)).id;
  const ids = [
    get("instructor", "class", delivery),
    get("other", "class", delivery),
    get("instructor", "another-class", delivery),
    get("instructor", "class", { ...delivery, assignmentTemplateId: "another-template" }),
    get("instructor", "class", { ...delivery, due: "2099-12-02" }),
    get("instructor", "class", { ...delivery, recipientUserIds: ["a"] }),
  ];
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(get("instructor", "class", delivery), ids[0]);
});
