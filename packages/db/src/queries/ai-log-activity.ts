import { db } from "../index";
import { aiRequestLogs } from "../schema/ai-request-logs";

export async function insertAiRequestLog(responsePayload: any,) {

   const [newLog] = await db.insert(aiRequestLogs)
      .values({
         responsePayload,
      })
      .returning();

   return newLog;
}
