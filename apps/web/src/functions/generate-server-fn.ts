import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { currentApiBaseUrl } from '@/lib/api-utils'
import { authMiddleware } from '@/middleware/auth'

// Types matching the backend schema
export type Priority = 'High' | 'Medium' | 'Low'
export type Complexity = 'Simple' | 'Balanced' | 'Ambitious'
export type WeekendFocus = 'Work' | 'Rest' | 'Mixed'

export interface GeneratePlanFormData {
   userId: string
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

export interface PlanTask {
   id: string
   title: string
   description?: string
   dueDate: string
   priority: Priority
   category: string
   estimatedHours?: number
}

export interface MonthlyPlan {
   id: string
   title: string
   month: string
   goals: string[]
   tasks: PlanTask[]
   totalTasks: number
   estimatedHours: number
   successRate?: number
}

export const GeneratePlanFormDataSchema = z.object({
   userId: z.string(),
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


// Server function for generating plans using the /api/plan/inputs endpoint
export const generatePlanServerFn = createServerFn({ method: 'POST' })
   .middleware([authMiddleware])
   .inputValidator(GeneratePlanFormDataSchema)
   .handler(async ({ data }) => {

      console.log("data user sent data", data)

      // Fetch the generated plan details using the /api/plan/inputs endpoint
      const planResponse = await fetch(`${currentApiBaseUrl}/api/plan/inputs`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(data)
      })

      if (!planResponse.ok) {
         const errorData = await planResponse.json()
         throw new Error(errorData.error || 'Failed to generate plan')
      }

      const planResult = await planResponse.json()

      if (!planResult.success || !planResult.data) {
         throw new Error('No plan data available')
      }

      return planResult.data as MonthlyPlan
   })
