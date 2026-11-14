# Dịch vụ AI luyện tập

simpleKT + Target Correctness (mục tiêu 0.70). Spring Boot gọi dịch vụ nội bộ;
Unity/Learner tiếp tục xác thực qua JWT Bearer của backend.

## Trạng thái triển khai

- API hỗ trợ định tuyến nhiều artifact bằng registry, theo `lessonId`,
  `encodingVersion` và `predictionTarget`. Không tự dùng model Bubble cho game khác.
- Contract non-Bubble là `game-state-v1` / `next_action`; history cần nhãn
  first-response đã được backend chấm. Contract Bubble cũ vẫn hoạt động.
- `/health.models` công khai contract, lesson coverage, vocab size và trạng thái
  từng model. Coverage cấu hình không đồng nghĩa model đã đạt chất lượng.

- Có API FastAPI, loader ONNX, kiểm tra manifest/hash/vocab và policy chọn bài.
- Có ngân hàng ba bài Bubble, API lưu đề xuất, giao diện Game và log bài bổ trợ.
- Instructor xem evidence thuộc lớp, tách minigame và bài bổ trợ.
- **Chưa có artifact simpleKT đã đánh giá chất lượng cho kỹ năng Bubble.** Không tự gắn
  các số KC của CSEDM/ASSIST vào `bubble.next_swap.v1`. Dịch vụ trả
  `model_not_ready` và không tạo xác suất hoặc bài đề xuất giả.
- Có **chế độ dev thử nghiệm** chạy checkpoint Bubble qua ONNX. Chỉ bật bằng
  opt-in riêng, hiển thị nhãn AI thử nghiệm trong Game; đánh giá chất lượng vẫn hoãn.
- Các bài hiện tại là biến thể minigame Bubble dùng cùng engine/recorder. Chưa có
  dạng bài bổ trợ viết code, câu hỏi độ phức tạp hoặc sinh nội dung tự do.

## Chạy Windows

Từ thư mục `ai-service`, tạo môi trường riêng và cài dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8090
```

Để backend gọi service, mở terminal khác tại thư mục gốc `AlgoVenture_AdminUI` và đặt biến trước khi khởi động backend. Wrapper chuyển tiếp tới repo `AlgoVenture_Backend` cùng cấp; chuẩn bị Backend trước theo [README](../README.md).

```powershell
$env:AI_SERVICE_URL='http://127.0.0.1:8090'
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

Nếu chạy Backend bằng nút Run trong IDE, đặt cùng biến `AI_SERVICE_URL` trong cấu hình Run của IDE.

Backend vẫn chạy được nếu bỏ biến này hoặc service tắt. Không xuất cổng AI ra
Internet; endpoint này dành cho backend tin cậy và không xử lý tài khoản/token.
Swagger nội bộ của AI ở `/docs`, health ở `/health`.

## Nạp artifact

### Registry nhiều model

`AI_MODEL_REGISTRY` trỏ tới file có cấu trúc như `model-registry.example.json`.
Mỗi entry gồm `id`, `manifestPath` (tương đối với registry hoặc tuyệt đối) và
`lessonIds`. Manifest generic cần khai báo `lessonIds`; registry chỉ được thu hẹp
coverage đã khai báo. Hai model không được tranh cùng contract/lesson.
`AI_MODEL_MANIFEST` vẫn dùng được cho một model, với Bubble là mặc định cũ;
khi có registry thì registry được ưu tiên.

