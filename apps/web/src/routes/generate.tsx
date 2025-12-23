import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Brain, Calendar, Clock, Target, Zap, Plus, X } from 'lucide-react'
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
import { DirectPlanDisplay } from '@/components/direct-plan-display'
import { ParsingStatus } from '@/components/parsing-status'
import { PlanEditor } from '@/components/plan-editor'
import { Example } from '@/components/example'
import { useForm, type AnyFieldApi } from '@tanstack/react-form'
import {
   generatePlanServerFn,
   GeneratePlanFormDataSchema,
   type GeneratePlanResponse,
   type MonthlyPlan
} from '@/functions/generate-server-fn'
import { authClient } from '@/lib/auth-client'
import { NotFound } from '@/components/NotFound'

// Reusable FieldInfo component for validation display
function FieldInfo({ field }: { field: AnyFieldApi }) {
   return (
      <>
         {field.state.meta.isTouched && !field.state.meta.isValid && (
            <p className="text-sm text-red-500">
               {field.state.meta.errors.map((err) => err.message).join(',')}
            </p>
         )}
         {field.state.meta.isValidating && (
            <p className="text-sm text-muted-foreground">Validating...</p>
         )}
      </>
   )
}

export const Route = createFileRoute('/generate')({
   component: RouteComponent,
   notFoundComponent: () => <NotFound />,
})

