import { useText } from "../preferences/preferencesContext";
import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useMatch } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Command, LogOut, Menu, Search, X } from "lucide-react";
import LanguageToggle from "../preferences/LanguageToggle";
import ThemeToggle from "../preferences/ThemeToggle";
import BrandMark from "../shared/components/BrandMark";
import "./PortalFrame.css";
import "./PortalMobile.css";

const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export default function PortalFrame({ user, logout, navItems, className = "", children }) {
  const text = useText();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const navigationId = useId();
  const logoutTitleId = useId();
  const logoutDescriptionId = useId();
  const menuButton = useRef(null);
  const sidebar = useRef(null);
  const searchDialog = useRef(null);
  const searchInput = useRef(null);
  const logoutDialog = useRef(null);
  const cancelLogout = useRef(null);
  const { pathname } = useLocation();
  const current = [...navItems].reverse().find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) || navItems[0];
  const profileMatch = useMatch("/profile");
  const pageName = profileMatch ? text("Hồ sơ của tôi") : current.name;
  const initials = user.name?.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("") || "AV";
  const isAdmin = user.role === "admin";
  const results = navItems.filter((item) => normalize(item.name).includes(normalize(query.trim())));

  function openSearch() { setQuery(""); searchDialog.current?.showModal(); searchInput.current?.focus(); }
  function closeMenu() { setMenuOpen(false); }
  function confirmLogout() {
    logoutDialog.current.showModal();
    cancelLogout.current.focus();
  }
  async function signOut(event) {
    event.preventDefault();
    if (signingOut) return;
    logoutDialog.current.close();
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }
  useEffect(() => { document.title = pageName; }, [pageName]);
  useEffect(() => {
    const keydown = (event) => {
      if (logoutDialog.current?.open) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    const trigger = menuButton.current;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector("a")?.focus();
    const desktop = window.matchMedia("(min-width: 1025px)");
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", resize);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener("change", resize);
      if (!desktop.matches) trigger?.focus();
    };
  }, [menuOpen]);

  return (
    <div className={`portal-frame ${className}`}>
      <a href="#main-content" className="skip-link">{text("Đến nội dung chính")}</a>
      {menuOpen && <button className="portal-backdrop" aria-label={text("Đóng điều hướng")} tabIndex={-1} onClick={closeMenu} />}
      <aside id={navigationId} ref={sidebar} className={`portal-sidebar${menuOpen ? " is-open" : ""}`} onKeyDown={(event) => {
        if (!menuOpen) return;
        if (event.key === "Escape") closeMenu();
        if (event.key === "Tab") {
          const elements = [...sidebar.current.querySelectorAll("a[href], button:not(:disabled)")].filter((element) => element.getClientRects().length);
          const first = elements[0], last = elements.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
        <Link to={navItems[0].path} className="portal-wordmark" onClick={() => setMenuOpen(false)} aria-label={text("AlgoVenture — Trang chủ")}>
          <BrandMark className="portal-mark" /><span>AlgoVenture</span>
        </Link>
        <button className="portal-drawer-close" onClick={closeMenu} aria-label={text("Đóng menu")}><X size={20} /></button>
        <nav aria-label={text("Điều hướng chính")} className="portal-navigation">
          {navItems.map((item, index) => <div key={item.path}>
            {(index === 0 || item.group !== navItems[index - 1].group) && <p className="portal-nav-label">{item.group || "Không gian làm việc"}</p>}
            <NavLink to={item.path} end={item.path === "/admin"} onClick={() => setMenuOpen(false)} className={({ isActive }) => `portal-nav-link${isActive ? " is-active" : ""}`}>
              {item.icon}<span>{item.name}</span><ChevronRight className="nav-active-arrow" size={14} />
            </NavLink>
          </div>)}
        </nav>
        <div className="portal-sidebar-bottom">
          <div className="portal-drawer-preferences">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          <div className="portal-account">
            <span className="portal-avatar" aria-hidden="true">{initials}</span>
            <div><NavLink to="/profile" title={user.name} onClick={closeMenu}><strong>{user.name}</strong></NavLink></div>
            <button type="button" className="portal-logout" onClick={confirmLogout} disabled={signingOut}
              aria-haspopup="dialog" aria-label={text("Đăng xuất")} title={text("Đăng xuất")}><LogOut size={18} aria-hidden="true" /></button>
          </div>
        </div>
      </aside>
      <div className="portal-workarea" inert={menuOpen || undefined}>
        <header className="portal-topbar">
          <div className="portal-topbar-navigation">
            <button ref={menuButton} className="portal-menu-button portal-icon-button" aria-label={text("Mở menu")} aria-expanded={menuOpen} aria-controls={navigationId} onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
            <div className="portal-breadcrumb">
              {isAdmin ? <Link to={navItems[0].path}>{text("Quản trị")}</Link> : <span>{text("Giảng dạy")}</span>}
              <ChevronRight size={14} aria-hidden="true" />
              <strong aria-current="page">{pageName}</strong>
            </div>
          </div>
          <button className="portal-search-trigger" onClick={openSearch} aria-label={text("Tìm trang")} aria-keyshortcuts="Control+k Meta+k">
            <Search size={17} /><span>{text("Tìm trang…")}</span><kbd>Ctrl K</kbd>
          </button>
          <div className="portal-topbar-preferences">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>
        <main id="main-content" className="portal-content" tabIndex={-1}>{children}</main>
      </div>
      <dialog ref={searchDialog} className="portal-search-dialog" aria-labelledby="portal-search-title" onClick={(event) => { if (event.target === event.currentTarget) searchDialog.current.close(); }}>
        <div className="portal-search-dialog-header"><Command size={20} /><h2 id="portal-search-title">{text("Đi đến trang")}</h2><button onClick={() => searchDialog.current.close()} aria-label={text("Đóng tìm kiếm")}><X size={20} /></button></div>
        <label className="portal-dialog-search"><Search size={18} /><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Tìm trang bạn cần…")} aria-label={text("Tìm trang")} /></label>
        <div className="portal-search-results">{results.map((item) => <Link key={item.path} to={item.path} onClick={() => { searchDialog.current.close(); setMenuOpen(false); }}>{item.icon}<span>{item.name}</span><ArrowUpRight size={16} /></Link>)}{!results.length && <p role="status">{text("Không tìm thấy trang phù hợp.")}</p>}</div>
        <p className="portal-search-hint">{text("Dùng Tab để chọn · Enter để mở · Esc để đóng")}</p>
      </dialog>
      <dialog ref={logoutDialog} className="portal-logout-dialog" role="alertdialog"
        aria-labelledby={logoutTitleId} aria-describedby={logoutDescriptionId}>
        <form onSubmit={signOut}>
          <span className="portal-logout-icon"><LogOut size={21} aria-hidden="true" /></span>
          <h2 id={logoutTitleId}>{text("Đăng xuất khỏi AlgoVenture?", "Sign out of AlgoVenture?")}</h2>
          <p id={logoutDescriptionId}>{text("Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng portal.", "You’ll need to sign in again to use the portal.")}</p>
          <div className="portal-logout-actions">
            <button ref={cancelLogout} type="button" className="btn-secondary" onClick={() => logoutDialog.current.close()}>{text("Hủy")}</button>
            <button type="submit" className="btn-primary">{text("Đăng xuất")}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