Từ thư mục gốc `AlgoVenture_AdminUI`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-ai.ps1 -Registry .\ai-service\model-registry.example.json -Experimental
```

Request thêm `lessonId` tùy chọn. Contract/lesson chưa có model trả
`model_not_ready` và lý do `unsupported_model_contract`/`unsupported_lesson`,
không tạo xác suất giả. Artifact đã cấu hình nhưng chưa nạp được cũng không
fallback sang kỹ năng khác. Log mới chỉ thay history đầu vào, không tự training.

### Kiểm thử đường truyền 34 lesson bằng ONNX

`tests/create_transport_artifact.py` tạo model ONNX **hằng số chỉ dành cho test**,
architecture `synthetic-simplekt-contract`; đây không phải simpleKT đã huấn luyện.
Fixture kiểm tra shape, vocab, routing và HTTP, không đánh giá người học.
Chạy generator bằng môi trường research có `onnx`/`onnxruntime`, output phải là
thư mục mới. Có thể truyền `--catalog` và `--observations` của môi trường test để
kiểm tra đúng question IDs backend tạo.

Artifact này chỉ nạp khi bật cả `AI_ALLOW_EXPERIMENTAL=true` và
`AI_ALLOW_TEST_ARTIFACTS=true` (script: `-Experimental -TestArtifacts`). Health và
response luôn có `testOnly=true`, reason `synthetic_transport_test`. Không bật cờ
test trong dịch vụ phục vụ người học. Không có model đa game đã kiểm chứng được
tạo ra từ fixture này.

Backend cũng từ chối response test nếu không bật riêng
`app.ai.allow-test-artifacts=true`. Để kiểm tra cả contract Bubble cũ qua TCP,
tạo artifact thứ hai với `--encoding-version bubble-board-v1
--prediction-target first_swap_opportunity` và catalog/history Bubble thật của
DB test; ghép hai entry với ID khác nhau vào registry test.

Đặt `AI_TEST_ALLGAME_REGISTRY` khi chạy unittest để chạy 34 trường hợp HTTP/ONNX
trong FastAPI TestClient; `AI_TEST_MANIFEST` chạy kiểm thử artifact Bubble thật.

### Chế độ dev thử nghiệm đã nối Game

Từ thư mục gốc AdminUI, chạy hai terminal:

```powershell
# Terminal 1: AI http://127.0.0.1:8000
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-ai.ps1 -Experimental
# Terminal 2: backend http://127.0.0.1:8081
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1 -SkipBuild -ExperimentalAi
```

Sau khi sửa Java, chạy `.\mvnw.cmd package` bằng JDK 21 trong repo [AlgoVenture_Backend](../../AlgoVenture_Backend/README.md) cùng cấp với AdminUI để build lại JAR, với PostgreSQL test riêng theo hướng dẫn của Backend.
Trên Windows, dừng backend cũ trước bước package để tránh jar bị khóa.
Mở Unity theo [README Unity](../../AlgoVenture_Unity/README.md), kết nối Backend ở `http://127.0.0.1:8081` và dùng luồng luyện bổ trợ của client.
Tài khoản chưa có history phù hợp cần luyện một bài trong thư viện trước.

Artifact dev nằm tại `.runtime/ai-research/game-artifact/manifest.json`, không
commit trọng số. Nếu clone mới/chưa có artifact, làm theo lệnh export ở
[research/README.md](research/README.md). Health AI trả `experimental_ready`.

Manifest dev dùng `deploymentMode: experimental`, `validation.status: deferred`,
kèm báo cáo kiểm tra kỹ thuật và hash. Loader chỉ nhận khi
`AI_ALLOW_EXPERIMENTAL=true` (script đặt khi có `-Experimental`). Không gán
`validation.status=passed` cho checkpoint này. Bỏ opt-in thì artifact bị từ chối.

Dev chỉ dùng những board đã có trong vocab để dựng lịch sử rút gọn; số log bỏ qua
được gửi qua backend và hiển thị cạnh bài đề xuất (`historyUsed`, `historySkipped`).
Không có history phù hợp trả `no_known_history`; candidate chưa biết vẫn bị từ chối.
Chế độ đã đánh giá giữ nguyên hành vi từ chối history ngoài vocab.
Checkpoint hiện cố định: log mới đổi đầu vào đề xuất, không tự huấn luyện lại trọng số.

### Artifact đã đánh giá

Đặt `AI_MODEL_MANIFEST` thành đường dẫn tuyệt đối tới manifest trước khi chạy AI.
Ví dụ cấu trúc ở `manifest.example.json`, với trạng thái validation chưa đạt để
tránh vô tình bật model. Model ONNX phải nằm cùng thư mục manifest. Không có
trọng số mẫu được phân phối cùng code.

Contract artifact:

- `architecture: simplekt`, `encodingVersion: bubble-board-v1`.
- `predictionTarget: first_swap_opportunity`: xác suất trả lời đúng lần đầu cho
  cơ hội đổi chỗ đầu tiên của bài ứng viên; không là xác suất đúng toàn bài.
- Vocab câu hỏi ánh xạ board key sang index; vocab KC có `bubble.next_swap.v1`.
- `sequenceLength`: chiều dài gồm lịch sử và candidate, từ 2 đến 512.
- ONNX nhận sáu tensor int64 `[batch, history_length]`: `qseqs`, `cseqs`,
  `rseqs`, `shft_qseqs`, `shft_cseqs`, `shft_rseqs`. Dùng chiều batch/time động.
- Đầu ra đã sigmoid có shape `[batch, history_length + 1]`. Chọn cột cuối.
- Candidate response placeholder là 0; validation phải kiểm tra thay placeholder
  không ảnh hưởng xác suất candidate (causal masking).
- Manifest có phiên bản, SHA256 model và tham chiếu bằng chứng validation.
  Trường `passed` là xác nhận của người đóng gói artifact, không thay thế audit.

