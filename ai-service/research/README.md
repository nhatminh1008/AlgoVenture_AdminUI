# Kiểm chứng checkpoint và chuẩn bị dữ liệu Game

Ngày kiểm tra: 03/11/2026. Giữ lựa chọn **simpleKT + Target Correctness 0.70**.

## Đã kiểm chứng

`audit_csedm.py` kiểm tra SHA-256 của archive frozen và cả 5 checkpoint;
nạp đúng source/config/vocab trong archive, `load_state_dict(strict=True)`;
chạy CPU và xuất ONNX với 6 đầu vào int64 giống contract của service.

Source gốc tạo attention mask bằng NumPy. Bản xuất thay riêng bước tạo mask
bằng `torch.arange` để độ dài chuỗi thay đổi được. Không sửa trọng số hoặc
archive gốc. So sánh bản gốc, bản portable và ONNX trên toàn bộ test;
kiểm tra thêm 5 cặp batch/độ dài (history 1, 2, 5, 17, 199). Đổi response
của câu hiện tại không được làm đổi prediction của câu đó hoặc quá khứ.
Fixtures ngẫu nhiên chỉ phục vụ kiểm tra kỹ thuật, không dùng huấn luyện.

Kết quả lưu trong [csedm-audit.json](csedm-audit.json):

| Fold | Số dự đoán test | AUC ONNX | Accuracy ONNX |
| --- | ---: | ---: | ---: |
| 0 | 4683 | 0.807089 | 0.760624 |
| 1 | 4683 | 0.806093 | 0.760196 |
| 2 | 4683 | 0.805345 | 0.759129 |
| 3 | 4683 | 0.805853 | 0.765535 |
| 4 | 4683 | 0.806235 | 0.761905 |

Mỗi fold dùng cùng tập test; không cộng lại thành 23.415 mẫu độc lập.
Sai lệch lớn nhất so với xác suất research đã lưu: 7.16e-7.
Sai lệch lớn nhất giữa bản gốc/portable/ONNX và các fixture: 1.17e-6,
thấp hơn ngưỡng kiểm tra 2e-5. Nhãn và thứ tự dự đoán khớp reference.
Đây là tái lập dự đoán CSEDM, không chứng minh hiệu quả học tập trong Game.

## Chạy lại

Cài `requirements.txt` trong môi trường research riêng (Python 3.11).
Môi trường đã chạy tại repo là `.runtime/ai-research-venv`, dùng PyTorch CPU
có sẵn qua `--system-site-packages`. Service FastAPI vẫn dùng môi trường riêng.

Từ thư mục gốc AdminUI, PowerShell:

```powershell
& .runtime/ai-research-venv/Scripts/python.exe ai-service/research/audit_csedm.py `
  --archive 'C:\Users\Nhat Minh\Desktop\CSEDM\Bản 2\CSEDM_FRESH_V2_M01_FULL.zip' `
  --output .runtime/ai-research/csedm
```

ONNX và vocab nằm trong `.runtime/ai-research/csedm/fold0` đến `fold4`.
Không tạo manifest triển khai Game. Export dùng TorchScript ONNX exporter
`dynamo=False` (có cảnh báo deprecated); các kiểm tra parity và shape là bắt buộc
khi đổi exporter hoặc dependency. Summary được đặt `running` trước mỗi lần chạy;
chỉ có `passed` khi cả 5 fold hoàn tất.

## Dữ liệu Game hiện tại

`export_game_observations.py` đọc **read-only** các firstResponse đã được backend
replay xác nhận, dùng encoding board đúng `PracticeCatalog.questionId`.
Giữ thứ tự received_at của attempt rồi sequence, giống lịch sử phục vụ inference.
Retries và sự kiện tự động không thành nhãn mới. Cả minigame và bài bổ trợ
chung schema, có activity/source/exerciseId để truy nguồn.

Mặc định loại tài khoản email bắt đầu `qa.`. Đây chỉ là quy tắc loại QA đã biết,
không chứng nhận các tài khoản còn lại là người tham gia nghiên cứu thật.
ID người học/lượt chơi được thay bằng HMAC; key nằm riêng tại output, không
commit key hoặc dữ liệu từng người. Người có quyền truy cập folder vẫn có thể
liên kết các dòng cùng người học: đây là pseudonymization, không phải ẩn danh hoàn toàn.

