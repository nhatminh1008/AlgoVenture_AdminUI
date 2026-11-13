export const levels = [
  {
    id: "basic",
    name: "Basic",
    label: "Cơ bản",
    description: "Xây dựng nền tảng, làm quen và thực hành từng bước.",
  },
  {
    id: "advanced",
    name: "Advanced",
    label: "Nâng cao",
    description: "Củng cố kiến thức và luyện tập các tình huống phức tạp hơn.",
  },
];

export const getLevel = (id) => levels.find((level) => level.id === id);

export function createCurriculum(topics) {
  const byTopic = new Map(topics.map((topic) => [topic.id, topic]));
  const byLesson = new Map(topics.flatMap((topic) => topic.lessons));
  return {
    topics,
    getTopic: (id) => byTopic.get(id),
    lessonName: (id) => byLesson.get(id) ?? id,
  };
}
