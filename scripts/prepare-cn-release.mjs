import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stageDir = path.join(projectRoot, "deploy", "cn-build-stage");
const releaseDir = path.join(projectRoot, "deploy", "cn-release");
const wwwDir = path.join(releaseDir, "www");
const ossDir = path.join(releaseDir, "oss");

const requiredStageFiles = ["index.html", "assets", "site-config.js"];
for (const relativePath of requiredStageFiles) {
  await stat(path.join(stageDir, relativePath));
}

await rm(releaseDir, { recursive: true, force: true });
await mkdir(wwwDir, { recursive: true });
await mkdir(ossDir, { recursive: true });

await cp(path.join(stageDir, "index.html"), path.join(wwwDir, "index.html"));
await cp(path.join(stageDir, "assets"), path.join(wwwDir, "assets"), { recursive: true });

const runtimeConfig = `window.__PORTFOLIO_CONFIG__ = {\n  assetBase: "https://static.jasongame.com/oss",\n};\n`;
await writeFile(path.join(wwwDir, "site-config.js"), runtimeConfig, "utf8");

const excludedRootEntries = new Set(["index.html", "assets", "site-config.js", "_headers", "_redirects"]);
for (const entry of await readdir(stageDir, { withFileTypes: true })) {
  if (excludedRootEntries.has(entry.name)) continue;
  await cp(path.join(stageDir, entry.name), path.join(ossDir, entry.name), { recursive: entry.isDirectory() });
}

const nginxConfig = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/jason-portfolio/www;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /media/ {
        alias /var/www/jason-portfolio/oss/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        access_log off;
    }

    location = /site-config.js {
        expires -1;
        add_header Cache-Control "no-store";
    }

    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
`;
await writeFile(path.join(releaseDir, "nginx-jason-portfolio.conf"), nginxConfig, "utf8");

const ossConfigExample = `window.__PORTFOLIO_CONFIG__ = {\n  assetBase: "https://static.example.com",\n};\n`;
await writeFile(path.join(releaseDir, "site-config.oss.example.js"), ossConfigExample, "utf8");

const manifest = JSON.parse(await readFile(path.join(projectRoot, "app", "portfolio-manifest.json"), "utf8"));
const releaseInfo = {
  generatedAt: new Date().toISOString(),
  layout: {
    www: "Upload to /var/www/jason-portfolio/www on ECS",
    oss: "Upload to /var/www/jason-portfolio/oss initially, or to an OSS Bucket later",
  },
  portfolioItems: manifest.filter((item) => !item.cover).length,
  portfolioVideos: manifest.filter((item) => !item.cover && item.media === "video").length,
  assetBase: "https://static.jasongame.com/oss",
};
await writeFile(path.join(releaseDir, "release-info.json"), `${JSON.stringify(releaseInfo, null, 2)}\n`, "utf8");
await cp(path.join(projectRoot, "deploy", "cn-release-guide.md"), path.join(releaseDir, "README-国内部署说明.md"));
await rm(stageDir, { recursive: true, force: true });
