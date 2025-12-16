import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SignupForm } from '@/components/signup-form'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/signup')({
   component: RouteComponent,
})

function RouteComponent() {
   const [isLoading, setIsLoading] = useState(false)
   const [message, setMessage] = useState<string | null>(null)


   return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
         <div className="w-full max-w-md">
            {message && (
               <Card className="mb-6">
                  <CardContent className="pt-6">
                     <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-destructive'}`}>
                        {message}
                     </p>
                  </CardContent>
               </Card>
            )}

            <SignupForm isLoading={isLoading} />
         </div>
      </div>
   )
}
