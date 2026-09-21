// Mock data tĩnh cho Instructor Portal.
// Giữ nguyên shape để sau này dễ thay bằng API.

export const currentClass = 'DSA 2026 - Group A';
export const classOptions = ['DSA 2026 - Group A', 'DSA 2026 - Group B'];

// ---------- Challenge Sets ----------
export const algorithmsByTopic = {
  Sorting: [
    { name: 'Bubble Sort', difficulty: 'Easy' },
    { name: 'Selection Sort', difficulty: 'Easy' },
    { name: 'Insertion Sort', difficulty: 'Easy' },
    { name: 'Merge Sort', difficulty: 'Medium' },
    { name: 'Quick Sort', difficulty: 'Medium' },
  ],
  Searching: [
    { name: 'Linear Search', difficulty: 'Easy' },
    { name: 'Binary Search', difficulty: 'Medium' },
  ],
  'Data Structures': [
    { name: 'Array', difficulty: 'Easy' },
    { name: 'Stack', difficulty: 'Easy' },
    { name: 'Queue', difficulty: 'Easy' },
    { name: 'Linked List', difficulty: 'Medium' },
    { name: 'BST', difficulty: 'Medium' },
  ],
  Graphs: [
    { name: 'DFS', difficulty: 'Medium' },
    { name: 'BFS', difficulty: 'Medium' },
    { name: 'Dijkstra', difficulty: 'Hard' },
  ],
};

export const existingChallengeSets = [
  { id: 1, title: 'Sorting Sprint Week 3', className: 'DSA 2026 - Group A', difficulty: 'Medium', due: '2026-10-28', algorithms: ['Bubble Sort', 'Merge Sort', 'Quick Sort'], status: 'Active' },
  { id: 2, title: 'Binary Search Drills', className: 'DSA 2026 - Group A', difficulty: 'Medium', due: '2026-10-30', algorithms: ['Linear Search', 'Binary Search'], status: 'Active' },
  { id: 3, title: 'Linked List Basics', className: 'DSA 2026 - Group B', difficulty: 'Easy', due: '2026-11-02', algorithms: ['Linked List', 'Stack', 'Queue'], status: 'Draft' },
  { id: 4, title: 'Graph Traversal Challenge', className: 'DSA 2026 - Group A', difficulty: 'Hard', due: '2026-10-15', algorithms: ['DFS', 'BFS', 'Dijkstra'], status: 'Closed' },
];

// ---------- Progress Tracking ----------
// mastery theo từng topic để có thể tính overall và lọc theo status thật.
export const progressRows = [
  { name: 'Nguyen Hoang Anh', email: 'hoanganh@algoventure.edu', className: 'DSA 2026 - Group A', sorting: 88, searching: 74, ds: 60, graphs: 45 },
  { name: 'Tran Minh Duc', email: 'minhduc@algoventure.edu', className: 'DSA 2026 - Group A', sorting: 74, searching: 90, ds: 55, graphs: 38 },
  { name: 'Phan Thanh Thao', email: 'thanhthao@algoventure.edu', className: 'DSA 2026 - Group A', sorting: 46, searching: 40, ds: 30, graphs: 20 },
  { name: 'Le Quoc Khanh', email: 'quockhanh@algoventure.edu', className: 'DSA 2026 - Group B', sorting: 61, searching: 58, ds: 66, graphs: 52 },
  { name: 'Nguyen Thi Mai', email: 'thimai@algoventure.edu', className: 'DSA 2026 - Group A', sorting: 29, searching: 22, ds: 15, graphs: 10 },
  { name: 'Vo Dinh Linh', email: 'dinhlinh@algoventure.edu', className: 'DSA 2026 - Group B', sorting: 91, searching: 95, ds: 80, graphs: 70 },
  { name: 'Sarah Jenkins', email: 'sarah.j@algoventure.edu', className: 'DSA 2026 - Group A', sorting: 55, searching: 48, ds: 42, graphs: 30 },
  { name: 'Marcus Brody', email: 'm.brody@algoventure.edu', className: 'DSA 2026 - Group B', sorting: 12, searching: 8, ds: 5, graphs: 0 },
];

// ---------- Analytics ----------
// Dữ liệu điểm theo tháng để filter theo năm/tháng thật.
export const engagementByMonth = [
  { period: '2026-05', month: 'May', dau: 48, completion: 52, avgMastery: 60 },
  { period: '2026-06', month: 'Jun', dau: 55, completion: 55, avgMastery: 63 },
  { period: '2026-07', month: 'Jul', dau: 62, completion: 58, avgMastery: 66 },
  { period: '2026-08', month: 'Aug', dau: 70, completion: 60, avgMastery: 68 },
  { period: '2026-09', month: 'Sep', dau: 66, completion: 62, avgMastery: 70 },
  { period: '2026-10', month: 'Oct', dau: 88, completion: 64, avgMastery: 72 },
];
