import { readFile, writeFile } from "node:fs/promises";

const [jsonPath, mdPath] = process.argv.slice(2);

if (!jsonPath || !mdPath) {
  console.error("Usage: node lighthouse-report.mjs <input-json> <output-md>");
  process.exit(1);
}

const report = JSON.parse(await readFile(jsonPath, "utf8"));
const categories = report.categories ?? {};
const audits = report.audits ?? {};

const score = (key) => Math.round(((categories[key]?.score ?? 0) * 100));

const rows = [
  ["Performance", score("performance")],
  ["Accessibility", score("accessibility")],
  ["Best Practices", score("best-practices")],
  ["SEO", score("seo")],
];

const metric = (id, fallback = "-") => audits[id]?.displayValue ?? fallback;

const markdown = `# Lighthouse Mobile Report

- URL: ${report.finalDisplayedUrl}
- Generated: ${report.fetchTime}
- User Agent: ${report.userAgent}

## Category Scores

| Category | Score |
|---|---:|
${rows.map(([name, value]) => `| ${name} | ${value} |`).join("\n")}

## Core Metrics

| Metric | Value |
|---|---|
| First Contentful Paint | ${metric("first-contentful-paint")} |
| Largest Contentful Paint | ${metric("largest-contentful-paint")} |
| Total Blocking Time | ${metric("total-blocking-time")} |
| Cumulative Layout Shift | ${metric("cumulative-layout-shift")} |
| Speed Index | ${metric("speed-index")} |

## Acceptance

- Mobile Performance >= 75: ${score("performance") >= 75 ? "PASS" : "FAIL"}
`;

await writeFile(mdPath, markdown, "utf8");
