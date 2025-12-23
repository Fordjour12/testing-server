import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@testing-server/db";
import * as schema from "@testing-server/db/schema/auth";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:5173"],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
		},
	},
});
