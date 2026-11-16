export function pendingDelivery(storage, instructorId, classroomId, values, createId = () => crypto.randomUUID()) {
  const key = "algoventure.pending-delivery:" + JSON.stringify([
    instructorId, classroomId, values.assignmentTemplateId, values.due, [...values.recipientUserIds].sort(),
  ]);
  const id = storage.getItem(key) ?? createId();
  // Persist before sending so a lost response or a reload can safely replay the same request.
  storage.setItem(key, id);
  return {
    id,
    acknowledge() {
      if (storage.getItem(key) === id) storage.removeItem(key);
    },
  };
}
