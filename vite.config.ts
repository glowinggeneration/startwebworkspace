import path from "node:path";
import { defineConfig, loadEnv } from "vite";
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

// Hosted builds run without the local .env file, so the browser bundle can end
// up with no connection values at all. Vite only exposes VITE_-prefixed
// variables to the client, so mirror the managed values (and fall back to the
// public project URL and publishable key, both safe to ship) before the config
// resolves. The generated client reads import.meta.env with bracket access,
// which Vite serialises correctly once the variables exist at build time.
const PUBLIC_SUPABASE_URL = "https://gvtkjpbxwrjazlvibuaa.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0KE5bTaSTzSUK1xohkxtMQ_476KmWRk";

process.env["VITE_SUPABASE_URL"] =
  process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || PUBLIC_SUPABASE_URL;
process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  process.env["SUPABASE_PUBLISHABLE_KEY"] ||
  PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default defineConfig(({ command, mode }) => {
  // Server routes (email webhooks) read non VITE_ variables from process.env.
  // Only server code sees these; nothing here is added to the client define.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    // The Worker runtime has no module resolution: every dependency must be
    // bundled into the server output instead of left as a bare import. In dev the
    // module runner resolves from node_modules, and inlining CommonJS packages
    // there breaks SSR, so this applies to the production build only.
    ssr: command === "build" ? { noExternal: true } : {},
    // React Email's parser needs entities v4.5.0; a nested newer copy breaks SSR.
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
    plugins: [
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart({
        server: { entry: "server" },
      }),
      viteReact(),
      workerRequireShim(),
    ],
  };
});
