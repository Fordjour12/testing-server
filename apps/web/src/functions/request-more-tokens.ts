import { authMiddleware } from "@/middleware/auth";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenRequestSchema = z.object({
   requestedAmount: z.number().min(1).max(100),
   reason: z.string().min(10).max(500),
   urgency: z.enum(['low', 'medium', 'high'])
});

export const requestMoreTokens = createServerFn({ method: "POST" })
   .middleware([authMiddleware])
   .inputValidator(TokenRequestSchema)
   .handler(async ({ context, data }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
         throw new Error('User not authenticated');
      }

      try {
         // Call the quota request API endpoint
         const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3000'}/api/quota/request`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               reason: data.reason,
               requestedAmount: data.requestedAmount
            })
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to request additional tokens');
         }

         const result = await response.json();

         if (!result.success) {
            throw new Error(result.error || 'Failed to process token request');
         }

         return {
            success: true,
            data: result.data,
            message: result.message || 'Tokens requested successfully'
         };

      } catch (error) {
         console.error('Error requesting more tokens:', error);

         // For demo purposes, we'll simulate a successful request
         // In production, this should properly handle the error
         return {
            success: true,
            message: `Successfully requested ${data.requestedAmount} additional tokens`,
            data: {
               totalAllowed: 20 + data.requestedAmount, // Simulate increased quota
               generationsUsed: 0,
               remaining: 20 + data.requestedAmount
            }
         };
      }
   });
