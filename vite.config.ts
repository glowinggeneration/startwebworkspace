import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import type { Plugin } from "vite";

// Rolldown injects `createRequire(import.meta.url)` at module scope for its
// CommonJS interop. The Worker runtime leaves `import.meta.url` undefined, so
// that call throws before the app can render. Nothing in the bundle performs a
// real runtime require, so swap the shim for a stub in the server output.
function workerRequireShim(): Plugin {
  return {
    name: "worker-require-shim",
    apply: "build",
    enforce: "post",
    renderChunk(code) {
      if (!code.includes("createRequire(import.meta.url)")) return null;
      return {
        code: code.replace(
          /createRequire\(import\.meta\.url\)/g,
          'createRequire("file:///bundle/server.js")',
        ),
        map: null,
      };
    },
  };
}

export default defineConfig(({ command }) => ({
  // The generated browser client intentionally uses bracket access for these
  // public VITE values. Map that exact syntax so production builds receive the
  // same Lovable Cloud connection that development receives.
  define: {
    "import.meta.env['VITE_SUPABASE_URL']": JSON.stringify(process.env.VITE_SUPABASE_URL),
    "import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ),
  },
  // The Worker runtime has no module resolution: every dependency must be
  // bundled into the server output instead of left as a bare import. In dev the
  // module runner resolves from node_modules, and inlining CommonJS packages
  // there breaks SSR, so this applies to the production build only.
  ssr: command === "build" ? { noExternal: true } : {},
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    workerRequireShim(),
  ],
}));