Snapshot [game-readiness.json](game-readiness.json): 59 observations, 1 tài khoản,
8 lượt; gồm 38 first responses minigame và 21 first responses bổ trợ;
loại 54 QA observations. Cả 3 bài bổ trợ đã có log.
Không đủ để chia train/validation/test theo người học và đánh giá model Game.

Đặt biến môi trường chuẩn `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`
hoặc dùng pgpass; không ghi password vào command/file được commit:

```powershell
& .runtime/ai-research-venv/Scripts/python.exe ai-service/research/export_game_observations.py `
  --psql 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
  --output .runtime/ai-research/game
& .runtime/ai-research-venv/Scripts/python.exe -m unittest discover `
  -s ai-service/research -p 'test_*.py'
```

`--include-qa` chỉ để debug pipeline; report vẫn `trainingApproved=false`.
Output gồm `observations.jsonl`, `readiness.json`, `pseudonym.key`. Giữ key ổn định
khi cần nối nhiều snapshot; không trộn snapshot dùng các key khác nhau.

## Chuẩn bị dataset và huấn luyện thử

Phần đánh giá chất lượng AI đang hoãn theo yêu cầu. Hai lệnh dưới đây hoàn thiện
pipeline kỹ thuật với dữ liệu đang có, không yêu cầu đủ người tham gia nghiên cứu:

```powershell
& .runtime/ai-research-venv/Scripts/python.exe ai-service/research/prepare_game_dataset.py `
  --observations .runtime/ai-research/game/observations.jsonl `
  --output .runtime/ai-research/game/dataset
& .runtime/ai-research-venv/Scripts/python.exe ai-service/research/train_game_simplekt.py `
  --experimental --dataset .runtime/ai-research/game/dataset `
  --archive 'C:\Users\Nhat Minh\Desktop\CSEDM\Bản 2\CSEDM_FRESH_V2_M01_FULL.zip' `
  --output .runtime/ai-research/experiments/bubble-dev-001 `
  --epochs 2 --max-steps 2
```

Thư mục experiment phải mới; lệnh từ chối ghi đè. Cài dependency research riêng
trước khi chạy. Công cụ không đọc validation/test để huấn luyện, không tự cấu hình
AI service hoặc sinh manifest triển khai.

Dataset có `train.jsonl`, `validation.jsonl`, `test.jsonl`, `vocab.json`,
`learner-splits.json`, `dataset.json`:

- Người học không xuất hiện ở nhiều tập; vocab chỉ fit trên train. QA bị từ chối.
- Ít hơn 3 người học: toàn bộ ở train, hai tập còn lại để trống; không dựng tập test giả.
- Giữ thứ tự log, nối lịch sử cả minigame và bổ trợ giống inference.
  Cửa sổ tối đa 200 observations, chồng 1 observation làm ngữ cảnh.
  Mỗi response sau observation đầu tiên của mỗi người được tính loss đúng 1 lần.
- OOV ở validation/test có ID riêng, không thêm vào train vocab.
- Chia snapshot bằng hash rank với seed cố định, khoảng 60/20/20 khi đủ nhóm.
  Tập có thể đổi khi thêm người học: cần đóng băng `learner-splits.json`
  và dataset cho mỗi nghiên cứu; chưa hỗ trợ nối cohort mới vào split đã đóng băng.
- `bubble-candidates.json` là snapshot catalog backend. Unit test báo lỗi nếu
  ID/input trong `PracticeCatalog.java` thay đổi; cập nhật snapshot khi sửa catalog.

Trainer dùng **source simpleKT đã pin trong research**, kiến trúc 256 dimensions,
2 attention blocks, 4 heads; khởi tạo trọng số mới cho Game. Không chuyển embedding
CSEDM thành Bubble bằng cách đổi tên. Adam 1e-4, BCE cho next response,
gradient clipping; checkpoint lưu kèm config/vocab, seed, hash dữ liệu và source.
Huấn luyện thử từ đầu này chỉ xác nhận pipeline; chiến lược huấn luyện/adapt
chính thức và đánh giá sẽ xử lý sau. `trainingApproved=false` ở exporter có nghĩa
chưa đủ chứng cứ dùng làm nghiên cứu/triển khai, không cấm thử kỹ thuật bằng
`--experimental`.

