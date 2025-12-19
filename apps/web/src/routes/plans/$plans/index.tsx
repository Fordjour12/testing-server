import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, Target, AlertCircle, CheckCircle, Save, Trash2 } from 'lucide-react'
import { currentApiBaseUrl } from '@/lib/api-utils'
import { authClient } from '@/lib/auth-client'

interface Task {
  id: string
  title: string
  description?: string
  dueDate: string
  priority: 'High' | 'Medium' | 'Low'
  category: string
  estimatedHours?: number
}

interface PlanData {
  id: string
  title: string
  month: string
  goals: string[]
  tasks: Task[]
  totalTasks: number
  estimatedHours: number
}

interface StagingPlan {
  id: number
  stagingKey: string
  planData: PlanData
  extractionConfidence: number
  extractionNotes: string
  expiresAt: string
  isSaved: boolean
  monthYear: string
}

export const Route = createFileRoute('/plans/$plans/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { plans } = Route.useParams()
  const [plan, setPlan] = useState<StagingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { data: sessionData } = authClient.useSession()

  useEffect(() => {
    fetchPlan()
  }, [plans, sessionData])

  const fetchPlan = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${currentApiBaseUrl}/api/staging/${plans}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': String(sessionData?.user.id),
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Plan not found or expired')
        }
        throw new Error('Failed to fetch plan')
      }

      const result = await response.json()

      if (result.success) {
        setPlan(result.data)
      } else {
        throw new Error(result.error || 'Failed to load plan')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan')
      console.error('Error fetching plan:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    if (!plan) return

    try {
      setSaving(true)
      const response = await fetch(`${currentApiBaseUrl}/api/staging/${plan.stagingKey}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmed: true })
      })

      if (response.ok) {
        alert('Plan saved successfully!')
        // Update local state to reflect saved status
        setPlan({ ...plan, isSaved: true })
      } else {
        const errorData = await response.json()
        alert(`Failed to save plan: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!plan || !confirm('Are you sure you want to delete this plan?')) {
      return
    }

    try {
      const response = await fetch(`${currentApiBaseUrl}/api/staging/${plan.stagingKey}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        alert('Plan deleted successfully!')
        window.location.href = `${window.location.origin}/plans`
      } else {
        const errorData = await response.json()
        alert(`Failed to delete plan: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete plan. Please try again.')
    }
  }

  const handleGoBack = () => {
    window.location.href = `${window.location.origin}/plans`
  }

  const isExpired = plan ? new Date() > new Date(plan.expiresAt) : false
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    ]
    return colors[category.length % colors.length]
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Loading Plan...</h1>
            <p className="text-muted-foreground">Fetching your plan details</p>
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/20 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Plan
            </CardTitle>
            <CardDescription>{error || 'Plan not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={handleGoBack} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{plan.planData.title}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {plan.planData.month}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {isExpired ? 'Expired' : plan.isSaved ? 'Saved' : 'Staged'}
              </Badge>
              <Badge variant="outline">
                {plan.extractionConfidence}% confidence
              </Badge>
              <Button
                onClick={handleSavePlan}
                disabled={isExpired || plan.isSaved || saving}
                size="sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Plan'}
              </Button>
              <Button
                onClick={handleDeletePlan}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Goals and Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Plan Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Plan Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{plan.planData.totalTasks}</div>
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{plan.planData.estimatedHours}</div>
                    <div className="text-sm text-muted-foreground">Est. Hours</div>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goals:</span>
                    <span className="font-medium">{plan.planData.goals.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categories:</span>
                    <span className="font-medium">{[...new Set(plan.planData.tasks.map(t => t.category))].length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{new Date(plan.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.planData.goals.map((goal, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {plan.extractionNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    AI Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{plan.extractionNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tasks ({plan.planData.tasks.length})
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of all tasks in this plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.planData.tasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`text-xs ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimatedHours}h
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
