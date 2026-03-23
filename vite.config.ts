import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    allowedHosts: ["louise-situations-invited-enb.trycloudflare.com","www.one-qr.app","proud-pond-08bd04e00.1.azurestaticapps.net","scan-savor.vercel.app"],
    proxy: {
      '/api': {
        target: 'https://oneqrprod-dag2b3cmg0gsa7br.eastasia-01.azurewebsites.net',
        changeOrigin: true,
      },
    },

  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
