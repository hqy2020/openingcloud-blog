export const SITE_ORIGIN = "https://blog.openingclouds.xyz";

export const LEGACY_SITE_HOSTS = new Set(["blog.oc.slgneon.cn"]);

export function siteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${SITE_ORIGIN}/`).toString();
}
