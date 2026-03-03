import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   server: {
    port: 5174,
    strictPort: true,
    hmr: {
      port: 5174,
    },
     proxy: {
    "/api": "http://localhost:9000",
    "/socket.io": {
      target: "http://localhost:6000",
      ws: true,
    },
  },
  }
});
