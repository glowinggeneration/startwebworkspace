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
        code: code
          .replace(
            /import\s*\{\s*createRequire\s*\}\s*from\s*"node:module";?/g,
            'const createRequire = () => { const r = (id) => { throw new Error("Runtime require(" + id + ") is not supported in this server runtime."); }; r.resolve = r; r.cache = {}; r.extensions = {}; return r; };',
          )
          .replace(/createRequire\(import\.meta\.url\)/g, "createRequire()"),
        map: null,
      };
    },
  };
}

// Vanilla TanStack Start setup (no @lovable.dev/vite-tanstack-config preset —
// that package only exists inside Lovable projects). Each plugin below is
// something that preset would otherwise supply implicitly.
export default defineConfig({
  // The Worker runtime has no module resolution: every dependency must be
  // bundled into the server output instead of left as a bare import.
  ssr: { noExternal: true },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    workerRequireShim(),
  ],
});
