import { Suspense, lazy } from "react";
import type { ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";

const HomePage = lazy(async () => {
  const mod = await import("../pages/HomePage");
  return { default: mod.HomePage };
});
const CategoryPage = lazy(async () => {
  const mod = await import("../pages/CategoryPage");
  return { default: mod.CategoryPage };
});
const PostDetailPage = lazy(async () => {
  const mod = await import("../pages/PostDetailPage");
  return { default: mod.PostDetailPage };
});
const NotFoundPage = lazy(async () => {
  const mod = await import("../pages/NotFoundPage");
  return { default: mod.NotFoundPage };
});

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<p className="text-sm text-slate-500">页面加载中...</p>}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "tech", element: withSuspense(<CategoryPage category="tech" title="技术" />) },
      { path: "learning", element: withSuspense(<CategoryPage category="learning" title="效率" />) },
      { path: "life", element: withSuspense(<CategoryPage category="life" title="生活" />) },
      { path: "posts/:slug", element: withSuspense(<PostDetailPage />) },
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
