const BUILD_ID_KEY = "sw-build-id";
const BUILD_ID = (import.meta.env.VITE_BUILD_ID as string | undefined) ?? __BUILD_ID__;

async function nukeAllCaches(): Promise<void> {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
}

async function purgeIfBuildChanged(): Promise<boolean> {
  try {
    const prev = localStorage.getItem(BUILD_ID_KEY);
    if (prev && prev !== BUILD_ID) {
      await nukeAllCaches();
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      localStorage.setItem(BUILD_ID_KEY, BUILD_ID);
      return true;
    }
    localStorage.setItem(BUILD_ID_KEY, BUILD_ID);
  } catch {
    // storage unavailable — ignore
  }
  return false;
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  void purgeIfBuildChanged().then((purged) => {
    if (purged) {
      window.location.reload();
      return;
    }

    void import("virtual:pwa-register")
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() {
            void updateSW(true);
          },
          onRegisteredSW(_url, registration) {
            if (!registration) return;
            setInterval(
              () => {
                void registration.update();
              },
              10 * 60 * 1000,
            );
          },
        });
      })
      .catch(() => {
        // SW registration is a non-critical enhancement
      });
  });
}
