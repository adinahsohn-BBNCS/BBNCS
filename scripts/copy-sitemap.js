// Post-build helpers for static hosting quirks
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");

const sitemapSource = join(dist, "sitemap-0.xml");
const sitemapTarget = join(dist, "sitemap.xml");
if (existsSync(sitemapSource)) {
  copyFileSync(sitemapSource, sitemapTarget);
  console.log("Created dist/sitemap.xml from sitemap-0.xml");
} else {
  console.warn("sitemap-0.xml not found — skipping sitemap.xml copy");
}

// Hosting often fails FTPS STOR on index.html (451 / empty file).
// Keep a home.html twin and prefer it via DirectoryIndex.
const indexHtml = join(dist, "index.html");
const homeHtml = join(dist, "home.html");
if (existsSync(indexHtml)) {
  copyFileSync(indexHtml, homeHtml);
  console.log("Created dist/home.html from index.html");
}
