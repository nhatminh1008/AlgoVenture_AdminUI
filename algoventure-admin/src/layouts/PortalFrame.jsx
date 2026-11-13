import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Command, LogOut, Menu, Search, X } from "lucide-react";
import BrandMark from "../shared/components/BrandMark";
import "./PortalFrame.css";

const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export default function PortalFrame({ user, logout, navItems, className = "", children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigationId = useId();
  const menuButton = useRef(null);
  const sidebar = useRef(null);
  const searchDialog = useRef(null);
  const searchInput = useRef(null);
  const { pathname } = useLocation();
  const current = [...navItems].reverse().find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) || navItems[0];
  const initials = user.name?.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("") || "AV";
  const isAdmin = user.role === "admin";
  const results = navItems.filter((item) => normalize(item.name).includes(normalize(query.trim())));

  function openSearch() { setQuery(""); searchDialog.current?.showModal(); searchInput.current?.focus(); }
  function closeMenu() { setMenuOpen(false); }
  useEffect(() => { document.title = current.name; }, [current.name]);
  useEffect(() => {
    const keydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector("a")?.focus();
    const desktop = window.matchMedia("(min-width: 1025px)");
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", resize);
    return () => { document.body.style.overflow = previous; desktop.removeEventListener("change", resize); menuButton.current?.focus(); };
  }, [menuOpen]);

  return (
    <div className={`portal-frame ${className}`}>
      <a href="#main-content" className="skip-link">Đến nội dung chính</a>
      {menuOpen && <button className="portal-backdrop" aria-label="Đóng điều hướng" tabIndex={-1} onClick={closeMenu} />}
      <aside ref={sidebar} className={`portal-sidebar${menuOpen ? " is-open" : ""}`} onKeyDown={(event) => {
        if (!menuOpen) return;
        if (event.key === "Escape") closeMenu();
        if (event.key === "Tab") {
          const elements = [...sidebar.current.querySelectorAll("a, button")].filter((element) => element.getClientRects().length);
          const first = elements[0], last = elements.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
        <Link to={navItems[0].path} className="portal-wordmark" onClick={() => setMenuOpen(false)} aria-label="AlgoVenture — Trang chủ">
          <BrandMark className="portal-mark" /><span>AlgoVenture</span>
        </Link>
        <button className="portal-drawer-close" onClick={closeMenu} aria-label="Đóng menu"><X size={20} /></button>
        <nav id={navigationId} aria-label="Điều hướng chính" className="portal-navigation">
          {navItems.map((item, index) => <div key={item.path}>
            {(index === 0 || item.group !== navItems[index - 1].group) && <p className="portal-nav-label">{item.group || "Không gian làm việc"}</p>}
            <NavLink to={item.path} end={item.path === "/admin"} onClick={() => setMenuOpen(false)} className={({ isActive }) => `portal-nav-link${isActive ? " is-active" : ""}`}>
              {item.icon}<span>{item.name}</span><ChevronRight className="nav-active-arrow" size={14} />
            </NavLink>
          </div>)}
        </nav>
        <div className="portal-sidebar-bottom">
          <div className="portal-account">
            <span className="portal-avatar" aria-hidden="true">{initials}</span>
            <div><strong title={user.name}>{user.name}</strong></div>
            <button className="portal-logout" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>
      <div className="portal-workarea" inert={menuOpen || undefined}>
        <header className="portal-topbar">
          <button ref={menuButton} className="portal-menu-button portal-icon-button" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls={navigationId} onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="portal-breadcrumb"><span>{isAdmin ? "Quản trị" : "Giảng dạy"}</span><ChevronRight size={14} /><strong>{current.name}</strong></div>
          <div className="portal-topbar-actions">
            <button className="portal-search-trigger" onClick={openSearch} aria-label="Tìm trang" aria-keyshortcuts="Control+k Meta+k">
              <Search size={17} /><span>Tìm trang…</span><kbd>Ctrl K</kbd>
            </button>
          </div>
        </header>
        <main id="main-content" className="portal-content" tabIndex={-1}>{children}</main>
      </div>
      <dialog ref={searchDialog} className="portal-search-dialog" aria-labelledby="portal-search-title" onClick={(event) => { if (event.target === event.currentTarget) searchDialog.current.close(); }}>
        <div className="portal-search-dialog-header"><Command size={20} /><h2 id="portal-search-title">Đi đến trang</h2><button onClick={() => searchDialog.current.close()} aria-label="Đóng tìm kiếm"><X size={20} /></button></div>
        <label className="portal-dialog-search"><Search size={18} /><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trang bạn cần…" aria-label="Tìm trang" /></label>
        <div className="portal-search-results">{results.map((item) => <Link key={item.path} to={item.path} onClick={() => { searchDialog.current.close(); setMenuOpen(false); }}>{item.icon}<span>{item.name}</span><ArrowUpRight size={16} /></Link>)}{!results.length && <p role="status">Không tìm thấy trang phù hợp.</p>}</div>
        <p className="portal-search-hint">Dùng Tab để chọn · Enter để mở · Esc để đóng</p>
      </dialog>
    </div>
  );
}
