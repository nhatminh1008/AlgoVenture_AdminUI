import { ChevronDown, Clock3, ListChecks, ShieldCheck, Star, Trophy } from "lucide-react";
import { useText } from "../../../preferences/preferencesContext";

const starTiers = [
  { stars: 3, points: "800–1.000", pointsEn: "800–1,000" },
  { stars: 2, points: "500–799", pointsEn: "500–799" },
  { stars: 1, points: "0–499", pointsEn: "0–499" },
];

export default function LessonScoringRules() {
  const text = useText();

  return (
    <section aria-labelledby="lesson-scoring-rules" className="panel lesson-config-card lesson-scoring">
      <div className="lesson-config-card-head">
        <span className="lesson-config-icon lesson-scoring-icon" aria-hidden="true"><Trophy size={19} /></span>
        <div>
          <h2 id="lesson-scoring-rules">{text("Cách chấm thử thách", "Challenge scoring")}</h2>
          <p>{text("Mỗi màn hoặc chặng có điểm thời gian và sao riêng.",
            "Each level or stage earns its own time score and stars.")}</p>
        </div>
      </div>

      <div className="lesson-score-thresholds">
        <h3>{text("Mốc sao khi hoàn thành", "Stars on completion")}</h3>
        <ul className="lesson-score-tiers">
          {starTiers.map(({ stars, points, pointsEn }) => (
            <li key={stars} className="lesson-score-tier">
              <span className="lesson-score-tier-label"><Star size={14} aria-hidden="true" />{stars} {text("sao", stars === 1 ? "star" : "stars")}</span>
              <strong>{text(points, pointsEn)} {text("điểm", "points")}</strong>
            </li>
          ))}
        </ul>
      </div>

      <dl className="lesson-score-details">
        <div>
          <dt><Clock3 size={17} aria-hidden="true" />{text("Điểm thời gian", "Time score")}</dt>
          <dd>{text(
            "Lấy số giây còn lại trên đồng hồ nhân 1.000, chia cho thời hạn của chặng rồi lấy phần nguyên.",
            "Multiply the seconds left on the clock by 1,000, divide by the stage limit, and round down.",
          )}</dd>
        </div>
        <div>
          <dt><ListChecks size={17} aria-hidden="true" />{text("Phạt lỗi", "Error penalties")}</dt>
          <dd>{text(
            "Năm lỗi đầu trừ lần lượt 5%, 10%, 20%, 40% và 80% thời hạn khỏi đồng hồ.",
            "The first five errors deduct 5%, 10%, 20%, 40%, and 80% of the time limit from the clock.",
          )}</dd>
        </div>
      </dl>
      <details className="lesson-score-disclosure">
        <summary>
          {text("Chi tiết cách ghi nhận", "How scores are recorded")}
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <dl className="lesson-score-details">
          <div>
            <dt><ShieldCheck size={17} aria-hidden="true" />{text("Xác nhận từng chặng", "Stage verification")}</dt>
            <dd>{text(
              "Máy chủ xác minh thao tác và tính điểm khi hoàn thành từng chặng. Chặng hết giờ hoặc bỏ dở nhận 0 điểm và 0 sao.",
              "The server verifies the actions and scores each cleared stage. Timed-out or abandoned stages earn zero points and zero stars.",
            )}</dd>
          </div>
          <div>
            <dt><Trophy size={17} aria-hidden="true" />{text("Bảng xếp hạng", "Leaderboard")}</dt>
            <dd>{text(
              "Bảng xếp hạng cộng điểm tốt nhất đã xác minh của mỗi màn hoặc chặng trên bản đồ.",
              "The leaderboard sums the best verified score for each map level or stage.",
            )}</dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
