/* QA-only transport: serve local fixtures over loopback for managed browsers
 * that prohibit file://. Never used by the production app. */
const fs = require("node:fs"),
  path = require("node:path");
if (process.env.PALETTE_QA_ORIGIN) {
  const { chromium } = require("playwright");
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async (options) => {
    const browser = await launch({
      ...options,
      executablePath: process.env.PALETTE_CHROMIUM_PATH || "/usr/bin/chromium",
    });
    const install = (context) =>
      context.on("page", (page) => {
        const go = page.goto.bind(page);
        page.goto = (url, opts) =>
          go(
            url.startsWith("file:")
              ? process.env.PALETTE_QA_ORIGIN +
                  new URL(url).pathname +
                  new URL(url).search +
                  new URL(url).hash
              : url,
            opts,
          );
      });
    browser.on("context", install);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (opts) => {
      const c = await newContext(opts);
      install(c);
      return c;
    };
    return browser;
  };
} else if (require.main === module) {
  const http = require("node:http"),
    { spawn } = require("node:child_process");
  const root = fs.realpathSync(path.resolve(__dirname, ".."));
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".png": "image/png",
  };
  const server = http.createServer((req, res) => {
    try {
      const file = fs.realpathSync(
        decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (
        !file.startsWith(root + path.sep) &&
        !(/^\/tmp\/(palette-|font-)/.test(file) && file.endsWith(".html"))
      ) {
        res.writeHead(403).end();
        return;
      }
      if (!fs.statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      fs.createReadStream(file).pipe(res);
    } catch (_) {
      res.writeHead(404).end();
    }
  });
  server.listen(0, "127.0.0.1", () => {
    const child = spawn(
      process.execPath,
      ["--require", __filename, ...process.argv.slice(2)],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          PALETTE_QA_ORIGIN: "http://127.0.0.1:" + server.address().port,
        },
      },
    );
    child.on("exit", (code) => {
      server.close();
      process.exitCode = code ?? 1;
    });
  });
}
