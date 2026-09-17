// Mock data tĩnh cho Instructor Portal.
// Giữ nguyên shape để sau này dễ thay bằng API.

export const currentClass = 'DSA 2026 - Group A';

// ---------- Dashboard ----------
export const summaryStats = [
  { title: 'Total Students', value: '128', trend: '+ 6.2%', isUp: true, note: 'vs last month' },
  { title: 'Active This Week', value: '94', trend: '+ 3.1%', isUp: true, note: 'this week' },
  { title: 'Avg. Mastery', value: '72%', trend: '+ 4.8%', isUp: true, note: 'vs last month' },
  { title: 'Pending Submissions', value: '17', trend: '- 2.4%', isUp: false, note: 'vs last week' },
];

export const activityData = [
  { name: '30 Days Ago', subs: 42 },
  { name: '25 Days Ago', subs: 58 },
  { name: '20 Days Ago', subs: 71 },
  { name: '15 Days Ago', subs: 66 },
  { name: '10 Days Ago', subs: 98 },
  { name: '5 Days Ago', subs: 120 },
  { name: 'Today', subs: 142 },
];

export const topicCompletion = [
  { name: 'Sorting Algorithms', val: 82, learners: 105, color: 'bg-brand' },
  { name: 'Searching Algorithms', val: 68, learners: 87, color: 'bg-blue-500' },
  { name: 'Data Structures', val: 54, learners: 69, color: 'bg-orange-500' },
  { name: 'Graphs & Pathfinding', val: 33, learners: 42, color: 'bg-purple-500' },
];

export const recentStudents = [
  { name: 'Nguyen Hoang Anh', topic: 'Sorting', mastery: 88, lastActive: '5 mins ago', status: 'On Track' },
  { name: 'Tran Minh Duc', topic: 'Searching', mastery: 74, lastActive: '1 hour ago', status: 'On Track' },
  { name: 'Phan Thanh Thao', topic: 'Data Structures', mastery: 46, lastActive: '3 days ago', status: 'At Risk' },
  { name: 'Le Quoc Khanh', topic: 'Graphs', mastery: 61, lastActive: 'Just now', status: 'On Track' },
  { name: 'Nguyen Thi Mai', topic: 'Sorting', mastery: 29, lastActive: '1 week ago', status: 'Inactive' },
];

export const activeChallenges = [
  { title: 'Sorting Sprint Week 3', due: 'Due Oct 28', submitted: 84, total: 128 },
  { title: 'Binary Search Drills', due: 'Due Oct 30', submitted: 51, total: 128 },
  { title: 'Linked List Basics', due: 'Due Nov 02', submitted: 22, total: 128 },
];

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
  { title: 'Sorting Sprint Week 3', className: 'Group A', difficulty: 'Medium', due: 'Oct 28, 2026', submitted: 84, total: 128, status: 'Active' },
  { title: 'Binary Search Drills', className: 'Group A', difficulty: 'Medium', due: 'Oct 30, 2026', submitted: 51, total: 128, status: 'Active' },
  { title: 'Linked List Basics', className: 'Group B', difficulty: 'Easy', due: 'Nov 02, 2026', submitted: 22, total: 96, status: 'Draft' },
  { title: 'Graph Traversal Challenge', className: 'Group A', difficulty: 'Hard', due: 'Oct 15, 2026', submitted: 110, total: 128, status: 'Closed' },
];

// ---------- Progress Tracking ----------
export const progressSummary = [
  { label: 'On Track', value: 94, color: 'text-green-700', bg: 'bg-green-100' },
  { label: 'At Risk', value: 21, color: 'text-yellow-700', bg: 'bg-yellow-100' },
  { label: 'Inactive', value: 13, color: 'text-red-700', bg: 'bg-red-100' },
];

