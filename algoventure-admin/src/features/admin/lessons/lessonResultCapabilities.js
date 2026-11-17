export function lessonResultCapabilities(lesson) {
  const id = lesson.id;
  const official = lesson.hasOfficialResult ?? (id === "insertion" && lesson.scoring?.version != null);
  if (id === "insertion") return { score: true, stars: "score", official };
  if (id === "matrix" || id.startsWith("matrix-")) return { score: false, stars: "errors", official };
  if (lesson.hasScoreThresholds) return { score: true, stars: "score", official };
  const score = /^(stack-|queue-)/.test(id) || ["bfs", "dfs", "dijkstra"].includes(id);
  return { score, stars: "time", official };
}