Board key do backend tạo: SHA256 UTF-8 của chuỗi
`values_comma_separated|pair|end|pass`, tiền tố `bubble-board-v1:`.
Values là thứ tự mảng tại cơ hội thao tác, không dùng vị trí ID của phần tử.
Mỗi lần sai rồi sửa cùng cơ hội chỉ lấy response đầu tiên. Lịch sử qua nhiều
lượt được sắp theo thời điểm server nhận lượt, tie-break attempt ID, rồi sequence;
không coi đây là thời gian thực của các thiết bị offline.

Vocab ngoài phạm vi trả `unmapped_game_items`; không âm thầm đổi OOV thành KC
khác hoặc dùng checkpoint CSEDM để tuyên bố dự đoán cho Game. Chọn/huấn luyện
artifact cho miền Game là bước tiếp theo, không thay đổi lựa chọn kiến trúc/policy.

## API qua Spring Boot

- `GET /api/game/me/practice/exercises?assignmentId=...&lessonId=...`: bài/trạng thái
  đang mở, tùy ngữ cảnh; bỏ `lessonId` vẫn chọn Bubble.
- `POST /api/game/me/practice/recommendations`: `{clientRequestId, assignmentId?, lessonId?}`.
  Server đọc lịch sử thật; client không gửi prediction/response đáng tin cậy.
- Bubble có `candidateKind: playable_exercise`. Các game khác dùng
  `candidateKind: review_state`: `questionId` và snapshot/prefix đúng trạng thái
  backend từng chấm, có `stage`, `inputSnapshot`, `acceptedActions`,
  `inputVerified`, `inputProvenance`. Đây là đánh giá thao tác tiếp theo ở một
  trạng thái, chưa phải bộ sinh bài chơi lại; UI không mở minigame Bubble cho nó.
- Lịch sử generic chỉ lấy first response có `serverVerified: true`, đúng lesson,
  encoding, target và KC. `inputVerified: false` vẫn có thể được server chấm toán
  học; provenance cho biết initial board do client cung cấp và đã qua validation.
- Cùng request ID và ngữ cảnh trả cùng response đã lưu. Muốn tính lại sau lượt
  luyện mới hoặc service phục hồi, dùng request ID mới.
- `ready` có ID bài, xác suất, phiên bản model/policy; các trạng thái còn lại
  không trả bài hoặc xác suất giả. Chưa đủ lịch sử và lỗi dịch vụ được tách riêng.
- `GET /api/instructor/classes/{id}/practice`: evidence của học viên đang thuộc
  lớp, chỉ gồm lượt gắn assignment của lớp đó. Không công bố free-practice log
  qua endpoint lớp và không gọi tỉ lệ đúng quan sát là mastery.

Log bài bổ trợ giữ nguyên source `map|classroom`, thêm `activity: supplementary`,
`exerciseId` và `recommendationId` nếu do AI chọn. Snapshot cũ không bị đổi shape;
metadata đã nhận vẫn bất biến. Bài bổ trợ lưu log nhưng UI không gửi completion
để tự hoàn thành challenge set hay trao điểm bản đồ.

## Kiểm tra

Backend: chạy `.\mvnw.cmd test` trong repo [AlgoVenture_Backend](../../AlgoVenture_Backend/README.md), với PostgreSQL test riêng theo hướng dẫn của repo; không trỏ test suite vào database đang sử dụng.
Unity: chạy các bộ EditMode/PlayMode theo [README Unity](../../AlgoVenture_Unity/README.md).
Kiểm thử bằng API/model response giả lập không chứng minh chất lượng model thật.
Test backend dùng gateway mock để kiểm tra contract,
idempotency, quyền truy cập và provenance. Test service kiểm tra policy, encoding,
shape và trạng thái chưa sẵn sàng. Các test này không xác nhận độ chính xác dự đoán
trên người học mới hoặc chất lượng model đa game.

Tài liệu API thư viện: [FastAPI](https://fastapi.tiangolo.com/tutorial/body-nested-models/)
và [ONNX Runtime](https://onnxruntime.ai/docs/api/python/api_summary.html).

## Checkpoint research và dữ liệu huấn luyện Game

Đã tái lập cả 5 checkpoint simpleKT CSEDM và xuất ONNX, đối chiếu từng xác suất
trên 4.683 test predictions/fold. Công cụ, kết quả kiểm chứng và bộ xuất log
Game nằm tại [research/README.md](research/README.md). Artifact CSEDM chưa
tương thích vocab/target Game, nên không được dùng làm manifest phục vụ Bubble.
