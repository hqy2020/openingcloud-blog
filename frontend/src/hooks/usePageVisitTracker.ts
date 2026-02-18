import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { apiClient } from "../api/client";

export function usePageVisitTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    apiClient
      .post("/visit/", { path, referrer: document.referrer })
      .catch(() => {});
  }, [location.pathname]);
}
