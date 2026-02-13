import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { CategoryPage } from "../pages/CategoryPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PostDetailPage } from "../pages/PostDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "tech", element: <CategoryPage category="tech" title="技术" /> },
      { path: "learning", element: <CategoryPage category="learning" title="效率" /> },
      { path: "life", element: <CategoryPage category="life" title="生活" /> },
      { path: "posts/:slug", element: <PostDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
