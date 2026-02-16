import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");

const routes = [
  {
    route: "/",
    title: "启云博客",
    description: "在云层之上，记录技术、效率与生活。",
    marker: "启云博客",
    canonical: "https://blog.oc.slgneon.cn/",
  },
  {
    route: "/tech",
    title: "技术 | 启云博客",
    description: "技术实践、系统设计与工程复盘。",
    marker: "技术",
    canonical: "https://blog.oc.slgneon.cn/tech",
  },
  {
    route: "/learning",
    title: "效率 | 启云博客",
    description: "效率系统、学习方法和个人生产力。",
    marker: "效率",
    canonical: "https://blog.oc.slgneon.cn/learning",
  },
  {
    route: "/life",
    title: "生活 | 启云博客",
    description: "旅行、日常观察与生活记录。",
    marker: "生活",
    canonical: "https://blog.oc.slgneon.cn/life",
  },
];

function applyMeta(template, payload) {
  const titleApplied = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${payload.title}</title>`);
  const headInjection = [
    `<meta name="description" content="${payload.description}" />`,
    `<link rel="canonical" href="${payload.canonical}" />`,
    `<meta property="og:title" content="${payload.title}" />`,
    `<meta property="og:description" content="${payload.description}" />`,
    `<meta property="og:image" content="/og-cloudscape-card.png" />`,
  ].join("\n    ");

  const withHead = titleApplied.replace("</head>", `    ${headInjection}\n  </head>`);
  return withHead.replace(
    "</body>",
    `    <noscript data-prerender-route="${payload.route}">${payload.marker}</noscript>\n  </body>`,
  );
}

const indexPath = path.join(distDir, "index.html");
const template = await readFile(indexPath, "utf8");

for (const route of routes) {
  const html = applyMeta(template, route);
  if (route.route === "/") {
    await writeFile(indexPath, html, "utf8");
    continue;
  }

  const routeDir = path.join(distDir, route.route.slice(1));
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), html, "utf8");
}

console.log(`[prerender-routes] generated ${routes.length} routes`);
