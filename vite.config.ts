import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This is important for `stream` and other Node.js core modules
      stream: "stream-browserify",
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
    include: ["react-confetti"],
    esbuildOptions: {
      // Node.js global shims
      define: {
        global: "globalThis",
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
});
