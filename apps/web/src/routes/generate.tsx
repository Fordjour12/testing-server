import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
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
import { authClient } from '@/lib/auth-client'
import { NotFound } from '@/components/NotFound'

// New Hybrid Flow Components
import { usePlanGeneration, type GenerateInput } from '@/hooks/usePlanGeneration'
import { DraftRecoveryBanner } from '@/components/draft-recovery-banner'
import { AutoSaveIndicator } from '@/components/auto-save-indicator'
import { PlanActionBar } from '@/components/plan-action-bar'

// Validation Schema
import { z } from 'zod'

// Types
import type { MonthlyPlan } from '@/functions/generate-server-fn'

const GeneratePlanFormDataSchema = z.object({
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
   // Use the new hybrid hook
   const {
      draft,
      planData,
      isGenerating,
      isSaving,
      error: hookError,
      hasDraft,
      generate,
      save,
      discard,
      clearError
   } = usePlanGeneration()

   const [hasGenerated, setHasGenerated] = useState(false)
   const [isEditing, setIsEditing] = useState(false)
   const [editedPlan, setEditedPlan] = useState<MonthlyPlan | undefined>(undefined)
   const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)

   // Sync hook error to local error display
   const error = hookError

   authClient.useSession()

   // Effect to handle draft recovery notification
   useEffect(() => {
      // Only show banner if we have a draft but haven't explicitly "generated" (viewed) it yet
      if (hasDraft && !hasGenerated && draft) {
         setShowRecoveryBanner(true)
      } else {
         setShowRecoveryBanner(false)
      }
   }, [hasDraft, hasGenerated, draft])

   // If generation completes, show the plan
   useEffect(() => {
      if (planData && !hasGenerated && !showRecoveryBanner) {
         setHasGenerated(true)
      }
   }, [planData, showRecoveryBanner])


   // Transform planData (JSON) to MonthlyPlan (Component Model)
   const monthlyPlan = useMemo((): MonthlyPlan | null => {
      if (!planData || !planData.weekly_breakdown) return null

      // Use edited plan if available
      if (editedPlan) return editedPlan

      // Otherwise transform raw data
      const tasks: any[] = []
      const goals: string[] = []

      planData.weekly_breakdown.forEach((week: any) => {
         // Collect goals
         if (week.goals) goals.push(...week.goals)

         // Collect tasks
         if (week.daily_tasks) {
            Object.entries(week.daily_tasks).forEach(([day, dayTasks]: [string, any]) => {
               if (Array.isArray(dayTasks)) {
                  dayTasks.forEach((t: any) => {
                     tasks.push({
                        ...t,
                        id: Math.random().toString(36).substr(2, 9),
                        title: t.task_description,
                        description: t.scheduling_reason,
                        category: t.focus_area,
                        priority: t.difficulty_level === 'advanced' ? 'High' :
                           t.difficulty_level === 'moderate' ? 'Medium' : 'Low',
                        status: 'pending'
                     })
                  })
               }
            })
         }
      })

      return {
         id: 0,
         title: planData.monthly_summary ? 'Personalized Monthly Plan' : 'Your Plan',
         month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
         goals: goals.length > 0 ? goals : ['Complete monthly objectives'],
         tasks,
         totalTasks: tasks.length,
         estimatedHours: tasks.length * 2,
         isValid: true
      }
   }, [planData, editedPlan])

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
         clearError()
         setHasGenerated(false)
         setShowRecoveryBanner(false)

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

            // Call the hybrid generation (auto-stages draft)
            const result = await generate(filteredData as GenerateInput)

            if (result) {
               setHasGenerated(true)
            }

         } catch (err) {
            console.error('Plan generation error:', err)
         }
      }
   })

   const handleRecoverDraft = () => {
      setHasGenerated(true)
      setShowRecoveryBanner(false)
   }

   const handleDiscardDraft = async () => {
      await discard()
      setShowRecoveryBanner(false)
      setHasGenerated(false)
      setEditedPlan(undefined)
      form.reset()
   }

   const handleRegenerate = async () => {
      setHasGenerated(false)
      setEditedPlan(undefined)
      setIsEditing(false)
      // Trigger form submit again
      form.handleSubmit()
   }

   const handleSave = async () => {
      const planId = await save()
      if (planId) {
         alert(`Plan saved successfully! ID: ${planId}`)
         setHasGenerated(false) // Reset view or navigate
      }
   }

   const handleEdit = () => {
      if (monthlyPlan) {
         setIsEditing(true)
         setEditedPlan(monthlyPlan)
      }
   }

   const handleSaveEdit = (newPlanData: MonthlyPlan) => {
      setEditedPlan(newPlanData)
      setIsEditing(false)
      // Note: We don't update the draft on local edits yet,
      // but that could be a future enhancement
   }

   return (
      <div className="min-h-screen bg-background pb-24">
         {/* Header */}
         <header className="border-b bg-card sticky top-0 z-20 backdrop-blur-md bg-card/80">
            <div className="container mx-auto px-4 py-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <h1 className="text-xl font-bold tracking-tight">Generate AI Plan</h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">Hybrid Architecture</p>
                     </div>
                  </div>

                  {/* Auto-Save Indicator */}
                  <div className="flex items-center gap-4">
                     <AutoSaveIndicator
                        status={isSaving ? 'saving' : hasDraft && !isGenerating ? 'saved' : error ? 'error' : 'idle'}
                        draftKey={draft?.draftKey}
                     />
                  </div>
               </div>
            </div>
         </header>

         {/* Main Content */}
         <main className={`container mx-auto px-4 py-8 ${hasGenerated ? 'lg:flex lg:gap-8' : 'max-w-4xl'}`}>

            {/* Draft Recovery Banner */}
            {showRecoveryBanner && draft && (
               <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
                  <DraftRecoveryBanner
                     createdAt={draft.createdAt}
                     expiresAt={draft.expiresAt}
                     onView={handleRecoverDraft}
                     onDiscard={handleDiscardDraft}
                     onDismiss={() => setShowRecoveryBanner(false)}
                  />
               </div>
            )}

            {/* Form Section */}
            <div className={`${hasGenerated ? 'hidden lg:block lg:w-1/3' : 'w-full'} transition-all duration-300`}>
               {hasGenerated && (
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-lg font-semibold">Inputs</h2>
                     <Button variant="ghost" size="sm" onClick={() => setHasGenerated(false)} className="lg:hidden">
                        Edit Inputs
                     </Button>
                  </div>
               )}

               <Example title='Plan Configuration' about="Customize your generation preferences">
                  <form
                     onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                     }}
                     className="space-y-6"
                  >
                     {/* Goals Sections */}
                     <Card>
                        <CardHeader className="pb-3">
                           <CardTitle className="text-base flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Goals
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <form.Field name="goalsText">
                              {(field) => (
                                 <div className="space-y-2">
                                    <Textarea
                                       value={field.state.value}
                                       onChange={(e) => field.handleChange(e.target.value)}
                                       placeholder="What do you want to achieve?"
                                       className="min-h-24 resize-none"
                                    />
                                    <FieldInfo field={field} />
                                 </div>
                              )}
                           </form.Field>
                        </CardContent>
                     </Card>

                     {/* Preferences Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                           <CardHeader className="pb-3">
                              <CardTitle className="text-base">Complexity</CardTitle>
                           </CardHeader>
                           <CardContent>
                              <form.Field name="taskComplexity">
                                 {(field) => (
                                    <Select
                                       value={field.state.value}
                                       onValueChange={(val: any) => field.handleChange(val)}
                                    >
                                       <SelectTrigger>
                                          <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="Simple">Simple</SelectItem>
                                          <SelectItem value="Balanced">Balanced</SelectItem>
                                          <SelectItem value="Ambitious">Ambitious</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 )}
                              </form.Field>
                           </CardContent>
                        </Card>

                        <Card>
                           <CardHeader className="pb-3">
                              <CardTitle className="text-base">Weekend</CardTitle>
                           </CardHeader>
                           <CardContent>
                              <form.Field name="weekendPreference">
                                 {(field) => (
                                    <Select
                                       value={field.state.value}
                                       onValueChange={(val: any) => field.handleChange(val)}
                                    >
                                       <SelectTrigger>
                                          <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="Work">Deep Work</SelectItem>
                                          <SelectItem value="Mixed">Mixed</SelectItem>
                                          <SelectItem value="Rest">Rest</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 )}
                              </form.Field>
                           </CardContent>
                        </Card>
                     </div>

                     <Card>
                        <CardHeader className="pb-3">
                           <CardTitle className="text-base">Focus Areas</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <form.Field name="focusAreas">
                              {(field) => (
                                 <Input
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="e.g. Work, Health, Reading"
                                 />
                              )}
                           </form.Field>
                        </CardContent>
                     </Card>

                     {/* Submit Button */}
                     <div className="pt-2">
                        <Button
                           type="submit"
                           className="w-full"
                           size="lg"
                           disabled={isGenerating}
                        >
                           {isGenerating ? (
                              <>
                                 <Brain className="mr-2 h-4 w-4 animate-pulse" />
                                 Generating...
                              </>
                           ) : (
                              <>
                                 <Zap className="mr-2 h-4 w-4" />
                                 {hasGenerated ? 'Regenerate' : 'Generate Plan'}
                              </>
                           )}
                        </Button>
                     </div>
                  </form>
               </Example>
            </div>

            {/* Preview Section */}
            <div className={`flex-1 ${hasGenerated ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}`}>
               {/* Generation Status */}
               {isGenerating && (
                  <div className="lg:sticky lg:top-24">
                     <ParsingStatus
                        isLoading={true}
                        aiResponse={null}
                        error={undefined}
                     />
                  </div>
               )}

               {/* Plan Display */}
               {!isGenerating && monthlyPlan && (
                  <div className="lg:sticky lg:top-24 space-y-6">
                     {isEditing && editedPlan ? (
                        <PlanEditor
                           monthlyPlan={editedPlan}
                           onSave={handleSaveEdit}
                           onCancel={() => setIsEditing(false)}
                        />
                     ) : (
                        <DirectPlanDisplay
                           isLoading={false}
                           aiResponse={{
                              rawContent: '',
                              metadata: {
                                 confidence: 95,
                                 contentLength: 0,
                                 format: 'json' as const,
                                 detectedFormat: 'json' as const,
                                 extractionNotes: 'Plan recovered from secure draft',
                                 parsingErrors: [],
                                 missingFields: []
                              },
                              structuredData: planData as any
                           }}
                           monthlyPlan={monthlyPlan}
                           error={error || undefined}
                           onRegenerate={handleRegenerate}
                           onSave={handleSave}
                           onEdit={handleEdit}
                           onViewFull={() => alert('View full plan')}
                        />
                     )}
                  </div>
               )}
            </div>
         </main>

         {/* Floating Action Bar */}
         {hasGenerated && monthlyPlan && !isEditing && (
            <PlanActionBar
               onSave={handleSave}
               onDiscard={handleDiscardDraft}
               onRegenerate={handleRegenerate}
               isSaving={isSaving}
               expiresAt={draft?.expiresAt}
            />
         )}
      </div>
   )
}
