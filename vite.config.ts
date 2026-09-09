import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Vanilla TanStack Start setup (no @lovable.dev/vite-tanstack-config preset —
// that package only exists inside Lovable projects). Each plugin below is
// something that preset would otherwise supply implicitly.
export default defineConfig({
  // The Worker runtime has no module resolution: every dependency must be
  // bundled into the server output instead of left as a bare import.
  ssr: { noExternal: true },
  environments: {
    ssr: {
      resolve: {
        alias: {
          // Rolldown's CommonJS interop shim calls createRequire(import.meta.url)
          // at module scope, which throws in the Worker runtime.
          "node:module": new URL("./src/lib/worker/node-module-shim.ts", import.meta.url).pathname,
        },
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});
