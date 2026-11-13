export const PageHeader = ({ title, children }) => (
  <header className="instructor-page-header">
    <div className="page-heading"><h1>{title}</h1></div>
    {children && <div className="page-header-actions">{children}</div>}
  </header>
);
