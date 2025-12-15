import "dotenv/config";
import { auth } from "@testing-server/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { planRouter, servicesRouter, streamingRouter, mockRouter } from "./router";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// API Routes
app.route("/api/plan", planRouter);
app.route("/service", servicesRouter);
app.route("/api/streaming", streamingRouter);
app.route("/api/mock", mockRouter);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
