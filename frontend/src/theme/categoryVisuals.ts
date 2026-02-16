export type CategoryVisualKey = "tech" | "learning" | "life";

export type CategoryVisualTone = {
  accentHex: string;
  glowRgb: string;
  headerTintLight: string;
  headerTintDark: string;
};

export const categoryVisuals: Record<CategoryVisualKey, CategoryVisualTone> = {
  tech: {
    accentHex: "#6B917B",
    glowRgb: "107, 145, 123",
    headerTintLight:
      "linear-gradient(130deg, rgba(107,145,123,0.34), rgba(79,106,229,0.16) 44%, rgba(255,255,255,0.7))",
    headerTintDark:
      "linear-gradient(130deg, rgba(107,145,123,0.34), rgba(30,41,59,0.36) 44%, rgba(15,23,42,0.72))",
  },
  learning: {
    accentHex: "#B8945E",
    glowRgb: "184, 148, 94",
    headerTintLight:
      "linear-gradient(130deg, rgba(184,148,94,0.36), rgba(214,189,139,0.2) 44%, rgba(255,255,255,0.68))",
    headerTintDark:
      "linear-gradient(130deg, rgba(184,148,94,0.34), rgba(30,41,59,0.36) 44%, rgba(15,23,42,0.72))",
  },
  life: {
    accentHex: "#9684A8",
    glowRgb: "150, 132, 168",
    headerTintLight:
      "linear-gradient(130deg, rgba(150,132,168,0.36), rgba(194,182,207,0.22) 44%, rgba(255,255,255,0.72))",
    headerTintDark:
      "linear-gradient(130deg, rgba(150,132,168,0.34), rgba(30,41,59,0.36) 44%, rgba(15,23,42,0.72))",
  },
};

const defaultVisual: CategoryVisualTone = {
  accentHex: "#4F6AE5",
  glowRgb: "79, 106, 229",
  headerTintLight:
    "linear-gradient(130deg, rgba(79,106,229,0.3), rgba(170,190,255,0.2) 46%, rgba(255,255,255,0.72))",
  headerTintDark:
    "linear-gradient(130deg, rgba(79,106,229,0.3), rgba(30,41,59,0.36) 46%, rgba(15,23,42,0.72))",
};

export function resolveAccentByPath(pathname: string): CategoryVisualTone {
  if (pathname.startsWith("/tech")) {
    return categoryVisuals.tech;
  }
  if (pathname.startsWith("/learning")) {
    return categoryVisuals.learning;
  }
  if (pathname.startsWith("/life")) {
    return categoryVisuals.life;
  }
  return defaultVisual;
}
