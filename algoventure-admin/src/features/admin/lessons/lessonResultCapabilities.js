const stepPoints = [
  "100 × số bước hợp lệ − 25 × số lỗi đã xác minh.",
  "100 × valid steps − 25 × verified errors.",
];
const mixedPoints = [
  "Đề xếp vị trí hoặc sắp thứ tự có 300 / 500 / 1.200 điểm theo mức, trừ 25 điểm mỗi lỗi.",
  "Placement and ordering start at 300 / 500 / 1,200 points by difficulty and deduct 25 per error.",
];

// Mirrors the current paths in OfficialLessonResult.grade and InsertionAttemptScores.calculate.
const pointRules = new Map([
  ["selection", ["250 × số lượt sắp xếp hợp lệ.", "250 × valid sorting rounds."]],
  ["insertion", stepPoints],
  ["merge", stepPoints],
  ["stack-push", stepPoints],
  ["stack-pop", stepPoints],
  ["stack-peek", stepPoints],
  ["stack-mixed", mixedPoints],
  ["queue-enqueue", stepPoints],
  ["queue-dequeue", stepPoints],
  ["queue-peek", stepPoints],
  ["queue-mixed", mixedPoints],
  ["quick", ["100 × (số phần tử + số lần chọn pivot hợp lệ) − 25 × số lỗi đã xác minh.",
    "100 × (item count + valid pivot selections) − 25 × verified errors."]],
  ["linear", ["100 điểm khi hoàn thành.", "100 points on completion."]],
  ["binary", ["Điểm nền Dễ / Trung bình / Khó là 100 / 200 / 300. Trừ 10 điểm mỗi lỗi đã xác minh.",
    "Base points for Easy / Medium / Hard are 100 / 200 / 300. Deduct 10 points per verified error."]],
  ["dijkstra", ["1.000 − 25 × số lỗi đã xác minh.", "1,000 − 25 × verified errors."]],
]);

const treeWorkPoints = [
  "1.000 − 25 × số lỗi đã xác minh ở chặng cuối.",
  "1,000 − 25 × verified errors in the final stage.",
];
const treeTraversalPoints = ["100 × số nút của chặng cuối.", "100 × nodes in the final stage."];
const graphTraversalPoints = ["100 × số đỉnh đã duyệt hợp lệ.", "100 × valid vertex visits."];
const stagedLessons = new Set([
  "matrix", "matrix-transpose", "matrix-spiral", "matrix-bfs", "matrix-dfs",
  "tree-basics", "tree-dfs", "tree-bfs", "bst-search", "bst-insert", "bst-delete",
]);
const serverTimingFallback = new Set(["selection", "linear", "tree-dfs", "tree-bfs"]);

const sharedRules = [
  [["tree-basics", "bst-search", "bst-insert", "bst-delete"], treeWorkPoints],
  [["tree-dfs", "tree-bfs"], treeTraversalPoints],
  [["dfs", "bfs"], graphTraversalPoints],
];

for (const [ids, rule] of sharedRules) {
  for (const id of ids) pointRules.set(id, rule);
}

export function lessonResultCapabilities(lesson) {
  const pointRule = pointRules.get(lesson.id) ?? null;
  return {
    pointRule,
    official: lesson.hasOfficialResult === true,
    usesFinalStageTiming: stagedLessons.has(lesson.id),
    legacyPointRule: pointRule === mixedPoints ? stepPoints : null,
    usesServerTimingFallback: serverTimingFallback.has(lesson.id),
  };
}
