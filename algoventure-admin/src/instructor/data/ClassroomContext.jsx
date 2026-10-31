import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/client";

const ClassroomContext = createContext(null);
export function ClassroomProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [storageError, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const next = await api("/instructor/state");
      setData(next);
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);
  async function save(collection, path, values, id) {
    const result = await api(`/instructor/${path}${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      body: { ...values, due: values.due || null },
    });
    setData((previous) => ({
      ...previous,
      [collection]: id
        ? previous[collection].map((item) => (item.id === id ? result : item))
        : [...previous[collection], result],
    }));
    setError("");
    return result;
  }
  async function removeQuiz(id) {
    await api(`/instructor/quizzes/${id}`, { method: "DELETE" });
    setData((previous) => ({
      ...previous,
      quizzes: previous.quizzes.filter((item) => item.id !== id),
    }));
  }
  if (!data)
    return (
      <div className="p-8">
        {storageError ? (
          <p role="alert">
            {storageError}{" "}
            <button className="btn-secondary" onClick={refresh}>
              Thử lại
            </button>
          </p>
        ) : (
          <p role="status">Đang tải dữ liệu lớp học…</p>
        )}
      </div>
    );
  return (
    <ClassroomContext.Provider
      value={{
        ...data,
        instructor: user,
        storageError,
        refresh,
        saveClass: (v, id) => save("classes", "classes", v, id),
        saveAssignment: (v, id) => save("assignments", "assignments", v, id),
        saveQuiz: (v, id) => save("quizzes", "quizzes", v, id),
        removeQuiz,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}
export function useClassrooms() {
  return useContext(ClassroomContext);
}