export const progressRows = [
  { name: 'Nguyen Hoang Anh', email: 'hoanganh@algoventure.edu', sorting: 88, searching: 74, ds: 60, graphs: 45, overall: 72, status: 'On Track' },
  { name: 'Tran Minh Duc', email: 'minhduc@algoventure.edu', sorting: 74, searching: 90, ds: 55, graphs: 38, overall: 68, status: 'On Track' },
  { name: 'Phan Thanh Thao', email: 'thanhthao@algoventure.edu', sorting: 46, searching: 40, ds: 30, graphs: 20, overall: 41, status: 'At Risk' },
  { name: 'Le Quoc Khanh', email: 'quockhanh@algoventure.edu', sorting: 61, searching: 58, ds: 66, graphs: 52, overall: 61, status: 'On Track' },
  { name: 'Nguyen Thi Mai', email: 'thimai@algoventure.edu', sorting: 29, searching: 22, ds: 15, graphs: 10, overall: 22, status: 'Inactive' },
  { name: 'Vo Dinh Linh', email: 'dinhlinh@algoventure.edu', sorting: 91, searching: 95, ds: 80, graphs: 70, overall: 88, status: 'On Track' },
  { name: 'Sarah Jenkins', email: 'sarah.j@algoventure.edu', sorting: 55, searching: 48, ds: 42, graphs: 30, overall: 45, status: 'At Risk' },
  { name: 'Marcus Brody', email: 'm.brody@algoventure.edu', sorting: 12, searching: 8, ds: 5, graphs: 0, overall: 8, status: 'Inactive' },
];

// ---------- Analytics ----------
export const analyticsStats = [
  { title: 'Avg. Mastery', value: '72%', trend: '+ 4.8%', isUp: true },
  { title: 'Completion Rate', value: '64%', trend: '+ 5.2%', isUp: true },
  { title: 'Avg. Attempts', value: '3.4', trend: '- 1.1%', isUp: false },
  { title: 'Active Learners', value: '94', trend: '+ 3.1%', isUp: true },
];

export const engagementData = [
  { name: '30 Days Ago', dau: 48 },
  { name: '25 Days Ago', dau: 55 },
  { name: '20 Days Ago', dau: 62 },
  { name: '15 Days Ago', dau: 70 },
  { name: '10 Days Ago', dau: 66 },
  { name: '5 Days Ago', dau: 82 },
  { name: 'Today', dau: 88 },
];

export const masteryDistribution = [
  { name: 'Advanced', value: 28, color: '#10b981' },
  { name: 'Proficient', value: 41, color: '#3b82f6' },
  { name: 'Developing', value: 22, color: '#f59e0b' },
  { name: 'Struggling', value: 9, color: '#ef4444' },
];

export const algorithmDifficulty = [
  { name: 'Quick Sort', attempts: 4.2 },
  { name: 'Dijkstra', attempts: 3.9 },
  { name: 'Merge Sort', attempts: 3.1 },
  { name: 'Binary Search', attempts: 2.4 },
  { name: 'Bubble Sort', attempts: 1.8 },
];

export const strugglingTopics = [
  { topic: 'Graphs & Pathfinding', mastery: 33, failed: 210, atRisk: 21, color: 'bg-purple-500' },
  { topic: 'Data Structures', mastery: 54, failed: 140, atRisk: 12, color: 'bg-orange-500' },
  { topic: 'Searching', mastery: 68, failed: 90, atRisk: 6, color: 'bg-blue-500' },
];

// ---------- Export ----------
export const recentExports = [
  { file: 'class_progress_oct.csv', type: 'Progress', date: 'Oct 24, 2026', size: '1.2 MB', status: 'Ready' },
  { file: 'mastery_report_q3.xlsx', type: 'Mastery', date: 'Oct 20, 2026', size: '840 KB', status: 'Ready' },
  { file: 'full_log_sept.pdf', type: 'Full Log', date: 'Sep 30, 2026', size: '3.1 MB', status: 'Processing' },
];
