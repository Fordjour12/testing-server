// Environment-aware API utility with base URL configuration

export interface ApiConfig {
  baseUrl: string
  timeout: number
  headers: Record<string, string>
}

// Default API configuration
const defaultConfig: ApiConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Get API base URL based on environment
function getApiBaseUrl(): string {
  // Check if we're in browser
  if (typeof window !== 'undefined') {
    // Browser environment - use environment variable or fallback
    const envBaseUrl = import.meta.env?.VITE_API_BASE_URL
    if (envBaseUrl) {
      return envBaseUrl
    }

    // Development fallback
    if (import.meta.env?.DEV) {
      return 'http://localhost:3002'
    }

    // Production fallback - use current origin
    return window.location.origin
  }

  // Server environment - use environment variable or fallback
  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL
  }

  // Fallback to localhost for server-side
  return 'http://localhost:3000'
}

// Enhanced fetch with error handling and timeout
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  config: Partial<ApiConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config }
  const url = endpoint.startsWith('http') ? endpoint : `${finalConfig.baseUrl}${endpoint}`

  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...finalConfig.headers,
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return (await response.text()) as T
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: ${finalConfig.timeout}ms`)
      }
      throw error
    }

    throw new Error('An unexpected error occurred')
  }
}

// API endpoints - Updated to use mock endpoints for testing
export const API_ENDPOINTS = {
  GENERATE_PLAN: '/api/mock/plan/generate',
  SAVE_PLAN: '/api/mock/plan/save',
  GET_PLAN: '/api/mock/plan',
  HEALTH_CHECK: '/api/mock/health',
} as const

// Helper functions for specific API calls
export const planApi = {
  // Generate plan with form data
  generate: (data: any) =>
    apiFetch(API_ENDPOINTS.GENERATE_PLAN, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Save plan by ID
  save: (planId: string) =>
    apiFetch(API_ENDPOINTS.SAVE_PLAN, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),

  // Get plan by ID
  get: (planId: string) =>
    apiFetch(`${API_ENDPOINTS.GET_PLAN}/${planId}`),
}

// Export the base URL for debugging
export const currentApiBaseUrl = getApiBaseUrl()