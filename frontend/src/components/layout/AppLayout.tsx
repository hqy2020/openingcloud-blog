import { motion } from "motion/react";
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
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <NavLink className="text-2xl font-semibold tracking-wide text-[#4F6AE5]" to="/">
            opening<span className="text-slate-900">Clouds</span>
          </NavLink>

          <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/70 p-1 text-sm font-medium text-slate-700">
            {links.map((item) => (
              <NavLink
                key={item.to}
                className="rounded-full transition"
                to={item.to}
              >
                {({ isActive }) => (
                  <span className="relative block px-3 py-1.5">
                    {isActive ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-white shadow-sm"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    ) : null}
                    <span className={`relative ${isActive ? "text-[#4F6AE5]" : "text-slate-600 hover:text-slate-900"}`}>{item.label}</span>
                  </span>
                )}
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
