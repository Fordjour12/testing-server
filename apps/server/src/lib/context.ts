import type { Context as HonoContext } from "hono";
import { auth } from "@testing-server/auth";

export type CreateContextOptions = {
   context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
    try {
       const session = await auth.api.getSession({
          headers: context.req.raw.headers,
       });
       return {
          session,
       };
    } catch (error) {
       console.error('Session creation error:', error);
       return {
          session: null,
       };
    }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
