import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import profileRoutes from "./routes/profile.js";
import socialRoutes from "./routes/social.js";
import { getDb } from "./db/init.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono();

// Initialize database on startup (no need to await — routes will await getDb())
getDb();

export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const WEB_DIR = process.env.WEB_DIR
  ? process.env.WEB_DIR
  : join(__dirname, "../h5");

app.use("/*", cors());
app.route("/api", profileRoutes);
app.route("/api", socialRoutes);

// Static file serving for H5 frontend
app.get("/q/:token", (c) => {
  const html = readFileSync(join(WEB_DIR, "index.html"), "utf-8");
  return c.html(html);
});

app.get("/", (c) => {
  const html = readFileSync(join(WEB_DIR, "landing.html"), "utf-8");
  return c.html(html);
});

app.get("/admin", (c) => {
  const html = readFileSync(join(WEB_DIR, "admin.html"), "utf-8");
  return c.html(html);
});

app.get("/style.css", (c) => {
  const css = readFileSync(join(WEB_DIR, "style.css"), "utf-8");
  return c.text(css, 200, { "Content-Type": "text/css" });
});

app.get("/app.js", (c) => {
  const js = readFileSync(join(WEB_DIR, "app.js"), "utf-8");
  return c.text(js, 200, { "Content-Type": "application/javascript" });
});

app.get("/discover.html", (c) => {
  const html = readFileSync(join(WEB_DIR, "discover.html"), "utf-8");
  return c.html(html);
});

app.get("/health", (c) => c.json({ status: "ok" }));

if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port: 3000 }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  });
}

export default app;
