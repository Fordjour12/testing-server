import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { TokenQuotaCard } from '@/components/token-quota-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, History, Plus, TrendingUp } from 'lucide-react'
import { getTokenQuota, type TokenQuotaResponse } from '@/functions/get-token-quota'
import { Link, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/token/')({
   component: RouteComponent,
})

function RouteComponent() {
   const [quota, setQuota] = useState<TokenQuotaResponse | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const navigate = useNavigate()

   // Fetch quota data on component mount
   useEffect(() => {
      const fetchQuota = async () => {
         try {
            setIsLoading(true)
            setError(null)
            const quotaData = await getTokenQuota()
            setQuota(quotaData)
         } catch (err) {
            console.error('Error fetching quota:', err)
            setError(err instanceof Error ? err.message : 'Failed to load quota information')
         } finally {
            setIsLoading(false)
         }
      }

      fetchQuota()
   }, [])

   const handleRefresh = async () => {
      try {
         setError(null)
         const quotaData = await getTokenQuota()
         setQuota(quotaData)
      } catch (err) {
         console.error('Error refreshing quota:', err)
         setError(err instanceof Error ? err.message : 'Failed to refresh quota information')
      }
   }

   const quickActions = [
      {
         title: 'Generate Plan',
         description: 'Create a new AI-powered monthly plan',
         icon: Zap,
         variant: 'default' as const,
         href: '/generate',
         disabled: quota?.status === 'exceeded'
      },
      {
         title: 'Usage History',
         description: 'View detailed usage statistics',
         icon: History,
         variant: 'outline' as const,
         href: '/tokens/history',
         disabled: false
      },
      {
         title: 'Upgrade Plan',
         description: 'Get more tokens and features',
         icon: TrendingUp,
         variant: 'outline' as const,
         href: '/tokens/upgrade',
         disabled: false
      }
   ]

   return (
      <div className="min-h-screen bg-background">
         {/* Header */}
         <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <h1 className="text-2xl font-bold tracking-tight">Token Management</h1>
                        <p className="text-muted-foreground">Monitor and manage your AI generation quota</p>
                     </div>
                  </div>
                  <Button
                     variant="outline"
                     onClick={handleRefresh}
                     disabled={isLoading}
                  >
                     Refresh
                  </Button>
               </div>
            </div>
         </header>

         {/* Main Content */}
         <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
               {/* Error Display */}
               {error && (
                  <Card className="border-destructive/20 bg-destructive/5">
                     <CardContent className="pt-6">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={handleRefresh}
                           className="mt-2"
                        >
                           Try Again
                        </Button>
                     </CardContent>
                  </Card>
               )}

               {/* Token Quota Card */}
               <TokenQuotaCard quota={quota!} isLoading={isLoading} />

               {/* Quick Actions */}
               <div>
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                           <Card
                              key={action.title}
                              className={`transition-all hover:shadow-md ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                 }`}
                              onClick={() => !action.disabled && navigate({ to: action.href })}
                           >
                              <CardHeader className="pb-3">
                                 <CardTitle className="flex items-center gap-2 text-base">
                                    <Icon className="h-4 w-4" />
                                    {action.title}
                                 </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0">
                                 <CardDescription className="text-sm">
                                    {action.description}
                                 </CardDescription>
                                 <Button
                                    variant={action.variant}
                                    size="sm"
                                    className="mt-3 w-full"
                                    disabled={action.disabled}
                                 >
                                    {action.disabled ? 'Quota Exceeded' : 'Continue'}
                                 </Button>
                              </CardContent>
                           </Card>
                        )
                     })}
                  </div>
               </div>

               {/* Request More Tokens Section */}
               {quota && quota.status !== 'active' && (
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Plus className="h-5 w-5" />
                           Need More Tokens?
                        </CardTitle>
                        <CardDescription>
                           You're running low on tokens. Request additional tokens to continue generating plans.
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="space-y-4">
                           <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-sm">
                                 <strong>Current Status:</strong> {quota.remaining} tokens remaining
                                 <br />
                                 <strong>Reset Date:</strong> {new Date(quota.resetsOn).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                 })}
                              </p>
                           </div>
                           <Link to="/tokens/request">
                              <Button className="w-full">
                                 Request More Tokens
                              </Button>
                           </Link>
                        </div>
                     </CardContent>
                  </Card>
               )}

               {/* Tips Section */}
               <Card>
                  <CardHeader>
                     <CardTitle>Tips for Managing Your Quota</CardTitle>
                     <CardDescription>
                        Make the most of your AI generation quota
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <h4 className="font-medium">🎯 Be Specific</h4>
                           <p className="text-sm text-muted-foreground">
                              Provide detailed goals and preferences to get better results on the first try.
                           </p>
                        </div>
                        <div className="space-y-2">
                           <h4 className="font-medium">📅 Plan Ahead</h4>
                           <p className="text-sm text-muted-foreground">
                              Generate comprehensive monthly plans that cover all your goals for the month.
                           </p>
                        </div>
                        <div className="space-y-2">
                           <h4 className="font-medium">⚡ Track Usage</h4>
                           <p className="text-sm text-muted-foreground">
                              Monitor your usage regularly to ensure you have tokens available when needed.
                           </p>
                        </div>
                        <div className="space-y-2">
                           <h4 className="font-medium">🔄 Refresh Monthly</h4>
                           <p className="text-sm text-muted-foreground">
                              Your quota automatically resets on the first day of each month.
                           </p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </main>
      </div>
   )
}