Đã chạy thử 2 optimizer steps trên 59 observations thật ngoài QA (58 targets),
52 board IDs. Cả 3 candidate có trong vocab nhưng mỗi board đầu bài mới có
1 observation từ 1 người. Checkpoint được nạp lại với `strict=True` và kiểm tra
đổi response hiện tại không làm đổi prediction của hiện tại/quá khứ.
Kết quả kỹ thuật: [game-training-smoke.json](game-training-smoke.json),
coverage: [game-dataset.json](game-dataset.json).

Training loss chỉ là thông tin debug; chưa đo AUC/calibration cho Game.
Không sinh manifest có `validation.status=passed`. Checkpoint thử chỉ được phục vụ
trong chế độ dev opt-in dưới đây. Policy vẫn là Target Correctness 0.70.

## Xuất ONNX và nối Game trong chế độ dev

```powershell
& .runtime/ai-research-venv/Scripts/python.exe ai-service/research/export_game_onnx.py `
  --experimental --experiment .runtime/ai-research/experiments/bubble-smoke-reload-20261103 `
  --dataset .runtime/ai-research/game/dataset `
  --archive 'C:\Users\Nhat Minh\Desktop\CSEDM\Bản 2\CSEDM_FRESH_V2_M01_FULL.zip' `
  --output .runtime/ai-research/game-artifact
.\scripts\start-ai.ps1 -Experimental
# Terminal khác:
.\scripts\start-backend.ps1 -SkipBuild -ExperimentalAi
```

Thay đường dẫn experiment nếu tự huấn luyện run khác. Dataset phải khớp hash
đã lưu trong run; output phải là thư mục mới. Exporter kiểm tra trọng số, source,
10 cặp batch/độ dài, tính bất biến với response hiện tại, và bài TC 0.70 chọn
trước/sau chuyển ONNX. Chỉ sau khi các kiểm tra đạt mới ghi manifest dev.
Sai lệch lớn nhất của run hiện tại là 5.96e-8; báo cáo kỹ thuật ở
`.runtime/ai-research/game-artifact/technical-validation.json`.

Chạy lại kiểm tra real-artifact trong thư mục `ai-service`:

```powershell
$env:AI_TEST_MANIFEST=(Resolve-Path '..\.runtime\ai-research\game-artifact\manifest.json').Path
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

Browser test thật nằm tại Game `tests/practice-live-ai.spec.ts`, mặc định skip.
Trong thư mục Game, khi 3 service đang chạy:

```powershell
$env:RUN_LIVE_AI='true'
$env:PLAYWRIGHT_CHANNEL='msedge'
npx playwright test tests/practice-live-ai.spec.ts
```

Test tạo tài khoản `qa.ai.live.*`, chơi bài thư viện, nhận đề xuất ONNX thật,
làm bài AI chọn, đọc lại log đã lưu và yêu cầu đề xuất mới. Không dùng mock API
hoặc xác suất giả; dữ liệu test vẫn bị exporter loại theo prefix QA.

Đã xác nhận trên PostgreSQL thật: đề xuất lần đầu dùng 4 observations, sau khi
luyện dùng 8; recommendation IDs mới và provenance được giữ đúng. Không có
assertion ép bài phải đổi, vì TC có thể chọn lại cùng bài khi xác suất gần mục tiêu.

## Phần còn lại để bật đề xuất Game

1. Thu log người học thật cho cả minigame và 3 bài bổ trợ; kiểm tra chất lượng
   nhãn first-response và coverage board của từng candidate.
2. Chia dữ liệu theo người học trước khi fit vocab. Dành nhóm validation/test
   riêng, báo cáo OOV và calibration. CSEDM có 50 bài, 18 KC lập trình;
   không gán tùy ý chúng thành `bubble.next_swap.v1` hoặc board Game.
3. Huấn luyện/adapt simpleKT với target Game, kiểm tra Target Correctness 0.70
   trên xác suất đã đánh giá. Chuyển ONNX, làm lại parity và causal checks.
4. Tạo manifest Game kèm hash/vocab/evidence, rồi cấu hình AI service và backend.

Hiện checkpoint CSEDM đã dùng lại được cho nghiên cứu/inference CSEDM.
Game vẫn chưa có artifact triển khai đã kiểm chứng. Việc sửa vocab/manifest đơn thuần
không biến checkpoint này thành model dự đoán đúng cho Bubble.
