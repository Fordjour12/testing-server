import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Target, AlertCircle, Eye, Trash2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { currentApiBaseUrl } from '@/lib/api-utils'

interface StagingPlan {
   id: number
   stagingKey: string
   planData: {
      id: string
      title: string
      month: string
      goals: string[]
      tasks: Array<{
         id: string
         title: string
         description?: string
         dueDate: string
         priority: 'High' | 'Medium' | 'Low'
         category: string
         estimatedHours?: number
      }>
      totalTasks: number
      estimatedHours: number
   }
   extractionConfidence: number
   extractionNotes: string
   expiresAt: string
   isSaved: boolean
   monthYear: string
}

export const Route = createFileRoute('/plans/')({
   component: RouteComponent,
})

function RouteComponent() {
   const [stagingPlans, setStagingPlans] = useState<StagingPlan[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const { data: sessionData } = authClient.useSession()

   useEffect(() => {
      fetchStagingPlans()
   }, [sessionData])

   const fetchStagingPlans = async () => {
      try {
         setLoading(true)
         const response = await fetch(`${currentApiBaseUrl}/api/staging`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
               'X-User-ID': String(sessionData?.user.id),
            }
         })

         if (!response.ok) {
            throw new Error('Failed to fetch staging plans')
         }

         const result = await response.json()

         if (result.success) {
            // Filter plans for current user (plans are already filtered by user on backend)
            const userPlans = result.data.filter((plan: StagingPlan) =>
               !plan.isSaved
            )
            setStagingPlans(userPlans)
         } else {
            throw new Error(result.error || 'No staging plans found')
         }
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Failed to load staging plans')
         console.error('Error fetching staging plans:', err)
      } finally {
         setLoading(false)
      }
   }

   const handleViewPlan = (stagingKey: string) => {
      window.location.href = `${window.location.origin}/plans/${stagingKey}`
   }

   const handleSavePlan = async (stagingKey: string) => {
      try {
         const response = await fetch(`${currentApiBaseUrl}/api/staging/${stagingKey}/save`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ confirmed: true })
         })

         if (response.ok) {
            alert('Plan saved successfully!')
            fetchStagingPlans() // Refresh the list
         } else {
            const errorData = await response.json()
            alert(`Failed to save plan: ${errorData.error || 'Unknown error'}`)
         }
      } catch (err) {
         console.error('Save error:', err)
         alert('Failed to save plan. Please try again.')
      }
   }

   const handleDeletePlan = async (stagingKey: string) => {
      if (!confirm('Are you sure you want to delete this plan?')) {
         return
      }

      try {
         const response = await fetch(`${currentApiBaseUrl}/api/staging/${stagingKey}`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
            }
         })

         if (response.ok) {
            fetchStagingPlans() // Refresh the list
         } else {
            const errorData = await response.json()
            alert(`Failed to delete plan: ${errorData.error || 'Unknown error'}`)
         }
      } catch (err) {
         console.error('Delete error:', err)
         alert('Failed to delete plan. Please try again.')
      }
   }

   const isExpired = (expiresAt: string) => {
      return new Date() > new Date(expiresAt)
   }

   const getPriorityColor = (priority: string) => {
      switch (priority) {
         case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
         case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
         case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
         default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      }
   }

   if (loading) {
      return (
         <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
               </div>
               <div>
                  <h1 className="text-2xl font-bold tracking-tight">Loading Plans...</h1>
                  <p className="text-muted-foreground">Fetching your staged plans</p>
               </div>
            </div>
            <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                  <Card key={i}>
                     <CardContent className="p-6">
                        <div className="space-y-4">
                           <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
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

   if (error) {
      return (
         <div className="container mx-auto px-4 py-8">
            <Card className="border-destructive/20 max-w-2xl mx-auto">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                     <AlertCircle className="h-5 w-5" />
                     Error Loading Plans
                  </CardTitle>
                  <CardDescription>{error}</CardDescription>
               </CardHeader>
            </Card>
         </div>
      )
   }

   return (
      <div className="min-h-screen bg-background">
         {/* Header */}
         <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                     <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                     <h1 className="text-2xl font-bold tracking-tight">Staged Plans</h1>
                     <p className="text-muted-foreground">Your AI-generated plans awaiting review</p>
                  </div>
               </div>
            </div>
         </header>

         {/* Plans List */}
         <main className="container mx-auto px-4 py-8">
            {stagingPlans.length === 0 ? (
               <Card className="max-w-2xl mx-auto">
                  <CardHeader className="text-center">
                     <CardTitle className="flex items-center justify-center gap-2">
                        <Calendar className="h-5 w-5" />
                        No Staged Plans
                     </CardTitle>
                     <CardDescription>
                        You don't have any staged plans yet. Generate a new plan to see it here.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                     <Button onClick={() => window.location.href = `${window.location.origin}/generate`}>
                        Generate Your First Plan
                     </Button>
                  </CardContent>
               </Card>
            ) : (
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl font-semibold">
                        {stagingPlans.length} {stagingPlans.length === 1 ? 'Plan' : 'Plans'} Staged
                     </h2>
                     <Badge variant="outline">
                        {stagingPlans.filter(plan => isExpired(plan.expiresAt)).length} expired
                     </Badge>
                  </div>

                  {stagingPlans.map((plan) => (
                     <Card key={plan.stagingKey} className={`border-l-4 ${isExpired(plan.expiresAt) ? 'border-l-red-500 opacity-75' : 'border-l-blue-500'}`}>
                        <CardHeader>
                           <div className="flex items-start justify-between">
                              <div>
                                 <CardTitle className="text-lg">{plan.planData.title}</CardTitle>
                                 <CardDescription className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    {plan.planData.month}
                                    <span className="mx-2">•</span>
                                    <Target className="h-4 w-4" />
                                    {plan.planData.goals.length} goals
                                    <span className="mx-2">•</span>
                                    <Clock className="h-4 w-4" />
                                    {plan.planData.totalTasks} tasks
                                 </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Badge variant={isExpired(plan.expiresAt) ? 'destructive' : 'secondary'}>
                                    {isExpired(plan.expiresAt) ? 'Expired' : 'Active'}
                                 </Badge>
                                 <Badge variant="outline">
                                    {plan.extractionConfidence}% confidence
                                 </Badge>
                              </div>
                           </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {/* Goals Preview */}
                           <div>
                              <h4 className="font-medium mb-2">Key Goals</h4>
                              <div className="space-y-1">
                                 {plan.planData.goals.slice(0, 3).map((goal, index) => (
                                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                       <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                       {goal}
                                    </div>
                                 ))}
                                 {plan.planData.goals.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                       +{plan.planData.goals.length - 3} more goals
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Tasks Preview */}
                           <div>
                              <h4 className="font-medium mb-2">Sample Tasks</h4>
                              <div className="space-y-2">
                                 {plan.planData.tasks.slice(0, 3).map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                                       <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-primary rounded-full" />
                                          <span className="text-sm">{task.title}</span>
                                       </div>
                                       <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                          {task.priority}
                                       </Badge>
                                    </div>
                                 ))}
                                 {plan.planData.tasks.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                       +{plan.planData.tasks.length - 3} more tasks
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Actions */}
                           <div className="flex items-center justify-between pt-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                 Expires: {new Date(plan.expiresAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                 <Button
                                    onClick={() => handleViewPlan(plan.stagingKey)}
                                    variant="outline"
                                    size="sm"
                                    disabled={isExpired(plan.expiresAt)}
                                 >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                 </Button>
                                 <Button
                                    onClick={() => handleSavePlan(plan.stagingKey)}
                                    size="sm"
                                    disabled={isExpired(plan.expiresAt) || plan.isSaved}
                                 >
                                    Save Plan
                                 </Button>
                                 <Button
                                    onClick={() => handleDeletePlan(plan.stagingKey)}
                                    variant="ghost"
                                    size="sm"
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </main>
      </div>
   )
}
