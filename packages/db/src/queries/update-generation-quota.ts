import { db } from "../index";
import { eq } from "drizzle-orm";
import { generationQuota } from "../schema";

export async function updateGenerationQuota(quotaId: number, data: {
  totalAllowed?: number;
  generationsUsed?: number;
}) {
  const [quota] = await db
    .select()
    .from(generationQuota)
    .where(eq(generationQuota.id, quotaId))
    .limit(1);

  if (!quota) {
    throw new Error('Quota not found');
  }

  const [updatedQuota] = await db
    .update(generationQuota)
    .set(data)
    .where(eq(generationQuota.id, quotaId))
    .returning();

  return updatedQuota;
}