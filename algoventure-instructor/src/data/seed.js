import { gradeAttempt } from "./metrics.js";

const q = (prompt, options, correctIndex, explanation) => ({
  prompt,
  options,
  correctIndex,
  explanation,
});
const sorting = [
  q(
    "Bubble Sort so sánh cặp phần tử nào trong mỗi bước?",
    [
      "Hai phần tử kề nhau",
      "Chỉ phần tử đầu và cuối",
      "Hai phần tử bất kỳ",
      "Chỉ các phần tử ở giữa",
    ],
    0,
    "Bubble Sort so sánh các phần tử kề nhau và đổi chỗ nếu sai thứ tự.",
  ),
  q(
    "Selection Sort chọn phần tử nào để đưa về đầu đoạn chưa sắp xếp khi sắp tăng dần?",
    ["Lớn nhất", "Nhỏ nhất", "Ở giữa", "Cuối cùng"],
    1,
    "Selection Sort tìm phần tử nhỏ nhất của đoạn chưa sắp xếp rồi đưa về đầu đoạn đó.",
  ),
  q(
    "Insertion Sort duy trì tính chất nào sau mỗi lượt?",
    [
      "Toàn bộ mảng đã sắp xếp",
      "Mọi phần tử đều khác nhau",
      "Đoạn đầu đã được sắp xếp",
      "Phần tử cuối luôn nhỏ nhất",
    ],
    2,
    "Insertion Sort chèn phần tử tiếp theo vào vị trí phù hợp trong đoạn đầu đã sắp xếp.",
  ),
  q(
    "Độ phức tạp thời gian của Merge Sort chuẩn trong trường hợp xấu nhất là gì?",
    ["O(n)", "O(log n)", "O(n²)", "O(n log n)"],
    3,
    "Merge Sort có O(log n) tầng chia và mỗi tầng hợp nhất tổng cộng O(n) phần tử.",
  ),
  q(
    "Quick Sort có thể đạt độ phức tạp nào trong trường hợp phân hoạch liên tục rất lệch?",
    ["O(n²)", "O(1)", "O(log n)", "O(n)"],
    0,
    "Quick Sort có thể mất O(n²) khi mỗi phân hoạch chỉ tách được một phần tử.",
  ),
];
const searching = [
  q(
    "Linear Search có thể kết luận không tìm thấy khi nào?",
    [
      "Sau phần tử đầu",
      "Sau khi kiểm tra hết các phần tử",
      "Sau hai lần so sánh",
      "Khi mảng chưa sắp xếp",
    ],
    1,
    "Linear Search phải kiểm tra hết phạm vi tìm kiếm trước khi kết luận không có giá trị cần tìm.",
  ),
  q(
    "Điều kiện quan trọng để Binary Search chuẩn hoạt động đúng trên mảng là gì?",
    [
      "Mảng có số phần tử chẵn",
      "Mảng không có số âm",
      "Mảng đã được sắp xếp",
      "Mảng có ít nhất 100 phần tử",
    ],
    2,
    "Binary Search dựa vào thứ tự đã sắp xếp để loại bỏ một nửa phạm vi.",
  ),
  q(
    "Trong mảng tăng dần, nếu target nhỏ hơn giá trị ở mid thì Binary Search tiếp tục ở đâu?",
    ["Nửa phải", "Toàn bộ mảng", "Chỉ phần tử cuối", "Nửa trái"],
    3,
    "Các phần tử ở bên phải mid không nhỏ hơn giá trị tại mid nên không thể là target.",
  ),
  q(
    "Bubble Sort tăng dần đưa phần tử nào về cuối đoạn đang xét sau một lượt đầy đủ?",
    [
      "Phần tử lớn nhất của đoạn",
      "Phần tử nhỏ nhất của đoạn",
      "Phần tử ở giữa",
      "Phần tử đầu ban đầu",
    ],
    0,
    "Các lần đổi chỗ liên tiếp đẩy phần tử lớn nhất của đoạn về cuối.",
  ),
  q(
    "Binary Search giảm kích thước phạm vi tìm kiếm như thế nào sau mỗi lần so sánh?",
    [
      "Giảm đúng một phần tử",
      "Giảm khoảng một nửa",
      "Tăng gấp đôi",
      "Không thay đổi",
    ],
    1,
    "Mỗi lần so sánh với mid loại bỏ khoảng một nửa phạm vi còn lại.",
  ),
];
const structures = [
  q(
    "Stack tuân theo nguyên tắc nào?",
    ["FIFO", "Ngẫu nhiên", "LIFO", "Theo giá trị nhỏ nhất"],
    2,
    "Stack lấy ra phần tử được thêm vào gần nhất theo nguyên tắc LIFO.",
  ),
  q(
    "Queue chuẩn lấy phần tử ở đâu?",
    ["Cuối hàng", "Vị trí bất kỳ", "Giữa hàng", "Đầu hàng"],
    3,
    "Queue thêm ở cuối và lấy ở đầu theo nguyên tắc FIFO.",
  ),
  q(
    "Trong danh sách liên kết đơn, con trỏ next của nút cuối thường là gì?",
    ["NULL", "HEAD", "Nút trước", "Giá trị của nút"],
    0,
    "NULL thể hiện không còn nút tiếp theo trong danh sách liên kết đơn không vòng.",
  ),
  q(
    "Với BST có các khóa phân biệt, khóa trong cây con trái có quan hệ gì với khóa tại gốc?",
    ["Đều lớn hơn", "Đều nhỏ hơn", "Đều bằng", "Không có quy tắc"],
    1,
    "Tính chất BST yêu cầu mọi khóa trong cây con trái nhỏ hơn khóa tại gốc.",
  ),
  q(
    "Duyệt inorder một BST có các khóa phân biệt cho kết quả như thế nào?",
    ["Giảm dần", "Ngẫu nhiên", "Tăng dần", "Theo độ sâu giảm dần"],
    2,
    "Duyệt trái, gốc, phải trên BST cho các khóa theo thứ tự tăng dần.",
  ),
];
const linked = [
  q(
    "Muốn truy cập nút thứ k trong Linked List đơn từ HEAD, thông thường cần làm gì?",
    [
      "Dùng chỉ số truy cập trực tiếp O(1)",
      "Sắp xếp danh sách",
      "Xóa HEAD",
      "Duyệt theo next qua các nút",
    ],
    3,
    "Linked List đơn không hỗ trợ truy cập ngẫu nhiên nên cần đi theo next từ HEAD.",
  ),
  q(
    "Chèn nút X giữa A và B trong A → B nên thiết lập liên kết nào trước để giữ tham chiếu đến B?",
    ["X.next = B", "A.next = NULL", "B.next = X", "HEAD = B"],
    0,
    "Cho X trỏ đến B trước giúp giữ liên kết với phần danh sách phía sau.",
  ),
  q(
    "Để xóa B trong A → B → C khi đã có tham chiếu A, cần cập nhật gì?",
    ["C.next = A", "A.next = C", "HEAD = C", "A.next = A"],
    1,
    "Nối A trực tiếp đến C sẽ bỏ qua B mà vẫn giữ phần còn lại.",
  ),
  q(
    "Tìm kiếm trên BST mất O(h), trong đó h là gì?",
    ["Số lá", "Số cạnh của đồ thị", "Chiều cao cây", "Số lần đổi chỗ"],
    2,
    "Tìm kiếm BST đi theo một đường từ gốc nên số bước phụ thuộc chiều cao cây.",
  ),
  q(
    "Khi xóa nút BST có hai con, có thể thay khóa bằng giá trị nào?",
    [
      "Một khóa bất kỳ ngoài cây",
      "Khóa lớn nhất toàn cây",
      "Khóa nhỏ nhất toàn cây",
      "Inorder successor hoặc predecessor",
    ],
    3,
    "Successor hoặc predecessor cho phép thay khóa rồi xóa nút thay thế mà vẫn giữ tính chất BST.",
  ),
];
const graphs = [
  q(
    "BFS chuẩn dùng cấu trúc dữ liệu nào để xử lý các đỉnh chờ duyệt?",
    ["Queue", "Stack", "BST", "Heap bắt buộc"],
    0,
    "Queue giúp BFS xử lý các đỉnh theo thứ tự được phát hiện.",
  ),
  q(
    "DFS thường có thể triển khai bằng cách nào?",
    [
      "Chỉ dùng Queue",
      "Đệ quy hoặc Stack",
      "Chỉ dùng Binary Search",
      "Chỉ dùng Merge Sort",
    ],
    1,
    "Đệ quy hoặc Stack lưu các nhánh cần khám phá theo chiều sâu.",
  ),
  q(
    "Dijkstra chuẩn yêu cầu trọng số các cạnh như thế nào?",
    ["Phải khác nhau", "Phải là số nguyên dương", "Không âm", "Đều bằng một"],
    2,
    "Tính đúng đắn của Dijkstra chuẩn dựa trên giả thiết trọng số cạnh không âm.",
  ),
  q(
    "Trong đồ thị không trọng số, BFS từ s tìm được điều gì?",
    [
      "Chu trình dài nhất",
      "Cây khung nhỏ nhất theo trọng số",
      "Mọi đường đi Hamilton",
      "Số cạnh ít nhất từ s đến các đỉnh tới được",
    ],
    3,
    "BFS khám phá theo từng lớp khoảng cách nên cho đường đi có ít cạnh nhất.",
  ),
  q(
    "Vì sao thường đánh dấu visited khi duyệt đồ thị?",
    [
      "Tránh xử lý lặp lại đỉnh và đi vòng vô hạn",
      "Để sắp xếp đỉnh theo tên",
      "Để xóa mọi cạnh",
      "Để đổi trọng số cạnh",
    ],
    0,
    "Đánh dấu visited ngăn thuật toán duyệt lặp vô hạn trên chu trình.",
  ),
];
const paths = [
  q(
    "Khoảng cách ban đầu của đỉnh nguồn trong Dijkstra là bao nhiêu?",
    ["Vô cực", "0", "-1", "1"],
    1,
    "Khoảng cách từ đỉnh nguồn đến chính nó bằng 0.",
  ),
  q(
    "Relax cạnh u → v trong Dijkstra có mục đích gì?",
    [
      "Xóa đỉnh v",
      "Tăng mọi trọng số",
      "Cập nhật khoảng cách v nếu đi qua u ngắn hơn",
      "Đảo hướng mọi cạnh",
    ],
    2,
    "Relax kiểm tra liệu dist[u] + w(u,v) có cải thiện dist[v] hay không.",
  ),
  q(
    "Trong biểu diễn danh sách kề, các phần tử của danh sách tại u thường mô tả gì?",
    [
      "Mọi cây con của u",
      "Chỉ các đỉnh đã thăm",
      "Mọi đường đi từ u",
      "Các đỉnh/cạnh kề với u",
    ],
    3,
    "Danh sách kề lưu các kết nối trực tiếp từ mỗi đỉnh.",
  ),
  q(
    "Độ phức tạp duyệt BFS với danh sách kề là gì?",
    ["O(V + E)", "O(V!)", "O(log V)", "O(1)"],
    0,
    "BFS xử lý mỗi đỉnh và mỗi cạnh một số lần hằng số.",
  ),
  q(
    "DFS có luôn cho đường đi ngắn nhất trên đồ thị không trọng số không?",
    [
      "Luôn luôn",
      "Không, BFS mới bảo đảm số cạnh ít nhất",
      "Chỉ cần đổi tên các đỉnh",
      "DFS không thể tìm đường đi",
    ],
    1,
    "DFS ưu tiên đi sâu nên không bảo đảm tìm ra đường đi ít cạnh nhất.",
  ),
];

