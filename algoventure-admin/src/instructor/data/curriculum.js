// Stable lesson IDs match the learner game's learningTrack.ts.
export const topics = [
  {
    id: "sorting",
    name: "Sorting",
    label: "Sắp xếp",
    description: "So sánh, đổi chỗ, chia và hợp nhất dữ liệu.",
    lessons: [
      ["bubble", "Bubble Sort"],
      ["selection", "Selection Sort"],
      ["insertion", "Insertion Sort"],
      ["merge", "Merge Sort"],
      ["quick", "Quick Sort"],
    ],
  },
  {
    id: "searching",
    name: "Searching",
    label: "Tìm kiếm",
    description: "Tìm kiếm tuần tự và thu hẹp phạm vi tìm kiếm.",
    lessons: [
      ["linear", "Linear Search"],
      ["binary", "Binary Search"],
    ],
  },
  {
    id: "data-structures",
    name: "Data Structures",
    label: "Cấu trúc dữ liệu",
    description: "Stack, Queue, danh sách liên kết và cây tìm kiếm.",
    lessons: [
      ["stack", "Stack"],
      ["queue", "Queue"],
      ["linked-list", "Linked List Construction"],
      ["linked-traversal", "Linked List Traversal"],
      ["linked-search", "Linked List Search"],
      ["linked-insertion", "Linked List Insertion"],
      ["linked-deletion", "Linked List Deletion"],
      ["linked-reversal", "Linked List Reversal"],
      ["tree-basics", "Cây cơ bản"],
      ["tree-traversal", "Duyệt cây"],
      ["bst", "BST"],
      ["bst-search", "Tìm kiếm trên BST"],
      ["bst-insert", "Thêm nút vào BST"],
      ["bst-delete", "Xóa nút khỏi BST"],
    ],
  },
  {
    id: "graphs",
    name: "Graphs / Pathfinding",
    label: "Đồ thị và đường đi",
    description: "Biểu diễn kết nối, duyệt đồ thị và tìm đường ngắn nhất.",
    lessons: [
      ["graph-basics", "Đồ thị cơ bản"],
      ["bfs", "BFS"],
      ["dfs", "DFS"],
      ["dijkstra", "Dijkstra"],
    ],
  },
];
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
export const getTopic = (id) => topics.find((topic) => topic.id === id);
export const getLevel = (id) => levels.find((level) => level.id === id);
export const lessonName = (id) =>
  topics
    .flatMap((topic) => topic.lessons)
    .find((lesson) => lesson[0] === id)?.[1] ?? id;
