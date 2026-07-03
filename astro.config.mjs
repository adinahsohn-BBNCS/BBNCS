import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://bbncs.com",
  server: {
    port: 4322,
  },
  preview: {
    port: 4322,
  },
});
