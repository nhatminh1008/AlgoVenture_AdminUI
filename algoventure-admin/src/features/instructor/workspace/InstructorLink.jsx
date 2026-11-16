import { Link, useLocation, useResolvedPath, createPath } from "react-router-dom";
import { instructorActivePath, instructorChildState, instructorDestination } from "./useInstructorNavigation";

export default function InstructorLink({ to, replace = false, ...props }) {
  const location = useLocation();
  const path = useResolvedPath(to);
  const toPath = instructorDestination(createPath(path), instructorActivePath(location.pathname, location.search));
  const keepEntry = replace || toPath === createPath(location);
  return <Link {...props} to={toPath} replace={keepEntry}
    state={keepEntry ? location.state : instructorChildState(location, window.history.state?.idx)} />;
}
