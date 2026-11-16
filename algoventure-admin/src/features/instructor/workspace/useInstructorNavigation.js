import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InstructorNoticeContext } from "./InstructorNoticeContext.js";

const sections = new Set(["classes", "challenges", "quizzes", "progress", "analytics", "export"]);
const root = "/instructor";

export function instructorSection(pathname) {
  if (!pathname.startsWith(`${root}/`)) return null;
  const section = pathname.split("/")[2];
  return sections.has(section) ? section : null;
}

export function instructorActivePath(pathname, search = "") {
  const from = new URLSearchParams(search).get("from");
  const section = sections.has(from) ? from : instructorSection(pathname);
  return section ? `${root}/${section}` : null;
}

export function instructorDestination(to, activePath) {
  const url = new URL(to, "http://instructor.local");
  if (activePath && instructorSection(url.pathname)) {
    const origin = instructorSection(activePath);
    if (origin !== instructorSection(url.pathname)) url.searchParams.set("from", origin);
    else url.searchParams.delete("from");
  }
  return url.pathname + url.search + url.hash;
}

export function instructorParent(pathname, search = "") {
  const params = new URLSearchParams(search);
  const [, , section, classId, area, resourceId, kind] = pathname.replace(/\/+$/, "").split("/");
  const classPath = `${root}/classes/${classId}`;
  const activePath = instructorActivePath(pathname, search);
  const withOrigin = (to) => instructorDestination(to, activePath);
  const without = (...keys) => {
    keys.forEach((key) => params.delete(key));
    return pathname + (params.size ? `?${params}` : "");
  };

  if (section === "classes" && classId) {
    if (classId === "new") return activePath;
    if (!area) return activePath === `${root}/progress` ? `${activePath}?classId=${classId}` : `${root}/classes`;
    if (area === "edit") return withOrigin(classPath);
    if (area === "assign") {
      return params.get("template") ? without("template") : withOrigin(`${classPath}?tab=assignments`);
    }
    if (area === "quizzes") {
      if ((kind === "edit" || resourceId === "new") && params.has("preview")) return without("preview", "previewPage");
      if (kind === "edit") return withOrigin(`${classPath}/quizzes/${resourceId}`);
      return activePath === `${root}/quizzes`
        ? `${activePath}?classId=${classId}`
        : withOrigin(`${classPath}?tab=quizzes`);
    }
    if (area === "students" && resourceId) {
      const student = `${classPath}/students/${resourceId}`;
      if (kind === "quizzes") {
        return params.has("attemptId")
          ? without("attemptId", "answers")
          : withOrigin(`${student}?tab=quizzes`);
      }
      if (kind === "assignments") return withOrigin(`${student}?tab=assignments`);
      return activePath === `${root}/progress`
        ? `${activePath}?classId=${classId}`
        : withOrigin(`${classPath}?tab=students`);
    }
  }
  if (section === "challenges") {
    const scopedClass = params.get("classId");
    if (scopedClass && (params.has("assignmentId") || params.has("assignmentTemplateId"))) {
      return withOrigin(`${root}/classes/${encodeURIComponent(scopedClass)}?tab=assignments`);
    }
    if (classId === "new" || params.has("assignmentTemplateId") || params.has("assignmentId")) {
      return withOrigin(`${root}/challenges`);
    }
  }
  if (section === "progress" && activePath === `${root}/classes` && params.get("classId")) {
    return withOrigin(`${root}/classes/${encodeURIComponent(params.get("classId"))}?tab=students`);
  }
  if (activePath && activePath !== `${root}/${section}`) return activePath;
  return null;
}

export function instructorBack(location, index, levels = 1) {
  let parent = location.state?.instructorParent;
  let to = location.pathname + location.search;
  let traversed = 0;
  while (traversed < levels && Number.isInteger(index) && parent?.index === index - traversed - 1
    && typeof parent.to === "string" && parent.to.startsWith(`${root}/`)) {
    traversed += 1;
    to = parent.to;
    if (traversed === levels) return { to, delta: -traversed, key: parent.key };
    parent = parent.parent;
  }

  for (let level = traversed; level < levels && to; level++) {
    const url = new URL(to, "http://instructor.local");
    to = instructorParent(url.pathname, url.search);
  }
  // A wizard opened by URL can have a previous step but no class entry.
  return to && traversed ? { to, replaceAfter: -traversed } : { to };
}

export function instructorChildState(location, index) {
  const parent = location.state?.instructorParent;
  return {
    instructorParent: {
      to: location.pathname + location.search + location.hash,
      key: location.key,
      index,
      parent: parent && { to: parent.to, key: parent.key, index: parent.index },
    },
  };
}

export function useInstructorNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const showNotice = useContext(InstructorNoticeContext);
  // BrowserRouter records the entry index in history.state.
  const index = window.history.state?.idx;
  const activePath = instructorActivePath(location.pathname, location.search);
  const back = instructorBack(location, index);

  function open(to) {
    navigate(instructorDestination(to, activePath), { state: instructorChildState(location, index) });
  }

  function finish({ to, message, levels = 1 } = {}) {
    if (window.history.state?.idx !== index || window.location.pathname !== location.pathname) return;
    const destination = to ? { to: instructorDestination(to, activePath) } : instructorBack(location, index, levels);
    if (destination.delta) {
      if (message) showNotice(destination.key, message);
      navigate(destination.delta);
    } else if (destination.replaceAfter) {
      const parentIndex = index + destination.replaceAfter;
      window.addEventListener("popstate", (event) => {
        if (event.state?.idx === parentIndex) navigate(destination.to, { replace: true, state: { message } });
      }, { once: true });
      navigate(destination.replaceAfter);
    } else if (destination.to) {
      navigate(destination.to, { replace: true, state: to ? { ...location.state, message } : { message } });
    }
  }

  return { back, open, finish };
}
