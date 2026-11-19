import { ChevronDown, Clock3, ListChecks, ShieldCheck, Star, Trophy } from "lucide-react";
import { useLocale, useText } from "../../../preferences/preferencesContext";
import { lessonResultCapabilities } from "./lessonResultCapabilities";

export default function LessonScoringRules({ lesson, timeLimit }) {
  const text = useText();
  const locale = useLocale();
  const { pointRule, legacyPointRule, official, usesFinalStageTiming, usesServerTimingFallback } = lessonResultCapabilities(lesson);
  const hasDefaultLimit = Number.isInteger(timeLimit) && timeLimit >= 10 && timeLimit <= 86400;
  const seconds = text("giây", "sec");
  const formatSeconds = (value) => `${value.toLocaleString(locale)} ${seconds}`;
  const tiers = [
    { stars: 3, share: "≤ 20%", threshold: `≤ ${formatSeconds(timeLimit / 5)}` },
    { stars: 2, share: "> 20% – ≤ 50%", threshold: `≤ ${formatSeconds(timeLimit / 2)}` },
    { stars: 1, share: "> 50% – < 100%", threshold: `< ${formatSeconds(timeLimit)}` },
  ];

  return (
    <section aria-labelledby="lesson-scoring-rules" className="panel lesson-config-card lesson-scoring">
      <div className="lesson-config-card-head">
        <span className="lesson-config-icon lesson-scoring-icon" aria-hidden="true"><Trophy size={19} /></span>
        <div>
          <h2 id="lesson-scoring-rules">{text("Cách chấm thử thách", "Challenge scoring")}</h2>
          <p>{usesFinalStageTiming
            ? text("Sao chính thức tính theo chặng cuối.", "Official stars use the final stage.")
            : text("Tính sao theo thời gian sau phạt.", "Stars use play time plus penalties.")}</p>
        </div>
      </div>

      <div className="lesson-score-thresholds">
        <h3>{hasDefaultLimit ? text("Mốc sao · giới hạn chung, 0 lỗi", "Star targets · default limit, no errors")
          : text("Mốc tính sao", "Star thresholds")}</h3>
        <ul className="lesson-score-tiers">
          {tiers.map(({ stars, share, threshold }) => (
            <li key={stars} className="lesson-score-tier">
              <span className="lesson-score-tier-label"><Star size={14} aria-hidden="true" />{stars} {text("sao", stars === 1 ? "star" : "stars")}</span>
              {hasDefaultLimit && <strong>{threshold}</strong>}
              <span className="lesson-score-share">{share}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="lesson-score-details">
        <div>
          <dt><ListChecks size={17} aria-hidden="true" />{text("Phạt lỗi", "Error penalties")}</dt>
          <dd>{text(
            "Năm lỗi đầu cộng lần lượt 5%, 10%, 20%, 40%, 80% thời hạn.",
            "First five errors add 5%, 10%, 20%, 40%, and 80% of the time limit.",
          )}</dd>
        </div>
        <div>
          <dt><Trophy size={17} aria-hidden="true" />{text("Điểm bài chính thức", "Official lesson points")}</dt>
          <dd>{pointRule ? text(...pointRule) : text(
            "Chỉ tính sao.", "Stars only.",
          )}</dd>
        </div>
      </dl>

      <details className="lesson-score-disclosure">
        <summary>
          {text("Chi tiết cách chấm", "Scoring details")}
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <dl className="lesson-score-details">
          <div>
            <dt><ListChecks size={17} aria-hidden="true" />{text("Hết giờ và điểm tối thiểu", "Timeout and minimum points")}</dt>
            <dd>{text("Chạm giới hạn sau phạt thì hết giờ và lượt không được xác nhận hoàn thành.",
              "Reaching the limit after penalties times out the attempt and prevents completion.")}</dd>
            {pointRule && <dd>{text("Điểm bài tối thiểu là 0.", "Lesson points have a minimum of 0.")}</dd>}
            {legacyPointRule && <dd>{text("Đề tổng hợp kiểu cũ dùng công thức", "Legacy mixed challenges use")} {text(...legacyPointRule)}</dd>}
          </div>
          <div>
            <dt><Clock3 size={17} aria-hidden="true" />{text("Điểm thời gian", "Time score")}</dt>
            <dd>{text(
              "Unity làm tròn lên số giây còn lại sau phạt, nhân 1.000, chia cho giới hạn rồi lấy phần nguyên. Điểm 0–1.000 được lưu trong nhật ký.",
              "Unity rounds remaining time after penalties up to full seconds, multiplies by 1,000, divides by the limit, and rounds down. The 0–1,000 score goes in the log.",
            )}</dd>
          </div>
          <div>
            <dt><ShieldCheck size={17} aria-hidden="true" />{text("Kết quả trên máy chủ", "Server result")}</dt>
            <dd>{official ? text(
              "Máy chủ dùng giới hạn đã cấp. Khi thiếu dữ liệu chấm, một số lượt chỉ ghi nhận tiến độ.",
              "The server uses the issued limit. With incomplete scoring evidence, some attempts record progress only.",
            ) : text(
              "API chưa xác nhận hỗ trợ kết quả chính thức cho bài này.",
              "The API does not report official result support for this lesson.",
            )}</dd>
            {official && usesFinalStageTiming && <dd>{text(
              "Cần vượt đủ 3 chặng. Khi có mốc chuyển chặng hợp lệ, sao dùng thời gian và lỗi chặng cuối. Lượt cũ thiếu mốc dùng thời gian và lỗi cả lượt.",
              "Finish all three stages. With valid stage markers, stars use the final stage's time and errors. Legacy logs without markers use the full attempt.",
            )}</dd>}
            {official && usesServerTimingFallback && <dd>{text(
              "Nếu thao tác hợp lệ nhưng thiếu nhật ký chấm, máy chủ có thể dùng thời gian từ lúc cấp đề đến lúc nộp.",
              "For valid submissions without a usable log, the server may use the time from issuance to submission.",
            )}</dd>}
            {lesson.id === "insertion" && <dd>{text(
              "Lượt cũ thiếu thời gian chơi có thể dùng hệ số điểm và ngưỡng sao lưu cùng đề.",
              "Legacy attempts without active play time may use the coefficients and star thresholds saved with the challenge.",
            )}</dd>}
          </div>
        </dl>
      </details>
    </section>
  );
}
