import { NavLink, Outlet } from "react-router-dom";
import { BlogPetMachine } from "../pet/BlogPetMachine";

const links = [
  { to: "/", label: "首页" },
  { to: "/tech", label: "技术" },
  { to: "/learning", label: "效率" },
  { to: "/life", label: "生活" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <NavLink className="text-2xl font-semibold tracking-wide text-indigo-700" to="/">
            openingClouds
          </NavLink>

          <nav className="flex items-center gap-2 rounded-full bg-slate-100/80 p-1 text-sm font-medium text-slate-700">
            {links.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-1.5 transition",
                    isActive ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900",
                  ].join(" ")
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto mt-12 w-full max-w-6xl px-4 pb-10 text-sm text-slate-500">
        © {new Date().getFullYear()} openingClouds
      </footer>
      <BlogPetMachine />
    </div>
  );
}