function RouteComponent() {
   const [isGenerating, setIsGenerating] = useState(false)
   const [hasGenerated, setHasGenerated] = useState(false)
   const [isEditing, setIsEditing] = useState(false)
   const [isParsing, setIsParsing] = useState(false)
   const [generateResponse, setGenerateResponse] = useState<GeneratePlanResponse | undefined>(undefined)
   const [editedPlan, setEditedPlan] = useState<MonthlyPlan | undefined>(undefined)
   const [error, setError] = useState<string | undefined>()

   authClient.useSession()

   const form = useForm({
      defaultValues: {
         goalsText: '',
         taskComplexity: 'Balanced' as 'Simple' | 'Balanced' | 'Ambitious',
         focusAreas: '',
         weekendPreference: 'Mixed' as 'Work' | 'Rest' | 'Mixed',
         fixedCommitmentsJson: {
            commitments: [] as Array<{
               dayOfWeek: string
               startTime: string
               endTime: string
               description: string
            }>
         }
      },
      validators: {
         onChange: GeneratePlanFormDataSchema,
         onBlur: GeneratePlanFormDataSchema,
      },
      onSubmit: async ({ value }) => {
         setIsGenerating(true)
         setError(undefined)
         setIsParsing(true)
         setHasGenerated(false)

         try {
            // Filter out empty commitments
            const filteredData = {
               ...value,
               fixedCommitmentsJson: {
                  commitments: value.fixedCommitmentsJson.commitments.filter(c =>
                     c.dayOfWeek && c.startTime && c.endTime && c.description
                  )
               }
            }

            const result = await generatePlanServerFn({ data: filteredData })

            // Simulate parsing progress for better UX
            setTimeout(() => {
               setIsParsing(false)
               setHasGenerated(true)
               setGenerateResponse(result)
            }, 2000)

         } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan'
            setError(errorMessage)
            setIsParsing(false)
            console.error('Plan generation error:', err)
         } finally {
            setIsGenerating(false)
         }
      }
   })



   const handleRegenerate = () => {
      setHasGenerated(false)
      setGenerateResponse(undefined)
      setEditedPlan(undefined)
      setIsEditing(false)
      setError(undefined)
      form.handleSubmit()
   }

   const handleSave = async () => {
      if (!generateResponse) return

      try {
         // Call the save parsed plan endpoint
         const response = await fetch(`${window.location.origin}/api/plan/save-parsed`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
body: JSON.stringify({
                preferenceId: generateResponse.preferenceId,
                monthYear: generateResponse.monthYear,
                aiResponse: generateResponse.aiResponse,
                monthlyPlan: editedPlan || generateResponse.monthlyPlan
             })
         })

         if (response.ok) {
            alert('Plan saved successfully!')
         } else {
            const errorData = await response.json()
            alert(`Failed to save plan: ${errorData.error || 'Unknown error'}`)
         }
      } catch (err) {
         console.error('Save error:', err)
         alert('Failed to save plan. Please try again.')
      }
   }

   const handleEdit = () => {
      setIsEditing(true)
      setEditedPlan(generateResponse?.monthlyPlan)
   }

   const handleSaveEdit = (editedPlanData: MonthlyPlan) => {
      setEditedPlan(editedPlanData)
      setIsEditing(false)
   }

   const handleCancelEdit = () => {
      setIsEditing(false)
      setEditedPlan(undefined)
   }

   const handleViewFull = () => {
      if (!generateResponse?.monthlyPlan?.id) return

      // Navigate to plan details or open modal
      console.log('Viewing full plan:', generateResponse.monthlyPlan.id)
      // You could navigate to a detailed view:
      // window.location.href = `/plans/${generateResponse.monthlyPlan.id}`
      // Or open a modal with full details
      alert(`Full plan view for plan ID: ${generateResponse.monthlyPlan.id} - This would navigate to a detailed view`)
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
                     <h1 className="text-2xl font-bold tracking-tight">Generate AI Plan (TanStack Forms)</h1>
                     <p className="text-muted-foreground">Create a personalized monthly plan with AI assistance using TanStack Forms</p>
                  </div>
               </div>
            </div>
         </header>

         {/* Main Content with Flex Layout */}
         <main className={`container mx-auto px-4 py-8 ${hasGenerated ? 'lg:flex lg:gap-8' : 'max-w-4xl'}`}>
            {/* Form Section - Left side on desktop, full width on mobile */}
            <div className={`${hasGenerated ? 'lg:flex-1' : ''}`}>
               <Example title='Generate AI Plan (TanStack Forms)' about="Create a personalized monthly plan with AI assistance using TanStack Forms">
                  <form
                     onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                     }}
                     className="space-y-8"
                  >
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
                           <form.Field
                              name="goalsText"
                              validators={{
                                 onChange: GeneratePlanFormDataSchema.shape.goalsText,
                              }}
                           >
                              {(field) => (
                                 <div className="space-y-2">
                                    <Textarea
                                       value={field.state.value}
                                       onChange={(e) => field.handleChange(e.target.value)}
                                       placeholder="e.g., I want to launch my e-commerce website, learn React, and exercise 3 times per week. I need to complete the website by end of month and have a job interview scheduled for week 3..."
                                       className={`min-h-30 ${field.state.meta.errors.length > 0 ? 'border-red-500' : ''}`}
                                    />
                                    <FieldInfo field={field} />
                                    <p className="text-xs text-muted-foreground">
                                       The more detailed your goals, the better AI can tailor your plan.
                                    </p>
                                 </div>
                              )}
                           </form.Field>
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
                           <form.Field name="taskComplexity">
                              {(field) => (
                                 <RadioGroup
                                    value={field.state.value}
                                    onValueChange={(value) => field.handleChange(value as 'Simple' | 'Balanced' | 'Ambitious')}
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
                              )}
                           </form.Field>
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
                           <form.Field
                              name="focusAreas"
                              validators={{
                                 onChange: GeneratePlanFormDataSchema.shape.focusAreas,
                              }}
                           >
                              {(field) => (
                                 <div className="space-y-2">
                                    <InputGroup>
                                       <InputGroupAddon align="inline-start">
                                          <InputGroupText>
                                             <Target className="h-4 w-4" />
                                          </InputGroupText>
                                       </InputGroupAddon>
                                       <InputGroupInput
                                          value={field.state.value}
                                          onChange={(e) => field.handleChange(e.target.value)}
                                          placeholder="e.g., Health, Career, Learning, Personal Growth"
                                          className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                                       />
                                    </InputGroup>
                                    <FieldInfo field={field} />
                                    <p className="text-xs text-muted-foreground">
                                       Separate multiple areas with commas.
                                    </p>
                                 </div>
                              )}
                           </form.Field>
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
                           <form.Field name="weekendPreference">
                              {(field) => (
                                 <div className="space-y-3">
                                    <RadioGroup
                                       value={field.state.value}
                                       onValueChange={(value) => field.handleChange(value as 'Work' | 'Rest' | 'Mixed')}
                                       className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                    >
                                       <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Work" id="work" />
                                          <Label htmlFor="work" className="cursor-pointer">
                                             <div className="font-medium">Deep Work</div>
                                             <div className="text-sm text-muted-foreground">Focus on intensive tasks</div>
                                          </Label>
                                       </div>
                                       <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Rest" id="rest" />
                                          <Label htmlFor="rest" className="cursor-pointer">
                                             <div className="font-medium">Rest & Recharge</div>
                                             <div className="text-sm text-muted-foreground">Keep weekends free</div>
                                          </Label>
                                       </div>
                                       <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Mixed" id="mixed" />
                                          <Label htmlFor="mixed" className="cursor-pointer">
                                             <div className="font-medium">Light Tasks</div>
                                             <div className="text-sm text-muted-foreground">Easy activities only</div>
                                          </Label>
                                       </div>
                                    </RadioGroup>
                                    <FieldInfo field={field} />
                                 </div>
                              )}
                           </form.Field>
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
                           <form.Field name="fixedCommitmentsJson.commitments" mode="array">
                              {(field) => (
                                 <>
                                    {field.state.value.map((_, i) => (
                                       <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-lg">
                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].dayOfWeek`}>
                                             {(dayField) => (
                                                <Select
                                                   value={dayField.state.value}
                                                   onValueChange={(value) => dayField.handleChange(value)}
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
                                             )}
                                          </form.Field>

                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].startTime`}>
                                             {(timeField) => (
                                                <InputGroup>
                                                   <InputGroupAddon align="inline-start">
                                                      <InputGroupText>
                                                         <Clock className="h-3 w-3" />
                                                      </InputGroupText>
                                                   </InputGroupAddon>
                                                   <InputGroupInput
                                                      type="time"
                                                      value={timeField.state.value}
                                                      onChange={(e) => timeField.handleChange(e.target.value)}
                                                   />
                                                </InputGroup>
                                             )}
                                          </form.Field>

                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].endTime`}>
                                             {(timeField) => (
                                                <InputGroup>
                                                   <InputGroupAddon align="inline-start">
                                                      <InputGroupText>
                                                         <Clock className="h-3 w-3" />
                                                      </InputGroupText>
                                                   </InputGroupAddon>
                                                   <InputGroupInput
                                                      type="time"
                                                      value={timeField.state.value}
                                                      onChange={(e) => timeField.handleChange(e.target.value)}
                                                   />
                                                </InputGroup>
                                             )}
                                          </form.Field>

                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].description`}>
                                             {(descField) => (
                                                <Input
                                                   value={descField.state.value}
                                                   onChange={(e) => descField.handleChange(e.target.value)}
                                                   placeholder="Activity description"
                                                   className="md:col-span-2"
                                                />
                                             )}
                                          </form.Field>

                                          <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             onClick={() => field.removeValue(i)}
                                             className="h-8 w-8"
                                          >
                                             <X className="h-4 w-4" />
                                          </Button>
                                       </div>
                                    ))}

                                    <Button
                                       type="button"
                                       variant="outline"
                                       onClick={() => field.pushValue({
                                          dayOfWeek: '',
                                          startTime: '',
                                          endTime: '',
                                          description: ''
                                       })}
                                       className="w-full"
                                    >
                                       <Plus className="mr-2 h-4 w-4" />
                                       Add Commitment
                                    </Button>
                                 </>
                              )}
                           </form.Field>
                        </CardContent>
                     </Card>

                     {/* Submit Button */}
                     <div className="flex justify-center pt-6">
                        <Button
                           type="submit"
                           size="lg"
                           disabled={isGenerating || form.state.isSubmitting}
                           className="min-w-50"
                        >
                           {isGenerating || form.state.isSubmitting ? (
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

                     {/* Form-level Error Display */}
                     {error && (
                        <div className="p-4 border border-red-500 rounded-lg bg-red-50">
                           <p className="text-sm text-red-700">{error}</p>
                        </div>
                     )}
                  </form>
               </Example>
            </div>

            {/* Parsing Status Section - Shows during parsing */}
            {isParsing && (
               <div className="lg:100 lg:sticky lg:top-8 lg:h-fit">
                  <ParsingStatus
                     isLoading={isParsing}
                     aiResponse={null}
                     error={error}
                  />
               </div>
            )}

            {/* Edit Mode */}
            {isEditing && editedPlan && (
               <div className="lg:100 lg:sticky lg:top-8 lg:h-fit">
                  <PlanEditor
                     monthlyPlan={editedPlan}
                     onSave={handleSaveEdit}
                     onCancel={handleCancelEdit}
                  />
               </div>
            )}

            {/* Direct Plan Display - Shows after parsing is complete */}
            {hasGenerated && !isEditing && generateResponse && (
               <div className="lg:100 lg:sticky lg:top-8 lg:h-fit">
                  <DirectPlanDisplay
                     isLoading={isParsing}
                     aiResponse={generateResponse.aiResponse}
                     monthlyPlan={editedPlan || generateResponse.monthlyPlan}
                     error={error}
                     onRegenerate={handleRegenerate}
                     onSave={handleSave}
                     onEdit={handleEdit}
                     onViewFull={handleViewFull}
                  />
               </div>
            )}
         </main>
      </div>
   )
}
