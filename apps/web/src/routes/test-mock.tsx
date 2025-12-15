import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { planApi, API_ENDPOINTS, currentApiBaseUrl } from '@/lib/api-utils'

export const Route = createFileRoute('/test-mock')({
  component: TestMockRoute,
})

function TestMockRoute() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testHealthCheck = async () => {
    try {
      const response = await fetch('/api/mock/health')
      const data = await response.json()
      addResult('Health Check', response.ok, data)
    } catch (error) {
      addResult('Health Check', false, null, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testGenerateEnvAware = async () => {
    try {
      const testData = {
        goals: 'Test goal for environment-aware API',
        complexity: 'Moderate',
        focusAreas: 'Testing, Development',
        weekendPreference: 'Strategic Planning',
        fixedCommitments: ['Test commitment'],
        month: 'December 2024'
      }

      const result = await planApi.generate(testData)
      addResult('Generate Plan (Env-Aware)', result.success, result)
    } catch (error) {
      addResult('Generate Plan (Env-Aware)', false, null, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testGenerateClassic = async () => {
    try {
      const testData = {
        userId: 'test-user',
        goalsText: 'Test goal for classic fetch API',
        taskComplexity: 'Balanced',
        focusAreas: 'Testing, Development',
        weekendPreference: 'Mixed',
        fixedCommitmentsJson: {
          commitments: [
            {
              dayOfWeek: 'Monday',
              startTime: '09:00',
              endTime: '10:00',
              description: 'Test meeting'
            }
          ]
        }
      }

      const response = await fetch('/api/mock/plan/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      addResult('Generate Plan (Classic)', response.ok, data)
    } catch (error) {
      addResult('Generate Plan (Classic)', false, null, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testSavePlan = async () => {
    try {
      // First generate a plan to get an ID
      const generateResult = await planApi.generate({
        goals: 'Test goal for save functionality',
        complexity: 'Simple',
        focusAreas: 'Testing',
        weekendPreference: 'Rest & Recharge',
        fixedCommitments: [],
      })

      if (generateResult.success && generateResult.data?.id) {
        const saveResult = await planApi.save(generateResult.data.id)
        addResult('Save Plan', saveResult.success, saveResult)
      } else {
        addResult('Save Plan', false, null, 'Failed to generate plan for save test')
      }
    } catch (error) {
      addResult('Save Plan', false, null, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const testGetPlan = async () => {
    try {
      // First generate a plan
      const generateResult = await planApi.generate({
        goals: 'Test goal for get functionality',
        complexity: 'Ambitious',
        focusAreas: 'Testing, API',
        weekendPreference: 'Deep Work',
        fixedCommitments: ['Test commitment'],
      })

      if (generateResult.success && generateResult.data?.id) {
        const getResult = await planApi.get(generateResult.data.id)
        addResult('Get Plan', getResult.success, getResult)
      } else {
        addResult('Get Plan', false, null, 'Failed to generate plan for get test')
      }
    } catch (error) {
      addResult('Get Plan', false, null, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setResults([])

    await testHealthCheck()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testGenerateEnvAware()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testGenerateClassic()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testSavePlan()
    await new Promise(resolve => setTimeout(resolve, 500))

    await testGetPlan()

    setIsLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Code className="h-8 w-8" />
          Mock API Testing
        </h1>
        <p className="text-muted-foreground mb-4">
          Test the mock API endpoints for all three variations
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Base URL</Badge>
            <code className="bg-muted px-2 py-1 rounded text-sm">{currentApiBaseUrl}</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Generate Endpoint</Badge>
            <code className="bg-muted px-2 py-1 rounded text-sm">{API_ENDPOINTS.GENERATE_PLAN}</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Save Endpoint</Badge>
            <code className="bg-muted px-2 py-1 rounded text-sm">{API_ENDPOINTS.SAVE_PLAN}</code>
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run tests to verify all API endpoints are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={runAllTests} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running All Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
            <Button onClick={testHealthCheck} variant="outline" disabled={isLoading}>
              Health Check
            </Button>
            <Button onClick={testGenerateEnvAware} variant="outline" disabled={isLoading}>
              Test Generate (Env-Aware)
            </Button>
            <Button onClick={testGenerateClassic} variant="outline" disabled={isLoading}>
              Test Generate (Classic)
            </Button>
            <Button onClick={testSavePlan} variant="outline" disabled={isLoading}>
              Test Save
            </Button>
            <Button onClick={testGetPlan} variant="outline" disabled={isLoading}>
              Test Get
            </Button>
            <Button onClick={clearResults} variant="destructive" disabled={isLoading}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from API endpoint tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.test}</h4>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {result.timestamp}
                      </div>
                      {result.success && result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium mb-1">
                            Response Data
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                      {result.error && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}