import { useText } from "../../../preferences/preferencesContext";
import { usePagination } from "../../../shared/hooks/usePagination";
import Pagination from "../../../shared/components/Pagination";
import { lessonResultCapabilities } from "./lessonResultCapabilities.js";

export default function LessonResultCapabilitiesTable({ lessons }) {
  const text = useText();
  const page = usePagination(lessons, "lesson-result-capabilities");
  return (
    <section className="panel mt-6 p-6">
      <h2 className="text-xl font-bold">{text("Kết quả theo bài học", "Results by lesson")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr>
            <th scope="col" className="p-2">{text("Bài học", "Lesson")}</th>
            <th scope="col" className="p-2">{text("Điểm", "Score")}</th>
            <th scope="col" className="p-2">{text("Sao", "Stars")}</th>
            <th scope="col" className="p-2">{text("Kết quả lưu ở Backend", "Result stored by Backend")}</th>
          </tr></thead>
          <tbody>
            {page.items.map((lesson) => {
              const result = lessonResultCapabilities(lesson);
              return (
                <tr key={lesson.id} className="border-t">
                  <th scope="row" className="p-2">{text(lesson.name)}</th>
                  <td className="p-2">{result.score ? text("Có", "Yes") : "—"}</td>
                  <td className="p-2">{text("Thời gian chơi + phạt", "Play time + penalties")}</td>
                  <td className="p-2">{result.official
                    ? result.score ? text("Điểm, sao và tiến độ", "Score, stars and progress") : text("Sao và tiến độ", "Stars and progress")
                    : text("Tiến độ", "Progress")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination pagination={page} />
    </section>
  );
}
