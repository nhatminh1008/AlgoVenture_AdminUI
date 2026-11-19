export function lessonResultCapabilities(lesson) {
  const id = lesson.id;
  const official = lesson.hasOfficialResult ?? (id === "insertion" && lesson.scoring?.version != null);
  const score = id === "insertion" || Boolean(lesson.hasScoreThresholds)
    || /^(stack-|queue-)/.test(id) || ["bfs", "dfs", "dijkstra"].includes(id);
  return { score, stars: "time", official };
}
