import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { currentApiBaseUrl } from '@/lib/api-utils'
import { authMiddleware } from '@/middleware/auth'
import type { AIResponseWithMetadata, MonthlyPlan } from '@testing-server/response-parser'

// Types matching the backend schema
export type Priority = 'High' | 'Medium' | 'Low'
export type Complexity = 'Simple' | 'Balanced' | 'Ambitious'
export type WeekendFocus = 'Work' | 'Rest' | 'Mixed'

export interface GeneratePlanFormData {
   goalsText: string
   taskComplexity: Complexity
   focusAreas: string
   weekendPreference: WeekendFocus
   fixedCommitmentsJson: {
      commitments: Array<{
         dayOfWeek: string
         startTime: string
         endTime: string
         description: string
      }>
   }
}

export interface GeneratePlanResponse {
   aiResponse: AIResponseWithMetadata
   monthlyPlan: MonthlyPlan
   monthYear: string
   preferenceId: number
}

// Re-export types from response-parser for convenience
export type { PlanTask, MonthlyPlan, AIResponseWithMetadata } from '@testing-server/response-parser'

export const GeneratePlanFormDataSchema = z.object({
   goalsText: z.string().min(1, 'Goals are required'),
   taskComplexity: z.enum(['Simple', 'Balanced', 'Ambitious']),
   focusAreas: z.string().min(1, 'Focus areas are required'),
   weekendPreference: z.enum(['Work', 'Rest', 'Mixed']),
   fixedCommitmentsJson: z.object({
      commitments: z.array(z.object({
         dayOfWeek: z.string(),
         startTime: z.string(),
         endTime: z.string(),
         description: z.string()
      }))
   })
})

// Server function for generating plans using HTTP with proper auth
export const generatePlanServerFn = createServerFn({ method: 'POST' })
   .middleware([authMiddleware])
   .inputValidator(GeneratePlanFormDataSchema)
   .handler(async ({ data, context }) => {
      console.log("data user sent data", data)
      console.log("Session context from middleware:", context.session)

      if (!context.session?.user?.id) {
         throw new Error('Authentication required')
      }

      const userId = context.session.user.id
      console.log("User ID from session:", userId)

      // Make HTTP call with custom user ID header for server-to-server auth
      try {
         const headers: HeadersInit = {
            'Content-Type': 'application/json',
         };

         // Add authorization header with session token
         if (context.session?.session?.token) {
            headers['Authorization'] = `Bearer ${context.session.session.token}`;
         }

         // Add custom header with user ID for server-to-server calls
         headers['X-User-ID'] = userId;

         const planResponse = await fetch(`${currentApiBaseUrl}/api/plan/inputs`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            credentials: 'include',
         })

         const responseText = await planResponse.text()
         console.log('Raw response:', responseText)
         console.log('Response status:', planResponse.status)

         if (!planResponse.ok) {
            let errorData
            try {
               errorData = JSON.parse(responseText)
            } catch {
               errorData = { error: responseText }
            }
            console.error('Server error response:', errorData)
            throw new Error(JSON.stringify(errorData) || 'Failed to generate plan')
         }

         const planResult = JSON.parse(responseText)

         if (!planResult.success || !planResult.data) {
            throw new Error('No plan data available')
         }

         return planResult.data as GeneratePlanResponse
      } catch (error) {
         console.error('Fetch error:', error)
         throw error
      }
   })