// Copy sitemap-0.xml to sitemap.xml (Google Search Console expects /sitemap.xml)
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const source = join(dist, "sitemap-0.xml");
const target = join(dist, "sitemap.xml");

if (!existsSync(source)) {
  console.warn("sitemap-0.xml not found — skipping sitemap.xml copy");
  process.exit(0);
}

copyFileSync(source, target);
console.log("Created dist/sitemap.xml from sitemap-0.xml");