export function createSeed(now, session) {
  const time = now().getTime();
  const iso = (offset) => new Date(time + offset).toISOString();
  const day = 86400000;
  const classrooms = [
    {
      id: "sorting-basic",
      title: "DSA 2026 — Sorting Foundations",
      inviteCode: "DSA2026",
      topicId: "sorting",
      level: "basic",
      description: "Củng cố sắp xếp và tìm kiếm thông qua bài tập trắc nghiệm.",
    },
    {
      id: "structures-basic",
      title: "DSA 2026 — Data Structures",
      inviteCode: "SORT101",
      topicId: "data-structures",
      level: "basic",
      description: "Luyện tập Stack, Queue, Linked List và BST.",
    },
    {
      id: "graphs-advanced",
      title: "DSA 2026 — Graph Exploration",
      inviteCode: "TREE2026",
      topicId: "graphs",
      level: "advanced",
      description: "Ôn tập BFS, DFS và Dijkstra.",
    },
  ].map((item) => ({
    ...item,
    instructorId: session.userId,
    instructorName: session.name,
    createdAt: iso(-30 * day),
  }));
  const people = [
    ["Nguyễn Hoàng Anh", "hoanganh@example.com"],
    ["Trần Minh Đức", "minhduc@example.com"],
    ["Phan Thanh Thảo", "thanhthao@example.com"],
    ["Lê Quốc Khánh", "quockhanh@example.com"],
    ["Nguyễn Thị Mai", "thimai@example.com"],
    ["Võ Đình Linh", "dinhlinh@example.com"],
    ["Trần Gia Hân", "giahan@example.com"],
    ["Lê Minh Khang", "minhkhang@example.com"],
  ];
  const enrollments = people.map(([learnerName, learnerEmail], index) => ({
    id: `enrollment-${index + 1}`,
    learnerId: `s${index + 1}`,
    classroomId: classrooms[index < 3 ? 0 : index < 6 ? 1 : 2].id,
    learnerName,
    learnerEmail,
    joinedAt: iso(-(20 + index) * day),
  }));
  const assignments = classrooms.flatMap((classroom, index) =>
    [0, 1, 2].map((number) => {
      const bank = [
        [sorting, searching],
        [structures, linked],
        [graphs, paths],
      ][index][number === 1 ? 1 : 0];
      const id = `${classroom.id}-assignment-${number + 1}`;
      return {
        id,
        classroomId: classroom.id,
        title: [
          `Ôn tập ${["Sorting", "Data Structures", "Graph"][index]} — Hạn sắp tới`,
          "Kiểm tra kiến thức — Đã hết hạn",
          "Bài tập tuần tiếp theo",
        ][number],
        description:
          "Chọn một đáp án đúng cho mỗi câu; câu bỏ trống tính là sai.",
        status: number === 2 ? "draft" : "published",
        dueAt: iso(number === 0 ? 3 * 3600000 : number === 1 ? -day : 7 * day),
        questions: bank.map((question, i) => ({
          ...structuredClone(question),
          id: `${id}-q${i + 1}`,
        })),
        createdAt: iso(-7 * day),
        updatedAt: iso(-7 * day),
      };
    }),
  );
  const attempts = [];
  function add(assignment, learnerId, right, offset) {
    const answers = assignment.questions.map((question, i) => ({
      questionId: question.id,
      selectedIndex: right.includes(i)
        ? question.correctIndex
        : i === 0
          ? null
          : (question.correctIndex + 1) % 4,
    }));
    attempts.push({
      id: `attempt-${attempts.length + 1}`,
      learnerId,
      assignmentId: assignment.id,
      submittedAt: iso(offset),
      ...gradeAttempt(assignment, answers),
    });
  }
  for (const classroom of classrooms) {
    const members = enrollments.filter(
      (item) => item.classroomId === classroom.id,
    );
    const [open, closed] = assignments.filter(
      (item) => item.classroomId === classroom.id,
    );
    add(open, members[0].learnerId, [1], -2 * day);
    add(open, members[0].learnerId, [1, 2, 3, 4], -2 * 3600000);
    if (members.length > 2)
      add(open, members[1].learnerId, [0, 1, 2, 3, 4], -3600000);
    add(closed, members[0].learnerId, [1, 2], -3 * day);
    if (members.length > 2) add(closed, members[2].learnerId, [1], -2 * day);
  }
  return {
    version: 2,
    classrooms,
    enrollments,
    assignments,
    attempts,
    notices: [],
  };
}
