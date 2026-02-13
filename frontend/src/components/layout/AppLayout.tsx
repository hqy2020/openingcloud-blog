import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "首页" },
  { to: "/tech", label: "技术" },
  { to: "/learning", label: "效率" },
  { to: "/life", label: "生活" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <NavLink className="text-xl font-semibold tracking-wide text-indigo-700" to="/">
            openingClouds
          </NavLink>
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-700">
            {links.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  isActive ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
