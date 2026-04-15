import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiTag,
  FiDollarSign,
  FiAlertTriangle,
  FiTruck,
  FiBarChart2,
  FiMenu,
  FiSun,
  FiMoon,
  FiChevronLeft,
} from "react-icons/fi";

const navItems = [
  { name: "Overview", path: "", icon: <FiHome /> },
  { name: "Documents", path: "documents", icon: <FiFileText /> },
  { name: "HSN", path: "hsn", icon: <FiTag /> },
  { name: "Duty", path: "duty", icon: <FiDollarSign /> },
  { name: "Risk", path: "risk", icon: <FiAlertTriangle /> },
  { name: "Shipments", path: "shipments", icon: <FiTruck /> },
  { name: "Analytics", path: "analytics", icon: <FiBarChart2 /> },
];

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);      // mobile sidebar
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  };

  return (
    <div className="flex h-screen">

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full ${
          collapsed ? "w-20" : "w-64"
        } bg-[var(--card)] border-r border-[var(--muted)] p-4 transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-all duration-300`}
      >
        {/* Top */}
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <h1 className="text-xl font-bold text-[var(--primary)]">
              I/E-AI
            </h1>
          )}

          {/* Collapse button (desktop) */}
          <button
            className="hidden md:block"
            onClick={() => setCollapsed(!collapsed)}
          >
            <FiChevronLeft />
          </button>
        </div>

        {/* Nav */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={`/dashboard/${item.path}`}
              end={item.path === ""}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded transition ${
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "hover:bg-[var(--muted)]"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && item.name}
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle (Desktop Sidebar) */}
        <div className="hidden md:flex mt-6">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 w-full bg-[var(--primary)] text-white rounded"
          >
            {dark ? <FiSun /> : <FiMoon />}
            {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--muted)] bg-[var(--card)]">
          
          {/* Mobile Menu */}
          <button
            className="md:hidden text-xl"
            onClick={() => setOpen(!open)}
          >
            <FiMenu />
          </button>

          <h2 className="font-semibold">Dashboard</h2>

          {/* Theme Toggle (Mobile) */}
          <button
            onClick={toggleTheme}
            className="md:hidden px-3 py-1 bg-[var(--primary)] text-white rounded"
          >
            {dark ? <FiSun /> : <FiMoon />}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-[var(--card)] p-6 rounded shadow min-h-[300px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}