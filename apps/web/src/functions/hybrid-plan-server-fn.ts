/**
 * Hybrid Plan Generation Server Function
 * 
 * This replaces the old generate-server-fn.ts with the new hybrid approach.
 * Uses the new /api/plan/generate endpoint that auto-stages drafts.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { currentApiBaseUrl } from '@/lib/api-utils'
import { authMiddleware } from '@/middleware/auth'

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

export interface HybridGeneratePlanResponse {
	draftKey: string
	planData: any
	preferenceId: number
	generatedAt: string
}

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

/**
 * Generate Plan - Hybrid Approach
 * 
 * Calls the new /api/plan/generate endpoint which:
 * 1. Saves preferences
 * 2. Calls AI
 * 3. Auto-stages as draft
 * 4. Returns plan data + draft key
 */
export const generatePlanHybrid = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.inputValidator(GeneratePlanFormDataSchema)
	.handler(async ({ data, context }) => {
		console.log("[generatePlanHybrid] Starting plan generation")
		console.log("[generatePlanHybrid] Session context:", context.session)

		if (!context.session?.user?.id) {
			throw new Error('Authentication required')
		}

		const userId = context.session.user.id
		console.log("[generatePlanHybrid] User ID:", userId)

		try {
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			};

			// Add authorization header with session token
			if (context.session?.session?.token) {
				headers['Authorization'] = `Bearer ${context.session.session.token}`;
			}

			const response = await fetch(`${currentApiBaseUrl}/api/plan/generate`, {
				method: 'POST',
				headers,
				body: JSON.stringify(data),
				credentials: 'include',
			})

			const responseText = await response.text()
			console.log('[generatePlanHybrid] Response status:', response.status)

			if (!response.ok) {
				let errorData
				try {
					errorData = JSON.parse(responseText)
				} catch {
					errorData = { error: responseText }
				}
				console.error('[generatePlanHybrid] Server error:', errorData)
				throw new Error(errorData.error || 'Failed to generate plan')
			}

			const result = JSON.parse(responseText)

			if (!result.success || !result.data) {
				throw new Error('No plan data available')
			}

			console.log('[generatePlanHybrid] Plan generated successfully, draft key:', result.data.draftKey)

			return result.data as HybridGeneratePlanResponse
		} catch (error) {
			console.error('[generatePlanHybrid] Error:', error)
			throw error
		}
	})

/**
 * Confirm Plan - Save Draft Permanently
 * 
 * Calls /api/plan/confirm to move draft to monthly_plans
 */
export const confirmPlanServerFn = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.inputValidator(z.object({ draftKey: z.string() }))
	.handler(async ({ data, context }) => {
		console.log("[confirmPlanServerFn] Confirming plan, draft key:", data.draftKey)

		if (!context.session?.user?.id) {
			throw new Error('Authentication required')
		}

		try {
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
			};

			if (context.session?.session?.token) {
				headers['Authorization'] = `Bearer ${context.session.session.token}`;
			}

			const response = await fetch(`${currentApiBaseUrl}/api/plan/confirm`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ draftKey: data.draftKey }),
				credentials: 'include',
			})

			const result = await response.json()

			if (!result.success) {
				throw new Error(result.error || 'Failed to save plan')
			}

			console.log('[confirmPlanServerFn] Plan saved successfully, ID:', result.data.planId)

			return result.data
		} catch (error) {
			console.error('[confirmPlanServerFn] Error:', error)
			throw error
		}
	})

/**
 * Get Latest Draft
 * 
 * Retrieves the user's latest draft (for page refresh recovery)
 */
export const getLatestDraftServerFn = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		console.log("[getLatestDraftServerFn] Checking for existing draft")

		if (!context.session?.user?.id) {
			throw new Error('Authentication required')
		}

		try {
			const headers: HeadersInit = {};

			if (context.session?.session?.token) {
				headers['Authorization'] = `Bearer ${context.session.session.token}`;
			}

			const response = await fetch(`${currentApiBaseUrl}/api/plan/draft`, {
				method: 'GET',
				headers,
				credentials: 'include',
			})

			const result = await response.json()

			if (!result.success) {
				return null
			}

			console.log('[getLatestDraftServerFn] Draft found:', result.data?.draftKey)

			return result.data
		} catch (error) {
			console.error('[getLatestDraftServerFn] Error:', error)
			return null
		}
	})

/**
 * Discard Draft
 * 
 * Deletes a draft
 */
export const discardDraftServerFn = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.inputValidator(z.object({ draftKey: z.string() }))
	.handler(async ({ data, context }) => {
		console.log("[discardDraftServerFn] Discarding draft:", data.draftKey)

		if (!context.session?.user?.id) {
			throw new Error('Authentication required')
		}

		try {
			const headers: HeadersInit = {};

			if (context.session?.session?.token) {
				headers['Authorization'] = `Bearer ${context.session.session.token}`;
			}

			const response = await fetch(`${currentApiBaseUrl}/api/plan/draft/${data.draftKey}`, {
				method: 'DELETE',
				headers,
				credentials: 'include',
			})

			const result = await response.json()

			if (!result.success) {
				throw new Error(result.error || 'Failed to discard draft')
			}

			console.log('[discardDraftServerFn] Draft discarded successfully')

			return result
		} catch (error) {
			console.error('[discardDraftServerFn] Error:', error)
			throw error
		}
	})
