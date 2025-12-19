import { currentApiBaseUrl } from "@/lib/api-utils";
import { authMiddleware } from "@/middleware/auth";
import { createServerFn } from "@tanstack/react-start";

export interface TokenQuotaResponse {
   totalAllowed: number;
   generationsUsed: number;
   remaining: number;
   usagePercentage: number;
   resetsOn: string;
   daysUntilReset: number;
   status: 'active' | 'low' | 'exceeded';
}

export const getTokenQuota = createServerFn({ method: "GET" })
   .middleware([authMiddleware])
   .handler(async ({ context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
         throw new Error('User not authenticated');
      }

      try {
         // Get current month for quota lookup
         const now = new Date();
         const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

         // Call the quota API endpoint
         const response = await fetch(`${currentApiBaseUrl}/}/api/quota/current`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
               'X-User-ID': String(userId),
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch quota information');
         }

         const result = await response.json();

         if (!result.success) {
            throw new Error(result.error || 'Failed to fetch quota');
         }

         const quota = result.data;
         const totalAllowed = quota.totalAllowed; // Default to 20 if not set
         const generationsUsed = quota.generationsUsed;
         const remaining = Math.max(0, totalAllowed - generationsUsed);
         const usagePercentage = totalAllowed > 0 ? (generationsUsed / totalAllowed) * 100 : 0;

         // Calculate days until reset
         const resetDate = new Date(quota.resetsOn);
         const today = new Date();
         const daysUntilReset = Math.ceil((resetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

         // Determine status
         let status: 'active' | 'low' | 'exceeded' = 'active';
         if (usagePercentage >= 100) {
            status = 'exceeded';
         } else if (usagePercentage >= 80) {
            status = 'low';
         }

         return {
            totalAllowed,
            generationsUsed,
            remaining,
            usagePercentage: Math.round(usagePercentage),
            resetsOn: quota.resetsOn,
            daysUntilReset: Math.max(0, daysUntilReset),
            status,
         } as TokenQuotaResponse;

      } catch (error) {
         console.error('Error fetching token quota:', error);

         // Return default quota on error
         const defaultQuota = 60;
         return {
            totalAllowed: defaultQuota,
            generationsUsed: 0,
            remaining: defaultQuota,
            usagePercentage: 0,
            resetsOn: getNextMonth(),
            daysUntilReset: getDaysUntilNextMonth(),
            status: 'active' as const,
         } as TokenQuotaResponse;
      }
   });

// Helper functions
function getNextMonth(): string {
   const now = new Date();
   const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
   return nextMonth.toISOString().split('T')[0];
}

function getDaysUntilNextMonth(): number {
   const now = new Date();
   const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
   return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
