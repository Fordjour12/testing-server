import "dotenv/config";
import { auth } from "@testing-server/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { planRouter, servicesRouter, streamingRouter, mockRouter, quotaRouter } from "./router";
import { createContext, type Context } from "./lib/context";


export type Variables = {
   session: Context["session"]
}

const app = new Hono<{ Variables: Variables }>();

app.use(logger());
app.use(
   "/*",
   cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
   }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use("/*", async (c, next) => {
   const context = await createContext({ context: c })
   c.set("session", context.session)
   await next()
})

// API Routes
app.route("/api/plan", planRouter);
app.route("/service", servicesRouter);
app.route("/api/streaming", streamingRouter);
app.route("/api/mock", mockRouter);
app.route("/api/quota", quotaRouter);

app.get("/", (c) => {
   return c.text("OK");
});

export default {
   port: 3001,
   fetch: app.fetch,
}
