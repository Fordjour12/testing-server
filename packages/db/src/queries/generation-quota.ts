import { db } from "../index";
import { eq, and } from "drizzle-orm";
import { generationQuota } from "../schema";

export async function getCurrentQuota(userId: string, monthYear: string) {
  const [quota] = await db
    .select()
    .from(generationQuota)
    .where(
      and(
        eq(generationQuota.userId, userId),
        eq(generationQuota.monthYear, monthYear)
      )
    )
    .limit(1);
  return quota;
}

export async function decrementGenerationQuota(quotaId: number) {
  const [quota] = await db
    .select()
    .from(generationQuota)
    .where(eq(generationQuota.id, quotaId))
    .limit(1);

  if (!quota) {
    throw new Error('Quota not found');
  }

  if (quota.generationsUsed >= quota.totalAllowed) {
    throw new Error('Generation quota exceeded');
  }

  const [updatedQuota] = await db
    .update(generationQuota)
    .set({ generationsUsed: quota.generationsUsed + 1 })
    .where(eq(generationQuota.id, quotaId))
    .returning();

  return updatedQuota;
}

export async function incrementGenerationQuota(quotaId: number) {
  const [quota] = await db
    .select()
    .from(generationQuota)
    .where(eq(generationQuota.id, quotaId))
    .limit(1);

  if (!quota) {
    throw new Error('Quota not found');
  }

  if (quota.generationsUsed <= 0) {
    throw new Error('Cannot increment quota below 0');
  }

  const [updatedQuota] = await db
    .update(generationQuota)
    .set({ generationsUsed: quota.generationsUsed - 1 })
    .where(eq(generationQuota.id, quotaId))
    .returning();

  return updatedQuota;
}

export async function createGenerationQuota(data: {
  userId: string;
  monthYear: string;
  totalAllowed: number;
  generationsUsed?: number;
  resetsOn: string;
}) {
  const [newQuota] = await db.insert(generationQuota)
    .values({
      generationsUsed: 0,
      ...data
    })
    .returning();
  return newQuota;
}