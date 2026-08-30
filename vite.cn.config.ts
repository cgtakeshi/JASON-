import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "mobile-entry",
  base: "./",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../deploy/cn-build-stage",
    emptyOutDir: true,
  },
});
