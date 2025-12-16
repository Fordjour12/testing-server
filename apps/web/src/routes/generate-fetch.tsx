import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Brain, Calendar, Clock, Target, Zap, Plus, X, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
   InputGroupText,
} from '@/components/ui/input-group'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AIPlanResponse } from '@/components/ai-plan-response'
import { currentApiBaseUrl } from '@/lib/api-utils'


export const Route = createFileRoute('/generate-fetch')({
   component: GenerateFetchRoute,
})

function GenerateFetchRoute() {
   const [isGenerating, setIsGenerating] = useState(false)
   const [hasGenerated, setHasGenerated] = useState(false)
   const [generatedPlan, setGeneratedPlan] = useState<any>(null)
   const [error, setError] = useState<string | undefined>()
   const [formData, setFormData] = useState({
      userId: 'user-123', // Hardcoded for demo
      goalsText: '',
      taskComplexity: 'Balanced' as 'Simple' | 'Balanced' | 'Ambitious',
      focusAreas: '',
      weekendPreference: 'Mixed' as 'Work' | 'Rest' | 'Mixed',
      commitments: [] as Array<{
         id: string,
         dayOfWeek: '',
         startTime: '',
         endTime: '',
         description: ''
      }>
   })

   const addCommitment = () => {
      setFormData(prev => ({
         ...prev,
         commitments: [...prev.commitments, {
            id: Date.now().toString(),
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            description: ''
         }]
      }))
   }

   const removeCommitment = (id: string) => {
      setFormData(prev => ({
         ...prev,
         commitments: prev.commitments.filter(c => c.id !== id)
      }))
   }

   const updateCommitment = (id: string, field: string, value: string) => {
      setFormData(prev => ({
         ...prev,
         commitments: prev.commitments.map(c =>
            c.id === id ? { ...c, [field]: value } : c
         )
      }))
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsGenerating(true)
      setError(undefined)

      try {
         // Classic fetch approach with manual error handling
         const response = await fetch(`${currentApiBaseUrl}/api/mock/plan/inputs`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               ...formData,
               fixedCommitmentsJson: {
                  commitments: formData.commitments.filter(c =>
                     c.dayOfWeek && c.startTime && c.endTime && c.description
                  )
               }
            }),
         })

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
         }

         const result = await response.json()

         if (result.success) {
            setHasGenerated(true)
            // Mock plan data for demo - replace with actual API response
            const mockPlan = {
               id: result.planId || 'plan-' + Date.now(),
               title: 'Your Personalized Monthly Plan',
               month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
               goals: formData.goalsText.split('.').filter(g => g.trim()).slice(0, 5),
               tasks: [
                  {
                     id: '1',
                     title: 'Launch Q4 Marketing Campaign',
                     description: 'Complete campaign materials and schedule',
                     dueDate: '2024-12-15',
                     priority: 'High' as const,
                     category: 'Marketing',
                     estimatedHours: 20
                  },
                  {
                     id: '2',
                     title: 'User Research Analysis',
                     description: 'Analyze feedback from 50+ user interviews',
                     dueDate: '2024-12-20',
                     priority: 'Medium' as const,
                     category: 'Research',
                     estimatedHours: 15
                  },
                  {
                     id: '3',
                     title: 'API Documentation Update',
                     description: 'Complete v2.0 documentation',
                     dueDate: '2024-12-25',
                     priority: 'Medium' as const,
                     category: 'Development',
                     estimatedHours: 10
                  },
                  {
                     id: '4',
                     title: 'Revenue Analytics Dashboard',
                     description: 'Build comprehensive analytics dashboard',
                     dueDate: '2024-12-28',
                     priority: 'High' as const,
                     category: 'Analytics',
                     estimatedHours: 25
                  },
                  {
                     id: '5',
                     title: 'Team Performance Review',
                     description: 'Conduct quarterly performance reviews',
                     dueDate: '2024-12-30',
                     priority: 'Low' as const,
                     category: 'HR',
                     estimatedHours: 8
                  }
               ],
               totalTasks: 24,
               estimatedHours: 120
            }
            setGeneratedPlan(mockPlan)
         } else {
            setError(result.error || 'Failed to generate plan')
         }
      } catch (error) {
         console.error('Error generating plan:', error)
         setError(error instanceof Error ? error.message : 'Network error. Please try again.')
      } finally {
         setIsGenerating(false)
      }
   }

   const handleRegenerate = () => {
      setHasGenerated(false)
      setGeneratedPlan(null)
      setError(undefined)
      handleSubmit(new Event('submit') as any)
   }

   const handleSave = () => {
      // Implement save functionality
      console.log('Saving plan:', generatedPlan)
      alert('Plan saved successfully!')
   }

   const handleViewFull = () => {
      // Navigate to full plan view
      console.log('Viewing full plan:', generatedPlan?.id)
   }

   return (
      <div className="min-h-screen bg-background">
         {/* Header */}
         <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                     <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                     <h1 className="text-2xl font-bold tracking-tight">Generate AI Plan</h1>
                     <p className="text-muted-foreground">Create a personalized monthly plan with AI assistance</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                     Classic Fetch API
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                     Manual error handling
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                     Direct API calls
                  </Badge>
               </div>
            </div>
         </header>

         {/* Main Content with Flex Layout */}
         <main className={`container mx-auto px-4 py-8 ${hasGenerated ? 'lg:flex lg:gap-8' : 'max-w-4xl'}`}>
            {/* Form Section - Left side on desktop, full width on mobile */}
            <div className={`${hasGenerated ? 'lg:flex-1' : ''}`}>
               <form onSubmit={handleSubmit} className="space-y-8">
                  {/* API Info Card */}
                  <Card className="border-green-200 dark:border-green-800">
                     <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                           <Code className="h-4 w-4 text-green-600" />
                           API Approach: Classic Fetch
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="pt-0">
                        <div className="space-y-2 text-xs text-muted-foreground">
                           <div>• Direct fetch() API calls</div>
                           <div>• Manual error handling</div>
                           <div>• No TypeScript validation</div>
                           <div>• Endpoint: /api/plan/inputs</div>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Goals Section */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Target className="h-5 w-5" />
                           Your Goals & Objectives
                        </CardTitle>
                        <CardDescription>
                           Describe what you want to achieve this month. Be specific about your goals, deadlines, and desired outcomes.
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <Textarea
                           value={formData.goalsText}
                           onChange={(e) => setFormData(prev => ({ ...prev, goalsText: e.target.value }))}
                           placeholder="e.g., I want to launch my e-commerce website, learn React, and exercise 3 times per week. I need to complete the website by end of month and have a job interview scheduled for week 3..."
                           className="min-h-30"
                           required
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                           The more detailed your goals, the better AI can tailor your plan.
                        </p>
                     </CardContent>
                  </Card>

                  {/* Task Complexity */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Zap className="h-5 w-5" />
                           Task Complexity
                        </CardTitle>
                        <CardDescription>
                           Choose how ambitious you want your monthly plan to be.
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <RadioGroup
                           value={formData.taskComplexity}
                           onValueChange={(value) => setFormData(prev => ({ ...prev, taskComplexity: value as any }))}
                           className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Simple" id="simple" />
                              <Label htmlFor="simple" className="cursor-pointer">
                                 <div className="font-medium">Simple</div>
                                 <div className="text-sm text-muted-foreground">Fewer, manageable tasks</div>
                              </Label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Balanced" id="balanced" />
                              <Label htmlFor="balanced" className="cursor-pointer">
                                 <div className="font-medium">Balanced</div>
                                 <div className="text-sm text-muted-foreground">Mix of easy and challenging</div>
                              </Label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Ambitious" id="ambitious" />
                              <Label htmlFor="ambitious" className="cursor-pointer">
                                 <div className="font-medium">Ambitious</div>
                                 <div className="text-sm text-muted-foreground">Challenging but rewarding</div>
                              </Label>
                           </div>
                        </RadioGroup>
                     </CardContent>
                  </Card>

                  {/* Focus Areas */}
                  <Card>
                     <CardHeader>
                        <CardTitle>Focus Areas</CardTitle>
                        <CardDescription>
                           What areas do you want to focus on this month?
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <InputGroup>
                           <InputGroupAddon align="inline-start">
                              <InputGroupText>
                                 <Target className="h-4 w-4" />
                              </InputGroupText>
                           </InputGroupAddon>
                           <InputGroupInput
                              value={formData.focusAreas}
                              onChange={(e) => setFormData(prev => ({ ...prev, focusAreas: e.target.value }))}
                              placeholder="e.g., Health, Career, Learning, Personal Growth"
                              required
                           />
                        </InputGroup>
                        <p className="text-xs text-muted-foreground mt-2">
                           Separate multiple areas with commas.
                        </p>
                     </CardContent>
                  </Card>

                  {/* Weekend Preference */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Calendar className="h-5 w-5" />
                           Weekend Preference
                        </CardTitle>
                        <CardDescription>
                           How would you like to handle weekends in your plan?
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <RadioGroup
                           value={formData.weekendPreference}
                           onValueChange={(value) => setFormData(prev => ({ ...prev, weekendPreference: value as any }))}
                           className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Work" id="work" />
                              <Label htmlFor="work" className="cursor-pointer">
                                 <div className="font-medium">Work</div>
                                 <div className="text-sm text-muted-foreground">Include tasks on weekends</div>
                              </Label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Rest" id="rest" />
                              <Label htmlFor="rest" className="cursor-pointer">
                                 <div className="font-medium">Rest</div>
                                 <div className="text-sm text-muted-foreground">Keep weekends free</div>
                              </Label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Mixed" id="mixed" />
                              <Label htmlFor="mixed" className="cursor-pointer">
                                 <div className="font-medium">Mixed</div>
                                 <div className="text-sm text-muted-foreground">Light activities only</div>
                              </Label>
                           </div>
                        </RadioGroup>
                     </CardContent>
                  </Card>

                  {/* Fixed Commitments */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Clock className="h-5 w-5" />
                           Fixed Commitments
                        </CardTitle>
                        <CardDescription>
                           Add any regular commitments or blocked time slots (optional).
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        {formData.commitments.map((commitment) => (
                           <div key={commitment.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-lg">
                              <Select
                                 value={commitment.dayOfWeek}
                                 onValueChange={(value) => updateCommitment(commitment.id, 'dayOfWeek', value)}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder="Day" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="Monday">Monday</SelectItem>
                                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                                    <SelectItem value="Thursday">Thursday</SelectItem>
                                    <SelectItem value="Friday">Friday</SelectItem>
                                    <SelectItem value="Saturday">Saturday</SelectItem>
                                    <SelectItem value="Sunday">Sunday</SelectItem>
                                 </SelectContent>
                              </Select>

                              <InputGroup>
                                 <InputGroupAddon align="inline-start">
                                    <InputGroupText>
                                       <Clock className="h-3 w-3" />
                                    </InputGroupText>
                                 </InputGroupAddon>
                                 <InputGroupInput
                                    type="time"
                                    value={commitment.startTime}
                                    onChange={(e) => updateCommitment(commitment.id, 'startTime', e.target.value)}
                                 />
                              </InputGroup>

                              <InputGroup>
                                 <InputGroupAddon align="inline-start">
                                    <InputGroupText>
                                       <Clock className="h-3 w-3" />
                                    </InputGroupText>
                                 </InputGroupAddon>
                                 <InputGroupInput
                                    type="time"
                                    value={commitment.endTime}
                                    onChange={(e) => updateCommitment(commitment.id, 'endTime', e.target.value)}
                                 />
                              </InputGroup>

                              <Input
                                 value={commitment.description}
                                 onChange={(e) => updateCommitment(commitment.id, 'description', e.target.value)}
                                 placeholder="Activity description"
                                 className="md:col-span-2"
                              />

                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 onClick={() => removeCommitment(commitment.id)}
                                 className="h-8 w-8"
                              >
                                 <X className="h-4 w-4" />
                              </Button>
                           </div>
                        ))}

                        <Button
                           type="button"
                           variant="outline"
                           onClick={addCommitment}
                           className="w-full"
                        >
                           <Plus className="mr-2 h-4 w-4" />
                           Add Commitment
                        </Button>
                     </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                     <Button
                        type="submit"
                        size="lg"
                        disabled={isGenerating || !formData.goalsText || !formData.focusAreas}
                        className="min-w-50"
                     >
                        {isGenerating ? (
                           <>
                              <Brain className="mr-2 h-4 w-4 animate-pulse" />
                              Generating Your Plan...
                           </>
                        ) : (
                           <>
                              <Zap className="mr-2 h-4 w-4" />
                              Generate AI Plan
                           </>
                        )}
                     </Button>
                  </div>

                  {error && (
                     <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <p className="text-sm text-destructive">{error}</p>
                     </div>
                  )}
               </form>
            </div>

            {/* AI Response Section - Right side on desktop, below form on mobile */}
            {hasGenerated && (
               <div className="lg:w-100 lg:sticky lg:top-8 lg:h-fit">
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
         </main>
      </div>
   )
}
