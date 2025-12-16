import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { LoginForm } from "@/components/login-form"
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/login')({
   component: RouteComponent,
})

function RouteComponent() {
   const [isLoading, setIsLoading] = useState(false)
   const [message, setMessage] = useState<string | null>(null)

   return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
         <div className="w-full max-w-sm">
            {message && (
               <Card className="mb-6">
                  <CardContent className="pt-6">
                     <p className={`text-sm ${message.includes('successful') ? 'text-green-600' : 'text-destructive'}`}>
                        {message}
                     </p>
                  </CardContent>
               </Card>
            )}

            <LoginForm isLoading={isLoading} />
         </div>
      </div>
   )
}


