import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://bbncs.com",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/admin/"),
    }),
  ],
  server: {
    port: 4322,
  },
  preview: {
    port: 4322,
  },
});
