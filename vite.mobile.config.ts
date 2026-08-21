import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "mobile-entry",
  base: "./",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: "../exports/jason-portfolio-mobile",
    emptyOutDir: true,
  },
});
