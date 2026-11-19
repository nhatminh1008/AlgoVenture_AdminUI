import { Clock3, ListChecks, ShieldCheck, Star, Trophy } from "lucide-react";
import { useLocale, useText } from "../../../preferences/preferencesContext";
import { lessonResultCapabilities } from "./lessonResultCapabilities";

export default function LessonScoringRules({ lesson, timeLimit }) {
  const text = useText();
  const locale = useLocale();
  const { pointRule, official, requiresAllMatrixStages, usesServerTimingFallback } = lessonResultCapabilities(lesson);
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
          <p>{text("Sao dựa trên thời gian chơi cộng phạt.", "Stars use play time plus penalties.")}</p>
        </div>
      </div>

      <div className="lesson-score-thresholds">
        <h3>{hasDefaultLimit ? text("Mốc thời gian khi không mắc lỗi", "Time targets with no errors")
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
        {hasDefaultLimit && <p>{text("Ví dụ tính theo giới hạn chung đang nhập.", "Example based on the default limit entered.")}</p>}
      </div>

      <dl className="lesson-score-details">
        <div>
          <dt><ListChecks size={17} aria-hidden="true" />{text("Phạt lỗi", "Error penalties")}</dt>
          <dd>{text(
            "Năm lỗi đầu lần lượt cộng 5%, 10%, 20%, 40% và 80% giới hạn của lượt. Khi chạm giới hạn, Unity báo hết giờ và máy chủ từ chối ghi nhận hoàn thành.",
            "The first five errors add 5%, 10%, 20%, 40%, and 80% of the attempt limit, respectively. At the limit, Unity shows a timeout and the server rejects completion.",
          )}</dd>
        </div>
        <div>
          <dt><Trophy size={17} aria-hidden="true" />{text("Điểm bài chính thức", "Official lesson points")}</dt>
          <dd>{pointRule ? text(...pointRule) : text(
            "Kết quả chính thức của bài này chỉ có sao.", "This lesson's official result includes stars only.",
          )}</dd>
          {pointRule && <dd>{text("Điểm bài tối thiểu là 0.", "Lesson points have a minimum of 0.")}</dd>}
        </div>
        <div>
          <dt><Clock3 size={17} aria-hidden="true" />{text("Điểm thời gian", "Time score")}</dt>
          <dd>{text(
            "Unity làm tròn lên số giây còn lại sau phạt, nhân 1.000, chia cho giới hạn và lấy phần nguyên. Điểm từ 0–1.000 được ghi riêng trong nhật ký khi hoàn thành.",
            "Unity rounds the time remaining after penalties up to whole seconds, multiplies by 1,000, divides by the limit, and takes the integer part. The 0–1,000 score is recorded separately in the completion log.",
          )}</dd>
        </div>
        <div>
          <dt><ShieldCheck size={17} aria-hidden="true" />{text("Kết quả trên máy chủ", "Server result")}</dt>
          <dd>{official ? text(
            "Máy chủ chấm theo giới hạn đã cấp cho lượt. Khi thiếu dữ liệu chấm, một số lượt hợp lệ chỉ ghi nhận tiến độ.",
            "The server grades against the limit issued with the attempt. With incomplete scoring evidence, some accepted attempts record progress only.",
          ) : text(
            "API hiện tại chưa xác nhận hỗ trợ kết quả chính thức cho bài này.",
            "The current API does not report official result support for this lesson.",
          )}</dd>
          {official && requiresAllMatrixStages && <dd>{text(
            "Cần hoàn thành cả 3 chặng của cùng một đề. Máy chủ đối chiếu thao tác và nhật ký cả 3 chặng để tính sao từ tổng thời gian và lỗi đã xác minh.",
            "Complete all three stages of the same challenge. The server verifies the actions and log for all stages and grades stars using total time and verified errors.",
          )}</dd>}
          {official && usesServerTimingFallback && <dd>{text(
            "Nếu thao tác nộp bài hợp lệ nhưng thiếu nhật ký dùng để chấm, máy chủ có thể tính sao từ thời gian cấp đề đến lúc nộp.",
            "With valid submitted actions but no usable scoring log, the server can grade stars using the time from issuance to submission.",
          )}</dd>}
          {lesson.id === "insertion" && <dd>{text(
            "Lượt tương thích thiếu dữ liệu thời gian chơi có thể dùng hệ số điểm và ngưỡng sao đã lưu cùng đề.",
            "For compatibility, an attempt without active play time may use the point coefficients and star thresholds saved with the challenge.",
          )}</dd>}
        </div>
      </dl>
    </section>
  );
}
