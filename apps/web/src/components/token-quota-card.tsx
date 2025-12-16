import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, TrendingUp, Calendar, Clock } from "lucide-react"
import { TokenQuotaResponse } from "@/functions/get-token-quota"

interface TokenQuotaCardProps {
  quota: TokenQuotaResponse
  isLoading?: boolean
}

export function TokenQuotaCard({ quota, isLoading = false }: TokenQuotaCardProps) {
  const getStatusColor = (status: TokenQuotaResponse['status']) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'low':
        return 'secondary'
      case 'exceeded':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: TokenQuotaResponse['status']) => {
    switch (status) {
      case 'active':
        return 'Good Standing'
      case 'low':
        return 'Running Low'
      case 'exceeded':
        return 'Quota Exceeded'
      default:
        return 'Unknown'
    }
  }

  const getProgressColor = (status: TokenQuotaResponse['status']) => {
    switch (status) {
      case 'active':
        return ''
      case 'low':
        return 'bg-orange-500'
      case 'exceeded':
        return 'bg-red-500'
      default:
        return ''
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Token Usage Status
          </CardTitle>
          <CardDescription>
            Loading your generation quota...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-1 bg-muted animate-pulse rounded" />
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Token Usage Status
        </CardTitle>
        <CardDescription>
          Current month generation quota and usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Usage</span>
            <Badge variant={getStatusColor(quota.status)}>
              {getStatusText(quota.status)}
            </Badge>
          </div>
          <Progress
            value={quota.usagePercentage}
            className={`h-2 ${getProgressColor(quota.status)}`}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{quota.generationsUsed} used</span>
            <span>{quota.totalAllowed} total</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-md bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{quota.remaining}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-md bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{quota.daysUntilReset}</p>
              <p className="text-xs text-muted-foreground">Days until reset</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-md bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium truncate">
                {new Date(quota.resetsOn).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-muted-foreground">Reset date</p>
            </div>
          </div>
        </div>

        {/* Usage Percentage Summary */}
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Usage this month</span>
            <span className={`text-2xl font-bold ${
              quota.status === 'exceeded' ? 'text-red-600' :
              quota.status === 'low' ? 'text-orange-600' :
              'text-primary'
            }`}>
              {quota.usagePercentage}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {quota.generationsUsed} of {quota.totalAllowed} generations used
          </p>
        </div>
      </CardContent>
    </Card>
  )
}