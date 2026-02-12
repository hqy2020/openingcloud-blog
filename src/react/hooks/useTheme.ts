import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const next = html.classList.contains('dark');
    localStorage.theme = next ? 'dark' : 'light';
    setIsDark(next);
  }, []);

  return { isDark, toggle };
}
