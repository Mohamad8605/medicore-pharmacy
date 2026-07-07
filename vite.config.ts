import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";
import { Generator } from "@tanstack/router-generator";
import fs from "node:fs";

const tanstackOptimizerFix: Plugin = {
  name: "tanstack-optimizer-fix",
  configEnvironment() {
    return {
      optimizeDeps: {
        exclude: ["@tanstack/start-server-core"],
        esbuildOptions: {
          plugins: [
            {
              name: "tanstack-virtual-externals",
              setup(build) {
                build.onResolve({ filter: /^#tanstack-/ }, (args) => ({
                  path: args.path,
                  external: true,
                }));
                build.onResolve({ filter: /^tanstack-start-manifest:/ }, (args) => ({
                  path: args.path,
                  external: true,
                }));
              },
            },
          ],
        },
      },
    };
  },
};

/**
 * Intercepts the router-generator's `safeFileWrite` so that EPERM errors
 * during `fs.rename` (caused by Windows Defender locking `routeTree.gen.ts`)
 * fall back to copyFile+unlink instead of crashing or spamming the console.
 */
/** Retry delay helper. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function patchGeneratorFsRename() {
  if (process.platform !== "win32") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = Generator.prototype as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proto.safeFileWrite = async function patchedSafeFileWrite(this: any, opts: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const tmpPath = self.getTempFileName(opts.filePath);
    await self.fs.writeFile(tmpPath, opts.newContent);

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        await self.fs.rename(tmpPath, opts.filePath);
        return await self.fs.stat(opts.filePath);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e?.code === "EPERM" || e?.code === "EBUSY") {
          if (attempt < 3) {
            await sleep(400 * (attempt + 1));
            continue;
          }
          try {
            fs.writeFileSync(opts.filePath, opts.newContent, "utf-8");
            try {
              fs.unlinkSync(tmpPath);
            } catch {
              /* Windows may still have the file locked */
            }
            return await self.fs.stat(opts.filePath);
          } catch {
            /* fallback rename also failed, retry from scratch */
          }
          if (attempt < 9) {
            await sleep(800);
            continue;
          }
        }
        throw e;
      }
    }
  };
}

const windowsRouterFix: Plugin = {
  name: "windows-router-fix",
  enforce: "pre",
  config() {
    patchGeneratorFsRename();
  },
};

export default defineConfig({
  plugins: [
    windowsRouterFix,
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tanstackRouter({
      autoCodeSplitting: false,
      plugin: { vite: { environmentName: "client" } },
      codeSplittingOptions: { addHmr: false },
    }),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackOptimizerFix,
    cloudflare(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: {
    host: "::",
    port: 8080,
    open: true,
    watch: {
      ignored: ["**/src/routeTree.gen.ts", "**/.tanstack/**"],
    },
  },
});
