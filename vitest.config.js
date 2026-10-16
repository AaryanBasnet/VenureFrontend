import viteConfig from "./vite.config.js";

// Unit tests reuse the app's Vite config (plugins, resolution) and only add the test settings.
export default {
  ...viteConfig,
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
    setupFiles: ["./vitest.setup.js"],
    pool: "forks", // a real child process per file, so the host time zone really changes
  },
};
