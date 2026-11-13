export const StudentIdentity = ({ name, email }) => (
  <div className="instructor-student">
    <span className="instructor-student-avatar" aria-hidden="true">{name?.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("")}</span>
    <div><p className="instructor-student-name">{name}</p>{email && <p className="instructor-student-email">{email}</p>}</div>
  </div>
);
