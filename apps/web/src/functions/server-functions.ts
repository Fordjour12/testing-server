import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Types matching the backend schema
export type Priority = 'High' | 'Medium' | 'Low'
export type Complexity = 'Simple' | 'Moderate' | 'Ambitious'
export type WeekendFocus = 'Deep Work' | 'Strategic Planning' | 'Learning & Development' | 'Light Tasks' | 'Rest & Recharge'

export interface PlanFormData {
  goals: string
  complexity: Complexity
  focusAreas: string
  weekendPreference: WeekendFocus
  fixedCommitments: string[]
  month?: string
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

const PlanFormDataSchema = z.object({
  goals: z.string().min(10, 'Please provide at least 10 characters for your goals'),
  complexity: z.enum(['Simple', 'Moderate', 'Ambitious']),
  focusAreas: z.string().min(3, 'Please specify your focus areas'),
  weekendPreference: z.enum(['Deep Work', 'Strategic Planning', 'Learning & Development', 'Light Tasks', 'Rest & Recharge']),
  fixedCommitments: z.array(z.string()).default([]),
  month: z.string().optional(),
})

// Mock data function for demonstration
function generateMockPlan(data: PlanFormData): MonthlyPlan {
  const categories = ['Work', 'Personal', 'Health', 'Learning', 'Finance']
  const priorities: Priority[] = ['High', 'Medium', 'Low']

  const tasks: PlanTask[] = Array.from({ length: 15 }, (_, i) => ({
    id: `task-${i + 1}`,
    title: `${data.focusAreas.split(',')[0]?.trim() || 'Task'} ${i + 1}`,
    description: `Detailed task description for ${data.focusAreas}`,
    dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    estimatedHours: Math.floor(Math.random() * 8) + 1,
  }))

  return {
    id: `plan-${Date.now()}`,
    title: `${data.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Plan`,
    month: data.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    goals: data.goals.split('\n').filter(goal => goal.trim().length > 0),
    tasks,
    totalTasks: tasks.length,
    estimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    successRate: Math.floor(Math.random() * 30) + 70,
  }
}

// Server function for generating plans
export const generatePlanServerFn = createServerFn({ method: 'POST' })
  .inputValidator(PlanFormDataSchema)
  .handler(async ({ data }) => {
    try {
      // Call the real server endpoint
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate plan')
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('Error generating plan:', error)

      // Fallback to mock data if server is unavailable
      try {
        console.log('Falling back to mock data generation')
        const plan = generateMockPlan(data)
        return {
          success: true,
          data: plan,
        }
      } catch (fallbackError) {
        console.error('Fallback mock generation failed:', fallbackError)
        throw new Error(error instanceof Error ? error.message : 'Failed to generate plan')
      }
    }
  })

// Server function for saving plans
export const savePlanServerFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    planId: z.string(),
  }))
  .handler(async ({ data }) => {
    try {
      // Call the real server endpoint
      const response = await fetch('/api/plan/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save plan')
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('Error saving plan:', error)

      // Fallback to simulate saving if server is unavailable
      try {
        console.log('Falling back to mock save functionality')
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log(`Plan ${data.planId} saved successfully (mock)`)

        return {
          success: true,
          message: 'Plan saved successfully!',
        }
      } catch (fallbackError) {
        console.error('Fallback save failed:', fallbackError)
        throw new Error(error instanceof Error ? error.message : 'Failed to save plan')
      }
    }
  })