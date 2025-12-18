import { createFileRoute } from '@tanstack/react-router'
import { TokenRequestForm } from '@/components/token-request-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Info } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/token/request')({
   component: RouteComponent,
})



function RouteComponent() {
   const navigate = useNavigate()

   const handleSuccess = () => {
      navigate({ to: '/tokens' })
   }

   const handleCancel = () => {
      navigate({ to: '/tokens' })
   }

   return (
      <div className="min-h-screen bg-background">
         {/* Header */}
         <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-6">
               <div className="flex items-center gap-4">
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={handleCancel}
                  >
                     <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                     <h1 className="text-2xl font-bold tracking-tight">Request More Tokens</h1>
                     <p className="text-muted-foreground">Submit a request for additional generation tokens</p>
                  </div>
               </div>
            </div>
         </header>

         {/* Main Content */}
         <main className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="space-y-6">
               {/* Request Guidelines */}
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Request Guidelines
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4 text-sm">
                        <div className="p-4 rounded-lg bg-muted/50">
                           <h4 className="font-medium mb-2">Before requesting:</h4>
                           <ul className="space-y-1 text-muted-foreground">
                              <li>• Check your current usage patterns</li>
                              <li>• Plan your upcoming projects carefully</li>
                              <li>• Consider if you can optimize your current token usage</li>
                           </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50">
                           <h4 className="font-medium mb-2">Request limits:</h4>
                           <ul className="space-y-1 text-muted-foreground">
                              <li>• Maximum 100 tokens per request</li>
                              <li>• Detailed reason required (10+ characters)</li>
                              <li>• Urgency level helps us prioritize requests</li>
                           </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50">
                           <h4 className="font-medium mb-2">Processing time:</h4>
                           <ul className="space-y-1 text-muted-foreground">
                              <li>• High urgency: 1-2 hours</li>
                              <li>• Medium urgency: 4-8 hours</li>
                              <li>• Low urgency: 24-48 hours</li>
                           </ul>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Request Form */}
               <TokenRequestForm
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
               />

               {/* Contact Information */}
               <Card>
                  <CardHeader>
                     <CardTitle>Need Help?</CardTitle>
                     <CardDescription>
                        If you have questions about token requests or need immediate assistance
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                        <div>
                           <h4 className="font-medium mb-2">Contact Support</h4>
                           <p className="text-sm text-muted-foreground mb-3">
                              Our team is available to help you with token management and usage optimization.
                           </p>
                           <div className="flex gap-3">
                              <Button variant="outline" size="sm">
                                 Email Support
                              </Button>
                              <Button variant="outline" size="sm">
                                 Live Chat
                              </Button>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </main>
      </div>
   )
}
