import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// Opens the connection to the API host while the scripts are still downloading. `use-credentials` matters: the app
// calls the API with cookies, and the browser keeps credentialed and anonymous connections apart.
const preconnectApi = (env) => {
  const origin = (() => {
    try {
      return new URL(env.VITE_BACKEND_URL || env.VITE_API_BASE_URL).origin;
    } catch {
      return null;
    }
  })();
  return {
    name: "preconnect-api",
    transformIndexHtml: () => (origin ? [{ tag: "link", attrs: { rel: "preconnect", href: origin, crossorigin: "use-credentials" }, injectTo: "head-prepend" }] : []),
  };
};

// Design tokens live in src/styles/theme.css (Tailwind v4 @theme), not here.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), preconnectApi(loadEnv(mode, process.cwd(), "VITE_"))],
  // Vite doesn't read PORT itself — honor it when set (e.g. by the dev harness)
  // so a fixed port isn't required; backend CORS already allows any localhost port in dev.
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          animations: ["framer-motion"],
          query: ["@tanstack/react-query"],
          icons: ["lucide-react", "react-icons"],
        },
      },
    },
  },
}));
