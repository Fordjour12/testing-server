import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Calendar, Target, Zap, BarChart3, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InputGroup } from '@/components/ui/input-group'
import { InputGroupInput } from '@/components/ui/input-group'
import { InputGroupText } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AIPlanResponse } from '@/components/ai-plan-response'
import { generatePlanServerFn, savePlanServerFn, type Priority, type PlanFormData, type MonthlyPlan } from '@/lib/server-functions'

export const Route = createFileRoute('/generate-server-fn')({
  component: GenerateServerFnRoute,
})

function GenerateServerFnRoute() {
  const [formData, setFormData] = useState<PlanFormData>({
    goals: '',
    complexity: 'Moderate',
    focusAreas: '',
    weekendPreference: 'Strategic Planning',
    fixedCommitments: [],
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  })

  const [newCommitment, setNewCommitment] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<MonthlyPlan | undefined>(undefined)
  const [error, setError] = useState<string | undefined>()

  const handleGenerate = async () => {
    if (!formData.goals || !formData.focusAreas) {
      setError('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    setError(undefined)
    setHasGenerated(true)

    try {
      // Use TanStack Start server function
      const result = await generatePlanServerFn({ data: formData })

      if (result.success) {
        setGeneratedPlan(result.data)
      } else {
        setError('Failed to generate plan')
      }
    } catch (err) {
      console.error('Error generating plan:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedPlan) return

    try {
      // Use TanStack Start server function
      const result = await savePlanServerFn({ data: { planId: generatedPlan.id } })

      if (result.success) {
        console.log(result.message)
      }
    } catch (err) {
      console.error('Error saving plan:', err)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleViewFull = () => {
    console.log('Viewing full plan:', generatedPlan)
  }

  const addCommitment = () => {
    if (newCommitment.trim() && formData.fixedCommitments.length < 5) {
      setFormData(prev => ({
        ...prev,
        fixedCommitments: [...prev.fixedCommitments, newCommitment.trim()]
      }))
      setNewCommitment('')
    }
  }

  const removeCommitment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fixedCommitments: prev.fixedCommitments.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className={`min-h-screen bg-background transition-all duration-300 ${hasGenerated ? 'lg:pl-8' : ''}`}>
      <div className={`transition-all duration-300 ${hasGenerated ? 'lg:mr-[500px]' : ''}`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Generate Monthly Plan</h1>
            <p className="text-muted-foreground">
              Create a personalized AI-powered plan based on your goals and preferences
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                TanStack Start Server Functions
              </Badge>
              <Badge variant="outline" className="text-xs">
                Type-safe API calls
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Planning Preferences
              </CardTitle>
              <CardDescription>
                Tell us about your goals and work style to generate a personalized monthly plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Goals */}
              <div className="space-y-2">
                <label className="text-sm font-medium">What are your main goals for this month?</label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="E.g., Launch new product feature, Improve team collaboration, Learn new framework..."
                  value={formData.goals}
                  onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                />
              </div>

              {/* Complexity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">How ambitious should this plan be?</label>
                <RadioGroup
                  value={formData.complexity}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, complexity: value }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Simple" id="simple" />
                    <label htmlFor="simple" className="text-sm">
                      Simple - Focus on 1-2 major goals with steady progress
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Moderate" id="moderate" />
                    <label htmlFor="moderate" className="text-sm">
                      Moderate - Balance multiple goals with realistic deadlines
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ambitious" id="ambitious" />
                    <label htmlFor="ambitious" className="text-sm">
                      Ambitious - Push boundaries with challenging targets
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Focus Areas */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Main focus areas</label>
                <InputGroup>
                  <InputGroupInput
                    placeholder="e.g., Product Development, Team Management, Personal Growth"
                    value={formData.focusAreas}
                    onChange={(e) => setFormData(prev => ({ ...prev, focusAreas: e.target.value }))}
                  />
                  <InputGroupText>
                    <BarChart3 className="h-4 w-4" />
                  </InputGroupText>
                </InputGroup>
              </div>

              {/* Weekend Preference */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Weekend Preference</label>
                <Select value={formData.weekendPreference} onValueChange={(value: any) => setFormData(prev => ({ ...prev, weekendPreference: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="How do you prefer to use weekends?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deep Work">Deep Work - Focus on complex projects</SelectItem>
                    <SelectItem value="Strategic Planning">Strategic Planning - Plan upcoming week/month</SelectItem>
                    <SelectItem value="Learning & Development">Learning & Development - Skill building</SelectItem>
                    <SelectItem value="Light Tasks">Light Tasks - Quick wins and maintenance</SelectItem>
                    <SelectItem value="Rest & Recharge">Rest & Recharge - Minimal work</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fixed Commitments */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fixed Commitments (optional)</label>
                <InputGroup>
                  <InputGroupInput
                    placeholder="Add meetings, appointments, or regular commitments"
                    value={newCommitment}
                    onChange={(e) => setNewCommitment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCommitment())}
                  />
                  <InputGroupText>
                    <Calendar className="h-4 w-4" />
                  </InputGroupText>
                  <Button onClick={addCommitment} variant="ghost" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </InputGroup>

                {formData.fixedCommitments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.fixedCommitments.map((commitment, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {commitment}
                        <button
                          onClick={() => removeCommitment(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Month */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Planning Month</label>
                <InputGroup>
                  <InputGroupInput
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  />
                </InputGroup>
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate AI Plan
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Response - Fixed on right side for desktop, below for mobile */}
      {hasGenerated && (
        <div className="fixed top-0 right-0 h-full w-[500px] bg-background border-l overflow-y-auto lg:block hidden z-40">
          <div className="p-6">
            <AIPlanResponse
              isLoading={isGenerating}
              error={error}
              plan={generatedPlan}
              onRegenerate={handleRegenerate}
              onSave={handleSave}
              onViewFull={handleViewFull}
            />
          </div>
        </div>
      )}

      {/* Mobile AI Response - Shows below form */}
      {hasGenerated && (
        <div className="lg:hidden mt-8 px-4 pb-8">
          <AIPlanResponse
            isLoading={isGenerating}
            error={error}
            plan={generatedPlan}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
            onViewFull={handleViewFull}
          />
        </div>
      )}
    </div>
  )
}