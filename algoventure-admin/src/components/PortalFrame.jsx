import { useId, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import BrandMark from "./BrandMark";
import "./PortalFrame.css";

export default function PortalFrame({ user, logout, navItems, roleLabel, className = "", children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigationId = useId();
  const menuButton = useRef(null);
  const initials = user.name?.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("");
  return (
    <div className={`portal-frame ${className}`}>
      <header className="portal-masthead">
        <div className="portal-masthead-inner">
          <Link to={navItems[0].path} className="portal-wordmark" aria-label="AlgoVenture — Trang chủ">
            <BrandMark className="portal-mark" /><span>AlgoVenture</span>
          </Link>
          <span className="portal-role">{roleLabel}</span>
          <div className="portal-account">
            <span className="portal-avatar" aria-hidden="true">{initials}</span>
            <span className="portal-account-name">{user.name}</span>
            <button className="portal-icon-button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={17} /></button>
          </div>
          <button ref={menuButton} className="portal-menu-button portal-icon-button" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} aria-controls={navigationId} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
      <div className={`portal-navigation${menuOpen ? " is-open" : ""}`}>
        <nav id={navigationId} aria-label="Điều hướng chính" className="portal-navigation-inner" onKeyDown={(event) => {
          if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
        }}>
          {navItems.map((item) => <NavLink key={item.path} to={item.path} end={item.path === "/admin"} onClick={() => setMenuOpen(false)} className={({ isActive }) => `portal-nav-link${isActive ? " is-active" : ""}`}>
            {item.icon}<span>{item.name}</span>
          </NavLink>)}
        </nav>
      </div>
      <main id="main-content" className="portal-content">{children}</main>
    </div>
  );
}
