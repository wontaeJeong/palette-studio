import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
await build({
  entryPoints: [path.join(root, "src/studio/main.tsx")],
  outfile: path.join(root, "assets/studio.js"),
  bundle: true,
  format: "iife",
  target: "es2020",
  // Emit embedded library CSS as escaped strings, avoiding whitespace-only
  // lines inside generated template literals without modifying CSS content.
  supported: { "template-literal": false },
  minify: true,
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    react: path.join(root, "node_modules/react"),
    "react-dom": path.join(root, "node_modules/react-dom"),
  },
});
await writeFile(
  path.join(root, "index.html"),
  await readFile(path.join(root, "src/studio/shell.html")),
);
console.log("Built classic React studio and index.html");
