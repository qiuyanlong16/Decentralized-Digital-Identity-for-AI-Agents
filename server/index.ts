import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import profileRoutes from "./routes/profile.js";
import socialRoutes from "./routes/social.js";
import { getDb } from "./db/init.js";

const app = new Hono();

// Initialize database on startup (no need to await — routes will await getDb())
getDb();

app.use("/*", cors());
app.route("/api", profileRoutes);
app.route("/api", socialRoutes);
app.get("/health", (c) => c.json({ status: "ok" }));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

export default app;
